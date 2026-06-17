const httpError = require("http-errors")
const { nanoid } = require("nanoid")
const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")

module.exports = async function ({ services: { signJwt } }) {
  const sql = ctx.require("postgres")

  async function deleteLoginRequest(id) {
    await sql`
      DELETE FROM "user_login_request"
      WHERE id = ${id}
      `
  }

  async function doAuthLoginConfimLoginRequest(req) {
    const logger = ctx.require("logger")

    const { loginRequestId, deviceUuid } = req.body

    logger.debug(
      { loginRequestId, deviceUuid },
      "Starting login confirmation request"
    )

    const [userLoginRequest] = await sql`
      SELECT
        "user_id" as "userId",
        "type",
        "phone_number_id" as "phoneNumberId",
        "email_id" as "emailId",
        "updated_at" as "updatedAt"
      FROM
        "user_login_request"
      WHERE
        "id" = ${loginRequestId}
      `

    if (!userLoginRequest) {
      logger.warn({ loginRequestId }, "Login request not found")
      throw httpError(404)
    }

    logger.info(
      { loginRequestId, type: userLoginRequest.type },
      "Login request found"
    )
    const { type, updatedAt } = userLoginRequest

    const expire = new Date()
    expire.setTime(expire.getTime() - 2 * 3600000) // 2 hours

    logger.debug(
      { loginRequestId, updatedAt, expireThreshold: expire },
      "Checking login request expiration"
    )

    if (updatedAt < expire) {
      logger.warn(
        { loginRequestId, updatedAt, expireThreshold: expire },
        "Login request expired, cleaning up"
      )
      deleteLoginRequest(loginRequestId) // cleanup in background
      throw httpError(498, "login request expired")
    }

    logger.info({ loginRequestId }, "Login request is valid and not expired")

    // Security: a login request may only be confirmed by the very session that
    // initiated it. `user_login_request.user_id` is the initiating (anonymous)
    // account; the app always confirms with that same session. Without this
    // check, loginRequestId being a serial integer, any authenticated user could
    // enumerate pending requests and claim another user's account (account takeover).
    const session = reqCtx.get("session")
    if (!session || userLoginRequest.userId !== session.userId) {
      logger.warn(
        {
          loginRequestId,
          requesterUserId: userLoginRequest.userId,
          sessionUserId: session?.userId,
        },
        "Login request confirmation rejected: caller did not initiate the request"
      )
      throw httpError(403, "forbidden")
    }

    let userId
    logger.info({ loginRequestId, type }, "Resolving user ID by login type")

    switch (type) {
      case "phone_number": {
        logger.debug(
          { loginRequestId, phoneNumberId: userLoginRequest.phoneNumberId },
          "Looking up user by phone number"
        )
        const [phoneNumber] = await sql`
          SELECT
            "user_id" as "userId"
          FROM
            "phone_number"
          WHERE
            "id" = ${userLoginRequest.phoneNumberId}
          `
        if (!phoneNumber) {
          logger.error(
            { loginRequestId, phoneNumberId: userLoginRequest.phoneNumberId },
            "Phone number not found"
          )
          throw httpError(404, "Phone number not found")
        }
        userId = phoneNumber.userId
        logger.debug(
          {
            loginRequestId,
            userId,
            phoneNumberId: userLoginRequest.phoneNumberId,
          },
          "User resolved via phone number"
        )
        break
      }
      case "email": {
        logger.debug(
          { loginRequestId, emailId: userLoginRequest.emailId },
          "Looking up user by email"
        )
        const [email] = await sql`
          SELECT
            "user_id" as "userId"
          FROM
            "email"
          WHERE
            "id" = ${userLoginRequest.emailId}
          `
        if (!email) {
          logger.error(
            { loginRequestId, emailId: userLoginRequest.emailId },
            "Email not found"
          )
          throw httpError(404, "Email not found")
        }
        userId = email.userId
        logger.debug(
          { loginRequestId, userId, emailId: userLoginRequest.emailId },
          "User resolved via email"
        )
        break
      }
      default: {
        logger.error({ loginRequestId, type }, "Invalid login request type")
        throw httpError(400)
      }
    }

    logger.info({ loginRequestId }, "Cleaning up login request")
    deleteLoginRequest(loginRequestId) // cleanup in background

    let deviceId = null
    if (deviceUuid) {
      logger.debug(
        { loginRequestId, userId, deviceUuid },
        "Looking up device for user"
      )
      const [matchDevice] = await sql`
        SELECT
          "id"
        FROM
          "device"
        WHERE
          "user_id" = ${userId}
          AND "uuid" = ${deviceUuid}
        `

      if (matchDevice) {
        deviceId = matchDevice.id
        logger.debug(
          { loginRequestId, userId, deviceUuid, deviceId },
          "Device matched for user"
        )
      } else {
        logger.debug(
          { loginRequestId, userId, deviceUuid },
          "No matching device found for user"
        )
      }
    } else {
      logger.debug({ loginRequestId, userId }, "No device UUID provided")
    }

    logger.debug({ loginRequestId, userId, deviceId }, "Generating auth token")
    const plainAuthToken = nanoid()

    await sql`
      INSERT INTO "auth_token" ("auth_token", "user_id", "device_id")
        VALUES (${plainAuthToken}, ${userId}, ${deviceId})
      ON CONFLICT ("device_id")
        DO UPDATE SET
          "auth_token" = ${plainAuthToken}, "user_id" = ${userId}
      `

    logger.debug(
      { loginRequestId, userId, deviceId },
      "Auth token stored in database"
    )

    const authTokenJwt = await signJwt({ authToken: plainAuthToken })

    logger.debug(
      { loginRequestId, userId, deviceId },
      "Login confirmation completed successfully"
    )

    return { authTokenJwt }
  }

  return [doAuthLoginConfimLoginRequest]
}
