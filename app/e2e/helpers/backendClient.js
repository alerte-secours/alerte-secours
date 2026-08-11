// Host-side client for the LOCAL backend stack (docker-compose at the repo
// root). Simulates a second user at the API level — same GraphQL operations as
// the app — so bidirectional scenarios don't need a second emulator.
// Runs in the Jest (node) process: uses localhost, not 10.0.2.2.
const crypto = require("crypto");
const { default: Base62Str } = require("base62str");
const sha256 = require("hash.js/lib/hash/sha/256");
const hmac = require("hash.js/lib/hash/hmac");

const base62 = Base62Str.createInstance();

const GRAPHQL_URL =
  process.env.E2E_BACKEND_GRAPHQL_URL || "http://localhost:4201/v1/graphql";
const API_OAS_URL =
  process.env.E2E_BACKEND_API_URL || "http://localhost:4200/api/v1/oas";
const GEOLOC_SYNC_URL = `${API_OAS_URL}/geoloc/sync`;
const HASURA_ADMIN_SECRET = process.env.E2E_HASURA_ADMIN_SECRET || "admin";
// Local compose leaves EXTERNAL_RINGOVER_CALL_EVENT_WEBHOOK_KEY empty.
const RINGOVER_WEBHOOK_KEY = process.env.E2E_RINGOVER_WEBHOOK_KEY || "";

