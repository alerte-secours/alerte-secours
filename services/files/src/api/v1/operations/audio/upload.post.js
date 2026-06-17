const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")
const httpError = require("http-errors")

const { v4: uuidv4 } = require("uuid")

module.exports = function () {
  // const config = ctx.require("config")
  // const {  } = config
  const sql = ctx.require("postgres")
  const minio = ctx.require("minio")

  const bucket = "audio"

  async function addOneAudioUpload(req) {
    const logger = reqCtx.require("logger")
    const [file] = req.files
    const {
      data: { alertId },
    } = req.body

    const session = reqCtx.require("session")

    const { userId, deviceId } = session

    // Security: mirror the Hasura `message` insert rule
    // (oneAlert.manyAlerting.user_id == X-Hasura-User-Id). This service writes
    // via admin SQL and bypasses RLS, so without this check any authenticated
    // user could post audio onto an arbitrary alertId they have no relation to.
    // Every legitimate participant (alert creator and connected responders) has
    // an `alerting` row, so this does not restrict normal usage.
    const [membership] = await sql`
      SELECT
        1
      FROM
        "alerting"
      WHERE
        "alert_id" = ${alertId}
        AND "user_id" = ${userId}
      LIMIT 1
      `
    if (!membership) {
      logger.warn(
        { alertId, userId },
        "Audio upload rejected: user is not a participant of this alert"
      )
      throw httpError(403, "not a participant of this alert")
    }

    const audioFileUuid = uuidv4()

    const messages = {
      contentType: "audio",
      audioFileUuid,
      userId,
      deviceId,
      alertId,
    }

    const [{ id: messageId }] = await sql`
      INSERT INTO "message" ${sql(messages)}
      RETURNING
        "id"
      `

    const incomingType = (file?.mimetype || "").toLowerCase()
    const nameFromClient = (file?.originalname || "").toLowerCase()
    const mappedType =
      incomingType === "audio/m4a"
        ? "audio/mp4"
        : incomingType && incomingType.startsWith("audio/")
        ? incomingType
        : ""
    const guessedFromName = nameFromClient.endsWith(".m4a") ? "audio/mp4" : ""
    const contentType = mappedType || guessedFromName || "audio/mp4"

    const metaData = {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${audioFileUuid}.m4a"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-amz-meta-encoding": file.encoding,
      "x-amz-meta-originalname": file.originalname,
      "x-amz-meta-userid": String(userId),
      "x-amz-meta-deviceid": String(deviceId),
    }

    await minio.ensureBucketExists(bucket)

    try {
      const res = await minio.putObject(
        bucket,
        `${audioFileUuid}.m4a`,
        file.buffer,
        file.size,
        metaData
      )
      logger.debug(
        { res, bucket, audioFileUuid, userId, deviceId },
        "Successfully uploaded audio file"
      )
    } catch (err) {
      logger.error(
        { error: err, bucket, audioFileUuid, userId, deviceId },
        "Error uploading audio file"
      )
    }

    return { audioFileUuid, messageId }
  }

  return [addOneAudioUpload]
}
