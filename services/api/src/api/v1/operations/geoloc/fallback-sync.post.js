const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")

const tasks = require("~/tasks")

module.exports = function ({ services: { middlewareRateLimiterIpUser } }) {
  const { addTask } = ctx.require("amqp")
  const sql = ctx.require("postgres")

  async function addOneGeolocFallbackSync(req) {
    const logger = ctx.require("logger")
    const session = reqCtx.get("session")
    const { deviceId } = session
    const { coordinates, label } = req.body

    logger.debug({ action: "fallback-sync", deviceId })

    if (coordinates) {
      const [lon, lat] = coordinates
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        const error = new Error(
          "Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90"
        )
        error.status = 400
        throw error
      }
      await sql`
        UPDATE
          "device"
        SET
          "fallback_location" = ST_SetSRID (ST_MakePoint (${lon}, ${lat}), 4326)::geography,
          "fallback_location_label" = ${label || null}
        WHERE
          "id" = ${deviceId}
        `
    } else {
      await sql`
        UPDATE
          "device"
        SET
          "fallback_location" = NULL,
          "fallback_location_label" = NULL
        WHERE
          "id" = ${deviceId}
        `
    }

    await addTask(tasks.FALLBACK_LOCATION_SYNC, { deviceId })

    return { ok: true }
  }

  return [
    middlewareRateLimiterIpUser({
      points: 10,
      duration: 60,
    }),
    addOneGeolocFallbackSync,
  ]
}