async function gql(query, variables = {}, bearerJwt = null, admin = false) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(bearerJwt ? { authorization: `Bearer ${bearerJwt}` } : {}),
      ...(admin ? { "x-hasura-admin-secret": HASURA_ADMIN_SECRET } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`graphql http ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`graphql errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

function decodeJwtClaims(jwt) {
  const payload = jwt.split(".")[1];
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  const ns = claims["https://alertesecours.fr/claims"];
  return {
    userId: parseInt(ns["x-hasura-user-id"], 10),
    deviceId: parseInt(ns["x-hasura-device-id"], 10),
  };
}

/** Anonymous register + login, same two mutations as the app's auth flow. */
async function registerUser(phoneModel = "e2e-backend-user") {
  const init = await gql(
    `mutation { addOneAuthInitToken { authTokenJwt } }`,
  );
  const login = await gql(
    `mutation($t: String!, $d: ID) {
       doAuthLoginToken(authLoginTokenInput: {
         authTokenJwt: $t, phoneModel: "${phoneModel}", deviceUuid: $d
       }) { userBearerJwt }
     }`,
    { t: init.addOneAuthInitToken.authTokenJwt, d: crypto.randomUUID() },
  );
  const bearerJwt = login.doAuthLoginToken.userBearerJwt;
  return { bearerJwt, ...decodeJwtClaims(bearerJwt) };
}

/** Same endpoint the app's background-geolocation plugin POSTs to. */
async function geolocSync(bearerJwt, { latitude, longitude }) {
  const res = await fetch(GEOLOC_SYNC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bearerJwt}`,
    },
    body: JSON.stringify({
      location: {
        coords: {
          latitude,
          longitude,
          accuracy: 5,
          altitude: 400,
          altitude_accuracy: 5,
          heading: 0,
          speed: 0,
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`geoloc sync ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Waits until the backend proximity matching creates an alerting row for this
 * user (i.e. it "received" someone else's alert). Returns the alertId.
 */
async function waitForAlerting(bearerJwt, { timeoutMs = 60_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const data = await gql(
      `query {
         selectManyAlerting(order_by: { createdAt: desc }, limit: 1) {
           alertId reason createdAt
         }
       }`,
      {},
      bearerJwt,
    );
    const row = data.selectManyAlerting[0];
    if (row) return row;
    if (Date.now() > deadline) {
      throw new Error(`no alerting row for user after ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

/** Same operation as the app's send-alert confirm screen. */
async function sendAlert(
  bearerJwt,
  {
    latitude,
    longitude,
    level = "green",
    subject = "e2e backend alert",
    notifyAround = false,
  },
) {
  const data = await gql(
    `mutation($input: AlertSendAlertInput!) {
       doAlertSendAlert(alertSendAlertInput: $input) {
         alertId code accessCode
       }
     }`,
    {
      input: {
        uuid: crypto.randomUUID(),
        subject,
        level,
        callEmergency: false,
        notifyAround,
        notifyRelatives: false,
        followLocation: false,
        location: { type: "Point", coordinates: [longitude, latitude] },
        accuracy: 5,
        altitude: 400,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
    },
    bearerJwt,
  );
  return data.doAlertSendAlert;
}

async function closeAlert(bearerJwt, alertId) {
  const data = await gql(
    `mutation($alertId: Int!) {
       doAlertClose(alertCloseInput: { alertId: $alertId }) { ok }
     }`,
    { alertId },
    bearerJwt,
  );
  return data.doAlertClose;
}

/** Same mutation as the app's chat input. */
async function sendMessage(bearerJwt, alertId, text) {
  const data = await gql(
    `mutation($alertId: Int!, $text: String!) {
       insertOneMessage(object: { alertId: $alertId, text: $text }) { id }
     }`,
    { alertId, text },
    bearerJwt,
  );
  return data.insertOneMessage;
}

/** Messages of an alert as this user sees them (role "other" permission). */
async function getMessages(bearerJwt, alertId) {
  const data = await gql(
    `query($alertId: Int!) {
       selectManyMessage(
         where: { alertId: { _eq: $alertId } }
         order_by: { id: asc }
       ) { id text contentType userId username }
     }`,
    { alertId },
    bearerJwt,
  );
  return data.selectManyMessage;
}

/**
 * Identity of the emulator app's user, found through the hasura admin
 * secret: the newest device whose phoneModel is not one of this client's
 * simulated users ("e2e-*").
 */
async function getAppDevice() {
  const devices = await gql(
    `query {
       selectManyDevice(
         where: { phoneModel: { _nlike: "e2e-%" } }
         order_by: { id: desc }
         limit: 1
       ) { id userId phoneModel fcmToken }
     }`,
    {},
    null,
    true,
  );
  return devices.selectManyDevice[0] || null;
}

/**
 * FCM pushes need the app's token in DB. On a freshly booted emulator, Play
 * services can take minutes to hand the app a token — fire alerts only after
 * this resolves or the push can never arrive.
 */
async function waitForAppFcmToken(timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const device = await getAppDevice();
    if (device?.fcmToken) return device;
    if (Date.now() > deadline) {
      throw new Error(
        `app device has no fcm token after ${timeoutMs}ms (device: ${JSON.stringify(device)})`,
      );
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
}

async function getAppUserAuth() {
  const device = await getAppDevice();
  if (!device) {
    throw new Error("no app device found in the local DB");
  }
  const keys = await gql(
    `query($userId: Int!) {
       selectManyAuthSignKey(where: { userId: { _eq: $userId } }) { key }
     }`,
    { userId: device.userId },
    null,
    true,
  );
  const signKey = keys.selectManyAuthSignKey[0]?.key;
  if (!signKey) {
    throw new Error(`no auth sign key for user ${device.userId}`);
  }
  return { userId: device.userId, deviceId: device.id, signKey };
}

/** Same code the app builds in useSendAuthSMS (AS_<type>_<base62 payload>). */
function makeAuthSmsCode(userId, signKey, type = "R") {
  const timestampInSeconds = Math.floor(Date.now() / 1000);
  const signature = hmac(sha256, signKey)
    .update(`${userId}.${timestampInSeconds}`)
    .digest("hex");
  return `AS_${type}_${base62.encodeStr(`${userId}.${timestampInSeconds}#${signature}`)}`;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Delivers an inbound SMS exactly like the Ringover webhook does: the event
 * payload travels inside an HS512 JWT signed with the webhook key.
 */
async function postInboundAuthSms({ fromNumber, body }) {
  const claims = { payload: { data: { from_number: fromNumber, body } } };
  const header = base64url(JSON.stringify({ alg: "HS512", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claims));
  const signature = crypto
    .createHmac("sha512", RINGOVER_WEBHOOK_KEY)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const token = `${header}.${payload}.${signature}`;

  const res = await fetch(`${API_OAS_URL}/external/ringover/received-sms`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resource: "sms",
      event: "received",
      timestamp: Math.floor(Date.now() / 1000),
      data: { from_number: fromNumber, body },
    }),
  });
  if (!res.ok) {
    throw new Error(`received-sms webhook ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

module.exports = {
  registerUser,
  geolocSync,
  waitForAlerting,
  sendAlert,
  closeAlert,
  sendMessage,
  getMessages,
  getAppUserAuth,
  waitForAppFcmToken,
  makeAuthSmsCode,
  postInboundAuthSms,
};
