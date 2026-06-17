const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")
const { default: Base62Str } = require("base62str")
const httpError = require("http-errors")
const sha256 = require("hash.js/lib/hash/sha/256")
const hmac = require("hash.js/lib/hash/hmac")
const { parseFullPhoneNumber } = require("common/libs/phone-number")
const isInteger = require("common/oapi/validators/is-integer")

const base62 = Base62Str.createInstance()

function extractCodeFromBody(message) {
  const pattern = /AS_([A-Z])_([A-Za-z0-9]+)/
  const matches = message.match(pattern)
  if (matches && matches.length > 1) {
    return [matches[1], matches[2]]
  }
  return null
}

function extractCodeParts(message) {
  const pattern = /([^.#]+)\.([^#]+)#(.+)/
  const matches = message.match(pattern)
  if (matches && matches.length > 3) {
    return {
      userId: matches[1],
      timestamp: matches[2],
      signature: matches[3],
    }
  }
  return null
}

function isTimestampExpired(timestampStr) {
  if (!/^\d+$/.test(timestampStr)) {
    throw new Error("Invalid timestamp: must be a positive integer.")
  }
  const timestampDate = new Date(Number(timestampStr) * 1000)
  const currentDate = new Date()
  const differenceInMilliseconds = currentDate - timestampDate
  // Valid only within [now-2h, now+5min]. The upper bound enforces the 2h
  // expiry; the lower bound rejects future-dated timestamps. Previously a
  // future timestamp yielded a negative diff that still satisfied `<= 2h`, so a
  // code could be minted valid indefinitely (replay). 5min tolerates clock skew.
  const FIVE_MINUTES = 5 * 60 * 1000
  return (
    differenceInMilliseconds >= -FIVE_MINUTES &&
    differenceInMilliseconds <= 2 * 3600000
  )
}

function generateSignature(signKey, userId, timestamp) {
  return hmac(sha256, signKey).update(`${userId}.${timestamp}`).digest("hex")
}

module.exports = function () {
  // Here you might require any other services needed to process the request
  // For example, a logging service or a database service
  const logger = ctx.require("logger")
  const sql = ctx.require("postgres")

  async function getSignKey(userId) {
    const [{ key }] = await sql`
      SELECT
        "key"
      FROM
        "auth_sign_key"
      WHERE
        "user_id" = ${userId}
      LIMIT 1
      `
    return key
  }

  async function getValidatedUserId(code) {
    let decodedCode
    if (!code) {
      throw new Error("code not found in message body")
    }
    try {
      decodedCode = base62.decodeStr(code)
    } catch (error) {
      logger.debug({ error, code }, "Error decoding code")
      throw new Error("unable to base62 decode the code provided")
    }
    const codeParts = extractCodeParts(decodedCode)
    if (!codeParts) {
      throw new Error("unable to extract code parts from decoded code")
    }
    const { userId, timestamp, signature } = codeParts
    if (!isInteger(userId)) {
      throw new Error("userId is not an integer")
    }
    if (!isTimestampExpired(timestamp)) {
      throw httpError(498, "timestamp is not valid or expired")
    }
    const signKey = await getSignKey(userId)
    const trustedSignature = generateSignature(signKey, userId, timestamp)
    if (trustedSignature !== signature) {
      throw new Error("signature is not valid")
    }
    return parseInt(userId, 10)
  }

  // async function assignPhoneNumberToUser(fullPhoneNumber, userId) {
  //   const { countryCode, nationalNumber } =
  //     parseFullPhoneNumber(fullPhoneNumber)
  //   const [foundPhoneNumber] = await sql`
  //     SELECT
  //       "id",
  //       "user_id" as "userId"
  //     FROM
  //       "phone_number"
  //     WHERE
  //       "number" = ${nationalNumber}
  //       AND "country" = ${countryCode}
  //     LIMIT 1
  //     `

  //   if (foundPhoneNumber) {
  //     if (foundPhoneNumber.userId === userId) {
  //       return
  //     }
  //     const { id: phoneNumberId } = foundPhoneNumber
  //     // delete also user_login_request in cascade
  //     await sql`
  //       DELETE FROM "phone_number"
  //       WHERE "id" = ${phoneNumberId}
  //       `
  //   }

  //   await sql`
  //     INSERT INTO "phone_number" ("user_id", "country", "number")
  //       VALUES (${userId}, ${countryCode}, ${nationalNumber})
  //     `
  // }

  async function registerPhoneNumber(fullPhoneNumber, userId) {
    const { countryCode, nationalNumber } =
      parseFullPhoneNumber(fullPhoneNumber)

    const [userPhoneNumberRelative] = await sql`
      SELECT
        "id"
      FROM
        "user_phone_number_relative"
      WHERE
        "user_id" = ${userId}
      `

    await sql.begin(async (sql) => {
      const [{ id: phoneNumberId }] = await sql`
        INSERT INTO "phone_number" ("user_id", "country", "number")
          VALUES (${userId}, ${countryCode}, ${nationalNumber})
        RETURNING
          id
        `
      if (!userPhoneNumberRelative) {
        await sql`
          INSERT INTO "user_phone_number_relative" ("user_id", "phone_number_id")
            VALUES (${userId}, ${phoneNumberId})
          `
      }
    })
  }

  async function connectPhoneNumberUserToUser(fullPhoneNumber, userId) {
    const { countryCode, nationalNumber } =
      parseFullPhoneNumber(fullPhoneNumber)
    const [foundPhoneNumber] = await sql`
      SELECT
        "id",
        "user_id"
      FROM
        "phone_number"
      WHERE
        "number" = ${nationalNumber}
        AND "country" = ${countryCode}
      LIMIT 1
      `

    if (!foundPhoneNumber) {
      return false
    }
    const phoneNumberId = foundPhoneNumber.id
    const loginRequestType = "phone_number"

    await sql`
      INSERT INTO "user_login_request" ("user_id", "type", "phone_number_id")
        VALUES (${userId}, ${loginRequestType}, ${phoneNumberId})
      ON CONFLICT ("user_id")
        DO UPDATE SET
          "type" = ${loginRequestType}, "phone_number_id" = ${phoneNumberId}
      `
  }

  return async function handleSmsEvent(_req, res) {
    // const payload = _req.body // use when debug
    const { payload } = reqCtx.get("external.ringover.event")
    const { data } = payload

    const { from_number: fromNumber, body } = data
    const extractedCode = extractCodeFromBody(body)
    if (!extractedCode) {
      logger.debug({ body }, "No code provided in message body")
      throw httpError(422, "no code")
    }

    const [smsType, code] = extractedCode

    logger.debug({ fromNumber, body, smsType, code }, "Received SMS")

    let userId
    try {
      userId = await getValidatedUserId(code)
    } catch (error) {
      logger.debug({ code, error }, "Invalid code provided")
      if (httpError.isHttpError(error)) {
        throw error
      }
      throw httpError(422, "invalid code")
    }

    logger.debug({ userId, smsType, code }, "Valid code provided")
    switch (smsType) {
      case "R": {
        // await assignPhoneNumberToUser(fromNumber, userId)
        const result = await connectPhoneNumberUserToUser(fromNumber, userId)
        if (result === false) {
          await registerPhoneNumber(fromNumber, userId)
        }
        break
      }
      case "C": {
        const result = await connectPhoneNumberUserToUser(fromNumber, userId)
        if (result === false) {
          return res.status(404).json
        }
        break
      }
      default: {
        return res.status(410)
      }
    }

    return {
      message: "SMS event processed successfully",
      processedAt: new Date().toISOString(),
    }
  }
}
