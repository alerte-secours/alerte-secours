const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")
const httpError = require("http-errors")

const { v4: uuidv4 } = require("uuid")

// Detect the real file type by magic bytes — never trust the client-supplied
// Content-Type. Avatars are served publicly from MinIO with the stored
// Content-Type, so accepting an attacker-controlled type (e.g. text/html or
// an SVG carrying script) would allow stored XSS / content-spoofing on the
// files domain. SVG is intentionally excluded (text-based, scriptable).
function detectImageMime(buffer) {
  if (!buffer || buffer.length < 12) return null
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png"
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp"
  }
  return null
}

module.exports = function () {
  const sql = ctx.require("postgres")
  const minio = ctx.require("minio")

  const bucket = "avatar"

  async function addOneAvatar(req) {
    const logger = reqCtx.require("logger")
    const [file] = req.files

    const session = reqCtx.require("session")

    const { userId } = session

    const contentType = detectImageMime(file?.buffer)
    if (!contentType) {
      logger.warn(
        { userId, clientMimetype: file?.mimetype },
        "Avatar upload rejected: payload is not a PNG/JPEG/WebP image"
      )
      throw httpError(415, "avatar must be a PNG, JPEG or WebP image")
    }

    const imageFileUuid = uuidv4()

    const [oldUserAvatar] = await sql`
      SELECT
        "image_file_uuid" as "imageFileUuid"
      FROM
        "user_avatar"
      WHERE
        "user_id" = ${userId}
      `

    await sql`
      INSERT INTO "user_avatar" (user_id, image_file_uuid)
        VALUES (${userId}, ${imageFileUuid})
      ON CONFLICT ("user_id")
        DO UPDATE SET
          "image_file_uuid" = ${imageFileUuid}
      `

    const metaData = {
      "Content-Type": contentType,
      "x-amz-meta-userid": String(userId),
    }

    await minio.ensureBucketExists(bucket)

    try {
      const res = await minio.putObject(
        bucket,
        `${imageFileUuid}.png`,
        file.buffer,
        file.size,
        metaData
      )
      // logger.trace(res)
      logger.debug(
        { res, bucket, imageFileUuid },
        "Successfully uploaded avatar"
      )
    } catch (err) {
      logger.error(
        { error: err, bucket, imageFileUuid, userId },
        "Error uploading avatar"
      )
    }

    if (oldUserAvatar) {
      await minio.removeObject(bucket, `${oldUserAvatar.imageFileUuid}`)
    }

    return { imageFileUuid }
  }

  return [addOneAvatar]
}
