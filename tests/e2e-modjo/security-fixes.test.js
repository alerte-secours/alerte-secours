// Targeted regression tests for the security review fixes (branch
// security/review-fixes). Each test asserts BOTH that the vulnerability is
// closed AND that the legitimate flow still works (no regression).
//
//   C1 — confim-login-request must reject confirmation by a session that did
//        not initiate the request (account-takeover IDOR), while still letting
//        the initiating session confirm.
//   H1 — files audio upload must reject a non-participant of the alert (403)
//        while still accepting a participant (the alert creator).
//   H2 — files avatar upload must reject non-image payloads (415) while still
//        accepting a real PNG.
//
// Run against a running stack:
//   cd tests/e2e-modjo
//   node --test --test-reporter=spec security-fixes.test.js

const { test, describe } = require("node:test")
const assert = require("node:assert/strict")
const crypto = require("node:crypto")

const API = process.env.API_URL || "http://localhost:4200"
const HASURA = process.env.HASURA_URL || "http://localhost:4201"
const FILES = process.env.FILES_URL || "http://localhost:4292"
const ADMIN = process.env.HASURA_ADMIN_SECRET || "admin"

const apiGql = `${API}/api/v1/graphql`
const apiOas = (p) => `${API}/api/v1/oas${p}`
const filesOas = (p) => `${FILES}/api/v1/oas${p}`
const uuid = () => crypto.randomUUID()

async function gql(url, query, { variables, token } = {}) {
  const headers = { "content-type": "application/json" }
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  })
  const body = await res.json()
  if (body.errors) {
    throw new Error(`GraphQL error at ${url}: ${JSON.stringify(body.errors)}`)
  }
  return body.data
}

function jwtUserId(token) {
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  )
  return parseInt(
    payload["https://alertesecours.fr/claims"]["x-hasura-user-id"],
    10
  )
}

async function registerAndLogin() {
  const init = await gql(
    apiGql,
    "mutation { addOneAuthInitToken { authTokenJwt } }"
  )
  const { authTokenJwt } = init.addOneAuthInitToken
  const deviceUuid = uuid()
  const login = await gql(
    apiGql,
    `mutation L($i: AuthLoginTokenInput!) {
       doAuthLoginToken(authLoginTokenInput: $i) { userBearerJwt }
     }`,
    { variables: { i: { authTokenJwt, phoneModel: "sec-test", deviceUuid } } }
  )
  const userToken = login.doAuthLoginToken.userBearerJwt
  return { userToken, deviceUuid, userId: jwtUserId(userToken) }
}

async function runSql(sql) {
  const res = await fetch(`${HASURA}/v2/query`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": ADMIN,
    },
    body: JSON.stringify({ type: "run_sql", args: { source: "default", sql } }),
  })
  const body = await res.json()
  // Success is "TuplesOk" (result = rows) or "CommandOk" (result = null for an
  // UPDATE/INSERT without RETURNING). Only the absence of result_type is an error.
  if (!body.result_type) {
    throw new Error(`run_sql failed: ${JSON.stringify(body)}`)
  }
  return body.result // [ [colNames...], [row...], ... ] or null
}

// Create the DB state that exists right after a real SMS/email ownership proof:
// a phone_number owned by `userId` and a user_login_request whose user_id is the
// INITIATING session (== userId). updated_at must be fresh to pass the 2h expiry.
async function seedLoginRequest(userId) {
  const number = String(600000000 + userId)
  const pn = await runSql(
    `INSERT INTO "phone_number" ("user_id","country","number")
     VALUES (${userId},'FR','${number}') RETURNING id;`
  )
  const phoneNumberId = pn[1][0]
  const lr = await runSql(
    `INSERT INTO "user_login_request" ("user_id","type","phone_number_id","updated_at")
     VALUES (${userId},'phone_number',${phoneNumberId}, now())
     ON CONFLICT ("user_id") DO UPDATE SET
       "type"='phone_number',"phone_number_id"=${phoneNumberId},"updated_at"=now()
     RETURNING id;`
  )
  return parseInt(lr[1][0], 10)
}

async function confirmLoginRequest(token, loginRequestId, deviceUuid) {
  return fetch(apiOas("/auth/login/confim-login-request"), {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ loginRequestId, deviceUuid }),
  })
}

async function sendAlert(token) {
  const res = await fetch(apiOas("/alert/send-alert"), {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      uuid: uuid(),
      level: "red",
      subject: "sec-test alert",
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
  assert.equal(res.status, 200, "send-alert should succeed")
  return res.json()
}

async function uploadAudio(token, alertId) {
  const fd = new FormData()
  fd.append("data[alertId]", String(alertId))
  fd.append(
    "data[file]",
    new Blob([Buffer.from([0, 0, 0, 0])], { type: "audio/mp4" }),
    "a.m4a"
  )
  return fetch(filesOas("/audio/upload"), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: fd,
  })
}

async function uploadAvatar(token, bytes, type) {
  const fd = new FormData()
  fd.append("data[file]", new Blob([bytes], { type }), "avatar.png")
  return fetch(filesOas("/avatar"), {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: fd,
  })
}

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
])

