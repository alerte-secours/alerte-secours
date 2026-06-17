const httpError = require("http-errors")
const { nanoid } = require("nanoid")
const { validate: validateUUID } = require("uuid")

const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")

const isInteger = require("common/oapi/validators/is-integer")
const {
  isFullPhoneNumber,
  parseFullPhoneNumber,
} = require("common/libs/phone-number")

module.exports = async function ({ services: { signJwt } }) {
  // const config = ctx.require("config.project")
  const sql = ctx.require("postgres")

  const getTargetKind = (target) => {
    if (validateUUID(target)) {
      return "deviceUuid"
    }
    if (isInteger(target)) {
      return "userId"
    }
    if (isFullPhoneNumber(target)) {
      return "phoneNumber"
    }
    if (typeof target === "string") {
      return "username"
    }
  }

  async function doAuthImpersonateToken(req) {
    const { target } = req.body

    const targetKind = getTargetKind(target)
    let userId
    let deviceId
    switch (targetKind) {
      case "deviceUuid": {
        const [device] = await sql`
          SELECT
            "id",
            "user_id" as "userId"
          FROM
            "device"
          WHERE
            "uuid" = ${target}
          `

        if (!device) {
          throw httpError(404, "device not found")
        }
        deviceId = device.id
        userId = device.userId
        break
      }
      case "userId": {
        const [user] = await sql`
          SELECT
            "id"
          FROM
            "user"
          WHERE
            "id" = ${target}
          `
        if (!user) {
          throw httpError(404, "userId not found")
        }
        userId = user.id
        break
      }
      case "phoneNumber": {
        const { countryCode, nationalNumber } = parseFullPhoneNumber(target)
        const [phoneNumber] = await sql`
          SELECT
            "user_id" as "userId",
            "device_id" as "deviceId"
          FROM
            "phone_number"
          WHERE
            "number" = ${nationalNumber}
            AND "country" = ${countryCode}
          LIMIT 1
          `
        if (!phoneNumber) {
          throw httpError(404, "phoneNumber not found")
        }
        userId = phoneNumber.userId
        deviceId = phoneNumber.deviceId
        break
      }
      case "username": {
        const [user] = await sql`
          SELECT
            "id"
          FROM
            "user"
          WHERE
            "username" = ${target}
          `
        if (!user) {
          throw httpError(404, "username not found")
        }
        userId = user.id
        break
      }
      default: {
        throw httpError(400)
      }
    }

    if (!deviceId) {
      const [device] = await sql`
        SELECT
          "id"
        FROM
          "device"
        WHERE
          "user_id" = ${userId}
        LIMIT 1
        `
      deviceId = device?.id || null
    }

    const [user] = await sql`
      SELECT
        "deleted"
      FROM
        "user"
      WHERE
        "id" = ${userId}
      LIMIT 1
      `
    if (user.deleted) {
      throw httpError(422, "user is deleted")
    }

    // Audit: impersonation issues a fully authoritative token for another user.
    // Record who impersonated whom so the action is traceable if a `dev` account
    // is ever misused.
    const logger = ctx.require("logger")
    const session = reqCtx.get("session")
    logger.warn(
      {
        impersonatorUserId: session?.userId,
        impersonatorDeviceId: session?.deviceId,
        targetUserId: userId,
        targetDeviceId: deviceId,
        targetKind,
      },
      "AUDIT: account impersonation token issued"
    )

    const plainAuthToken = nanoid()
    await sql`
      INSERT INTO "auth_token" ("auth_token", "user_id", "device_id")
        VALUES (${plainAuthToken}, ${userId}, ${deviceId})
      ON CONFLICT ("device_id")
        DO UPDATE SET
          "auth_token" = ${plainAuthToken}, "user_id" = ${userId}
      `

    const authTokenJwt = await signJwt({ authToken: plainAuthToken })
    return { authTokenJwt }
  }

  return [doAuthImpersonateToken]
}
