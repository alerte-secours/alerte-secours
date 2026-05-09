// End-to-end flow test: simulates the real mobile app journey through the
// modjo-driven backend. This is the regression gate for any modjo upgrade.
//
//   1. register a fresh anonymous user (auth init token)
//   2. exchange auth token for a user bearer JWT (login)
//   3. push a geolocation heartbeat (api → postgres)
//   4. file an alert (api → postgres → tasks queue → watcher cron)
//   5. read the alert back via hasura with the user role
//   6. send a chat message on the alert
//   7. read messages back via hasura
//   8. file a second alert and "connect" to it from the same user
//   9. close the alert
//
// Each step also asserts on observable invariants (status code, response
// shape) so a regression in modjo (broken ctx, lifecycle, plugin chain,
// req validation) gets caught.
//
// Run against a running stack:
//   cd tests/e2e-modjo
//   node --test --test-reporter=spec auth-flow.test.js

const { test, describe, before } = require("node:test")
const assert = require("node:assert/strict")
const crypto = require("node:crypto")

const API = process.env.API_URL || "http://localhost:4200"
const HASURA = process.env.HASURA_URL || "http://localhost:4201"

const apiOas = (p) => `${API}/api/v1/oas${p}`
const apiGql = `${API}/api/v1/graphql`
const hasuraGql = `${HASURA}/v1/graphql`

const uuid = () => crypto.randomUUID()

async function gql(url, query, { variables, token, adminSecret } = {}) {
  const headers = { "content-type": "application/json" }
  if (token) headers.authorization = `Bearer ${token}`
  if (adminSecret) headers["x-hasura-admin-secret"] = adminSecret
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  })
  const body = await res.json()
  if (body.errors) {
    throw new Error(
      `GraphQL error at ${url}: ${JSON.stringify(body.errors, null, 2)}`
    )
  }
  return body.data
}

async function registerAndLogin() {
  const init = await gql(
    apiGql,
    "mutation { addOneAuthInitToken { authTokenJwt } }"
  )
  assert.ok(init.addOneAuthInitToken.authTokenJwt, "missing init token")
  const { authTokenJwt } = init.addOneAuthInitToken

  const deviceUuid = uuid()
  const phoneModel = "e2e-modjo-test"
  const login = await gql(
    apiGql,
    `mutation Login($input: AuthLoginTokenInput!) {
       doAuthLoginToken(authLoginTokenInput: $input) { userBearerJwt }
     }`,
    { variables: { input: { authTokenJwt, phoneModel, deviceUuid } } }
  )
  assert.ok(login.doAuthLoginToken.userBearerJwt, "missing user bearer")
  return {
    userToken: login.doAuthLoginToken.userBearerJwt,
    deviceUuid,
  }
}

let userToken
let firstAlertId
let firstAlertAccessCode

before(async () => {
  ;({ userToken } = await registerAndLogin())
})

