const httpError = require("http-errors")
const jwtDecode = require("jwt-decode")
const { nanoid } = require("nanoid")

const { ctx } = require("@modjo/core")

module.exports = ({ services }) => {
  const config = ctx.require("config.project")
  const sql = ctx.require("postgres")

  const { claimsNamespace, jwtExpirationInHours } = config

  function decodeAuthToken(authTokenJwt) {
    try {
      const { authToken } = jwtDecode(authTokenJwt)
      return authToken
    } catch (e) {
      throw httpError(400, "Invalid auth token JWT")
    }
  }

  async function getOrCreateUserSession(
    authToken,
    phoneModel = null,
    phoneOS = null,
    deviceUuid = null
  ) {
    let userId
    let deviceId
    let roles

    const [row] = await sql`
      SELECT
        "user_id" as "userId",
        "device_id" as "deviceId"
      FROM
        "auth_token"
      WHERE
        "auth_token" = ${authToken}
        AND ("expires_at" IS NULL
          OR "expires_at" > now())
      `
    if (!row) {
      throw httpError(410, "Auth token not found")
    }

    // Sliding expiry: the auth_token is the long-lived credential exchanged for a
    // short-lived bearer. Refresh its 1-year window on every exchange so active
    // devices never expire, while a leaked/forgotten token dies after a year of
    // inactivity. No backfill / forced expiry of existing tokens — an inactive
    // user is never locked out mid-emergency; they simply get a window on next use.
    await sql`
      UPDATE
        "auth_token"
      SET
        "expires_at" = now() + interval '1 year'
      WHERE
        "auth_token" = ${authToken}
      `

    userId = row.userId
    deviceId = row.deviceId

    if (!userId) {
      await sql.begin(async (sql) => {
        await sql`set constraints all deferred`
        ;[{ id: userId }] = await sql`
           INSERT INTO "user" DEFAULT
             VALUES
             RETURNING
               id
           `
        ;[{ id: deviceId }] = await sql`
           INSERT INTO "device" ("user_id", "phone_model", "phone_os", "uuid")
             VALUES (${userId}, ${phoneModel}, ${phoneOS}, ${deviceUuid})
           RETURNING
             id
           `
        await sql`
          UPDATE
            "auth_token"
          SET
            "user_id" = ${userId},
            "device_id" = ${deviceId}
          WHERE
            "auth_token" = ${authToken}
          `

        const role = "user"
        await sql`
          INSERT INTO "user_role" ("user_id", "role")
            VALUES (${userId}, ${role})
          `
        roles = [role]

        const authSignKey = nanoid()
        await sql`
          INSERT INTO "auth_sign_key" ("user_id", "key")
            VALUES (${userId}, ${authSignKey})
          `
      })
    } else {
      if (!deviceId && deviceUuid) {
        // First check if a device with this UUID already exists for this user
        const existingDevice = await sql`
          SELECT
            id
          FROM
            "device"
          WHERE
            "user_id" = ${userId}
            AND "uuid" = ${deviceUuid}
          LIMIT 1
          `

        if (existingDevice.length > 0) {
          deviceId = existingDevice[0].id
        }
      }

      if (!deviceId) {
        // Only create new device if UUID doesn't exist
        ;[{ id: deviceId }] = await sql`
           INSERT INTO "device" ("user_id", "phone_model", "phone_os", "uuid")
             VALUES (${userId}, ${phoneModel}, ${phoneOS}, ${deviceUuid})
           RETURNING
             id
           `
      }

      // Update the auth_token to reference this device
      await sql`
        UPDATE
          "auth_token"
        SET
          "device_id" = ${deviceId}
        WHERE
          "auth_token" = ${authToken}
        `

      roles = (
        await sql`
          SELECT
            "role"
          FROM
            "user_role"
          WHERE
            "user_id" = ${userId}
          `.values()
      ).map(([role]) => role)
    }

    if (roles.length === 0) {
      roles.push("user")
    }

    return { userId, deviceId, roles }
  }

  async function generateUserJwt(userId, deviceId, roles) {
    const hasuraClaim = {}
    hasuraClaim["x-hasura-default-role"] = "user"
    hasuraClaim["x-hasura-allowed-roles"] = roles
    hasuraClaim["x-hasura-user-id"] = userId.toString()
    hasuraClaim["x-hasura-device-id"] = deviceId.toString()

    const exp = Math.round(
      new Date(Date.now() + jwtExpirationInHours * 3600000) / 1000
    )

    const jwtData = {
      [claimsNamespace]: hasuraClaim,
      exp,
    }

    return services.signJwt(jwtData)
  }

  return {
    decodeAuthToken,
    getOrCreateUserSession,
    generateUserJwt,
  }
}
