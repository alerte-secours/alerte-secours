const { ctx } = require("@modjo/core")

const {
  COLDGEODATA_DEVICE_KEY_PREFIX,
  HOTGEODATA_KEY,
} = require("common/geodata/redis-keys")

module.exports = async function () {
  const redisHot = ctx.require("redisHotGeodata")
  const redisCold = ctx.require("kvrocksColdGeodata")
  const sql = ctx.require("postgres")
  const logger = ctx.require("logger")

  return async function fallbackLocationSync(params) {
    const { deviceId } = params

    const coldKey = `${COLDGEODATA_DEVICE_KEY_PREFIX}${deviceId}`
    const coldData = await redisCold.get(coldKey)

    if (!coldData) {
      // Device has no cold geodata entry, nothing to sync
      return
    }

    const data = JSON.parse(coldData)

    if (!data.isFallback) {
      // Device is still actively sending GPS updates, fallback not in use yet
      return
    }

    // Device is currently running on fallback, check if fallback location changed or was removed
    const [fallbackDevice] = await sql`
      SELECT
        ST_X ("fallback_location"::geometry) as lon,
        ST_Y ("fallback_location"::geometry) as lat
      FROM
        "device"
      WHERE
        "id" = ${parseInt(deviceId, 10)}
        AND "fallback_location" IS NOT NULL
      `

    if (fallbackDevice && fallbackDevice.lon && fallbackDevice.lat) {
      // Fallback location exists (new or updated): sync to hot storage
      await redisHot.geoadd(
        HOTGEODATA_KEY,
        fallbackDevice.lon,
        fallbackDevice.lat,
        deviceId
      )

      data.updatedAt = Math.floor(Date.now() / 1000)
      data.coordinates = [fallbackDevice.lon, fallbackDevice.lat]
      await redisCold.set(coldKey, JSON.stringify(data))

      logger.info(
        { deviceId },
        "Synced updated fallback location to hot storage"
      )
    } else {
      // Fallback was removed: remove from hot storage but keep cold key
      // so the device can recover when GPS resumes (cleanup cron will handle archival)
      await redisHot.zrem(HOTGEODATA_KEY, deviceId)

      delete data.isFallback
      delete data.coordinates
      await redisCold.set(coldKey, JSON.stringify(data))

      logger.info(
        { deviceId },
        "Fallback removed, removed from hot storage, cold key preserved for GPS recovery"
      )
    }
  }
}