describe("C1 — confim-login-request ownership (account-takeover IDOR)", () => {
  test("a foreign session is forbidden from confirming someone else's request (403)", async () => {
    const victim = await registerAndLogin()
    const attacker = await registerAndLogin()
    const loginRequestId = await seedLoginRequest(victim.userId)

    const res = await confirmLoginRequest(
      attacker.userToken,
      loginRequestId,
      attacker.deviceUuid
    )
    assert.equal(
      res.status,
      403,
      "attacker must NOT be able to confirm the victim's login request"
    )
  })

  test("the initiating session can still confirm its own request (no regression)", async () => {
    const victim = await registerAndLogin()
    const loginRequestId = await seedLoginRequest(victim.userId)

    const res = await confirmLoginRequest(
      victim.userToken,
      loginRequestId,
      victim.deviceUuid
    )
    assert.equal(res.status, 200, "the initiator must still be able to confirm")
    const body = await res.json()
    assert.ok(body.authTokenJwt, "should return a fresh authTokenJwt")
  })
})

describe("H1 — audio upload requires alert participation", () => {
  test("a participant (alert creator) can upload audio (200)", async () => {
    const creator = await registerAndLogin()
    const alert = await sendAlert(creator.userToken)
    const res = await uploadAudio(creator.userToken, alert.alertId)
    assert.equal(
      res.status,
      200,
      "alert creator must be allowed to upload audio"
    )
    const body = await res.json()
    assert.ok(body.audioFileUuid && body.messageId, "should return ids")
  })

  test("a non-participant cannot upload audio to a foreign alert (403)", async () => {
    const creator = await registerAndLogin()
    const stranger = await registerAndLogin()
    const alert = await sendAlert(creator.userToken)
    const res = await uploadAudio(stranger.userToken, alert.alertId)
    assert.equal(
      res.status,
      403,
      "a stranger must not post audio onto an alert they don't participate in"
    )
  })
})

describe("H2 — avatar upload validates the real image type", () => {
  test("a real PNG is accepted (200)", async () => {
    const u = await registerAndLogin()
    const res = await uploadAvatar(u.userToken, PNG_BYTES, "image/png")
    assert.equal(res.status, 200, "a real PNG avatar must be accepted")
    const body = await res.json()
    assert.ok(body.imageFileUuid, "should return imageFileUuid")
  })

  test("an HTML payload claiming image/png is rejected (415)", async () => {
    const u = await registerAndLogin()
    const html = Buffer.from("<html><script>alert(1)</script></html>")
    const res = await uploadAvatar(u.userToken, html, "image/png")
    assert.equal(
      res.status,
      415,
      "non-image content must be rejected even if the client lies about the mimetype"
    )
  })
})

describe("M1 — IP+user rate limiting still enforced (shared Redis + memory fallback)", () => {
  test("a second send-connection-email in the window is rate-limited (429)", async () => {
    const u = await registerAndLogin()
    const call = () =>
      fetch(apiOas("/auth/email/send-connection-email"), {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${u.userToken}`,
        },
        body: JSON.stringify({ email: `nobody-${u.userId}@example.test` }),
      })
    // First call consumes the single allowed point (handler may 404 on the
    // unknown email — that's fine, the limiter runs first as middleware).
    const first = await call()
    assert.notEqual(first.status, 429, "first call must not be rate-limited")
    const second = await call()
    assert.equal(
      second.status,
      429,
      "second call within 60s must be rate-limited"
    )
  })
})

describe("H5 — expired auth_token is rejected at login", () => {
  test("an auth_token past its expires_at cannot be exchanged (410)", async () => {
    const init = await gql(
      apiGql,
      "mutation { addOneAuthInitToken { authTokenJwt } }"
    )
    const { authTokenJwt } = init.addOneAuthInitToken
    // the wrapper JWT is intentionally not signature-verified; decode the inner
    // authToken so we can force-expire it in the DB.
    const inner = JSON.parse(
      Buffer.from(authTokenJwt.split(".")[1], "base64").toString()
    ).authToken
    await runSql(
      `UPDATE "auth_token" SET "expires_at" = now() - interval '1 day' WHERE "auth_token" = '${inner}';`
    )
    const res = await fetch(apiOas("/auth/login/token"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authTokenJwt,
        phoneModel: "h5-test",
        deviceUuid: uuid(),
      }),
    })
    assert.equal(
      res.status,
      410,
      "an expired auth_token must be rejected at login"
    )
  })
})

describe("C2 — email existence check via function, no enumeration", () => {
  const hasuraGql = `${HASURA}/v1/graphql`
  test("lookupEmailRegistered answers true/false but the email table can't be enumerated", async () => {
    const u = await registerAndLogin()
    // a verified email belonging to ANOTHER user (not the caller)
    const seeded = `c2-${u.userId}@example.test`
    await runSql(
      `WITH x AS (INSERT INTO "user" DEFAULT VALUES RETURNING id)
       INSERT INTO "email"("user_id","email","verified") SELECT id,'${seeded}',true FROM x;`
    )
    const q = `query($e: String!) { lookupEmailRegistered(args: { check_email: $e }) { registered } }`
    const reg = await gql(hasuraGql, q, {
      variables: { e: seeded },
      token: u.userToken,
    })
    assert.equal(
      reg.lookupEmailRegistered?.[0]?.registered,
      true,
      "a registered email must resolve to true"
    )
    const unreg = await gql(hasuraGql, q, {
      variables: { e: `none-${u.userId}@example.test` },
      token: u.userToken,
    })
    assert.equal(
      unreg.lookupEmailRegistered?.[0]?.registered,
      false,
      "an unknown email must resolve to false"
    )
    // the raw email table is no longer enumerable by a plain user (public_anon
    // select removed): the caller owns no emails, so it must see zero.
    const dump = await gql(hasuraGql, `{ selectManyEmail { email } }`, {
      token: u.userToken,
    })
    assert.equal(
      dump.selectManyEmail.length,
      0,
      "a user must not be able to enumerate other users' emails"
    )
  })
})