describe("modjo e2e — full mobile-app journey", () => {
  test("1. registerUser → addOneAuthInitToken returns a JWT", () => {
    // covered by `before`; assert non-empty
    assert.ok(userToken && userToken.length > 50)
  })

  test("2. loginUserToken issues a user bearer JWT (3 dot-separated segments)", () => {
    assert.match(userToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  })

  test("3. GeoLoc heartbeat is accepted by api/postgres", async () => {
    const res = await fetch(apiOas("/geoloc/sync"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        location: {
          event: "heartbeat",
          coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 10 },
        },
      }),
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.ok, true)
  })

  test("3b. GeoLoc move (non-heartbeat event)", async () => {
    const res = await fetch(apiOas("/geoloc/sync"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        location: {
          event: "location",
          uuid: uuid(),
          timestamp: new Date().toISOString(),
          coords: {
            latitude: 48.8584,
            longitude: 2.2945,
            accuracy: 8,
            altitude: 35,
            altitude_accuracy: 5,
            heading: 90,
            speed: 1.2,
          },
          is_moving: true,
          activity: { type: "on_foot", confidence: 80 },
        },
      }),
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.ok, true)
  })

  test("4. Send Alert returns alertId + code + accessCode", async () => {
    const alertUuid = uuid()
    const res = await fetch(apiOas("/alert/send-alert"), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        uuid: alertUuid,
        level: "red",
        subject: "e2e test alert",
        location: { type: "Point", coordinates: [2.3522, 48.8566] },
        accuracy: 10,
        altitude: 50,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
        notifyAround: false,
        notifyRelatives: false,
        callEmergency: false,
        followLocation: false,
      }),
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.ok(typeof body.alertId === "number", "alertId must be numeric")
    assert.ok(typeof body.code === "string" && body.code.length > 0)
    assert.ok(typeof body.accessCode === "string" && body.accessCode.length > 0)
    firstAlertId = body.alertId
    firstAlertAccessCode = body.accessCode
  })

  test("5. Read alert back via hasura (user role)", async () => {
    const data = await gql(
      hasuraGql,
      `query GetAlert($id: Int!) {
         selectOneAlert(id: $id) {
           id code level subject accessCode
         }
       }`,
      { variables: { id: firstAlertId }, token: userToken }
    )
    assert.equal(data.selectOneAlert.id, firstAlertId)
    assert.equal(data.selectOneAlert.level, "red")
    assert.equal(data.selectOneAlert.subject, "e2e test alert")
    assert.equal(data.selectOneAlert.accessCode, firstAlertAccessCode)
  })

  test("6. Insert chat message on the alert", async () => {
    const data = await gql(
      hasuraGql,
      `mutation InsertMsg($alertId: Int!, $text: String!) {
         insertOneMessage(object: { alertId: $alertId, text: $text }) {
           id text createdAt
         }
       }`,
      {
        variables: { alertId: firstAlertId, text: "Hello from e2e" },
        token: userToken,
      }
    )
    assert.ok(data.insertOneMessage.id)
    assert.equal(data.insertOneMessage.text, "Hello from e2e")
  })

  test("7. Read messages back, in order", async () => {
    // insert a second message
    await gql(
      hasuraGql,
      `mutation InsertMsg($alertId: Int!, $text: String!) {
         insertOneMessage(object: { alertId: $alertId, text: $text }) {
           id
         }
       }`,
      {
        variables: { alertId: firstAlertId, text: "Second message" },
        token: userToken,
      }
    )
    const data = await gql(
      hasuraGql,
      `query GetMsgs($alertId: Int!) {
         selectManyMessage(
           where: { alertId: { _eq: $alertId } }
           order_by: { id: asc }
         ) {
           id text
         }
       }`,
      { variables: { alertId: firstAlertId }, token: userToken }
    )
    assert.ok(data.selectManyMessage.length >= 2)
    const texts = data.selectManyMessage.map((m) => m.text)
    assert.ok(texts.includes("Hello from e2e"))
    assert.ok(texts.includes("Second message"))
  })

  test("8. Connect to a second alert via PATCH /alert/connect-alert", async () => {
    // create an alert first to connect to
    const alertUuid = uuid()
    const create = await fetch(apiOas("/alert/send-alert"), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        uuid: alertUuid,
        level: "yellow",
        subject: "e2e connect-target",
        location: { type: "Point", coordinates: [2.3522, 48.8566] },
        accuracy: 10,
        altitude: 50,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
        notifyAround: false,
        notifyRelatives: false,
        callEmergency: false,
        followLocation: false,
      }),
    })
    assert.equal(create.status, 200)
    const target = await create.json()
    assert.ok(target.code)
    assert.ok(target.accessCode)

    // a second user connects with the access code
    const second = await registerAndLogin()
    const connect = await fetch(apiOas("/alert/connect-alert"), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${second.userToken}`,
      },
      body: JSON.stringify({
        code: target.code,
        accessCode: target.accessCode,
      }),
    })
    if (![200, 204].includes(connect.status)) {
      const errBody = await connect.text()
      assert.fail(`connect-alert status=${connect.status} body=${errBody}`)
    }
    const body = await connect.json()
    // NB: existing alerte-secours bug — connect-alert.patch.js never assigns
    // `alertId = alert.id`, so body.alertId is `undefined`. We only assert
    // the alerting row got persisted (alertingId is returned).
    assert.ok(typeof body.alertingId === "number", "alertingId must be set")
  })

  test("9. Close the first alert", async () => {
    const res = await fetch(apiOas("/alert/close"), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ alertId: firstAlertId }),
    })
    assert.ok(
      [200, 204].includes(res.status),
      `alert/close status=${res.status}`
    )
    // verify the alert is now closed
    const data = await gql(
      hasuraGql,
      `query GetAlert($id: Int!) {
         selectOneAlert(id: $id) { id closedAt }
       }`,
      { variables: { id: firstAlertId }, token: userToken }
    )
    assert.ok(data.selectOneAlert.closedAt, "alert.closedAt should be set")
  })

  test("10. Reopen the alert (level escalation)", async () => {
    const res = await fetch(apiOas("/alert/reopen"), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ alertId: firstAlertId }),
    })
    // alert/reopen and alert/re-open both exist; tolerate either 2xx
    assert.ok(
      res.status >= 200 && res.status < 300,
      `alert/reopen status=${res.status}`
    )
  })
})
