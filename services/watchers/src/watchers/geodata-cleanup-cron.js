const async = require("async")
const { ctx } = require("@modjo/core")
const ms = require("ms")
const {
  COLDGEODATA_DEVICE_KEY_PREFIX,
  COLDGEODATA_OLD_KEY_PREFIX,
  COLDGEODATA_NOTIFIED_KEY_PREFIX,
  HOTGEODATA_KEY,
} = require("common/geodata/redis-keys")
const cron = require("~/libs/cron")
const {
  // DEVICE_GEODATA_IOS_SILENT_PUSH_AGE,
  DEVICE_GEODATA_NOTIFICATION_AGE,
  DEVICE_GEODATA_CLEANUP_AGE,
} = require("~/constants/time")
const tasks = require("~/tasks")

const CLEANUP_CRON = "0 */4 * * *" // Run every 4 hours
const MAX_PARALLEL_PROCESS = 10
// const iosHeartbeatAge = Math.floor(ms(DEVICE_GEODATA_IOS_SILENT_PUSH_AGE) / 1000)
const notificationAge = Math.floor(ms(DEVICE_GEODATA_NOTIFICATION_AGE) / 1000) // Convert to seconds
const cleanupAge = Math.floor(ms(DEVICE_GEODATA_CLEANUP_AGE) / 1000) // Convert to seconds

module.exports = async function () {
  const logger = ctx.require("logger")
  const redisCold = ctx.require("kvrocksColdGeodata")
  const redisHot = ctx.require("redisHotGeodata")
  const { addTask } = ctx.require("amqp")
  const sql = ctx.require("postgres")

  return async function geodataCleanupCron() {
    logger.info("watcher geodataCleanupCron: daemon started")

    // Helper function to check if current time is within notification window (9-19h)
    function isWithinNotificationWindow() {
      const now = new Date()
      const hour = now.getHours()
      return hour >= 9 && hour < 19
    }

    // Process geodata cleanup with single loop for both notifications and cleanup
    async function processGeodataCleanup() {
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      let coldCursor = "0"

      do {
        // Get batch of keys using SCAN
        const [newCursor, keys] = await redisCold.scan(
          coldCursor,
          "MATCH",
          `${COLDGEODATA_DEVICE_KEY_PREFIX}*`,
          "COUNT",
          "100"
        )
        coldCursor = newCursor

        // Process this batch of keys immediately
        if (keys.length > 0) {
          // Phase 1: Read cold storage data for all keys in this batch
          const devicesInfo = []
          await async.eachLimit(keys, MAX_PARALLEL_PROCESS, async (key) => {
            const deviceId = key.slice(COLDGEODATA_DEVICE_KEY_PREFIX.length)
            try {
              const deviceData = await redisCold.get(key)
              if (!deviceData) return
              const data = JSON.parse(deviceData)
              const age = data.updatedAt ? now - data.updatedAt : Infinity
              devicesInfo.push({ key, deviceId, data, age })
            } catch (error) {
              logger.error({ error, key }, "Error reading device data")
            }
          })

          // Phase 2: Batch fetch fallback locations for devices that need DB lookup
          const deviceIdsNeedingLookup = devicesInfo
            .filter(
              (d) =>
                d.age > cleanupAge ||
                (d.age > notificationAge && !d.data.isFallback)
            )
            .map((d) => parseInt(d.deviceId, 10))

          const fallbackMap = new Map()
          if (deviceIdsNeedingLookup.length > 0) {
            try {
              const fallbackResults = await sql`
                SELECT
                  "id",
                  ST_X ("fallback_location"::geometry) as lon,
                  ST_Y ("fallback_location"::geometry) as lat
                FROM
                  "device"
                WHERE
                  "id" = ANY (${deviceIdsNeedingLookup})
                  AND "fallback_location" IS NOT NULL
                `
              for (const row of fallbackResults) {
                fallbackMap.set(row.id, { lon: row.lon, lat: row.lat })
              }
            } catch (error) {
              logger.error({ error }, "Error batch-fetching fallback locations")
            }
          }

          // Phase 3: Process each device using pre-fetched fallback data
          await async.eachLimit(
            devicesInfo,
            MAX_PARALLEL_PROCESS,
            async ({ key, deviceId, data, age }) => {
              try {
                if (age > cleanupAge) {
                  try {
                    const fallbackDevice = fallbackMap.get(
                      parseInt(deviceId, 10)
                    )

                    if (
                      fallbackDevice &&
                      fallbackDevice.lon &&
                      fallbackDevice.lat
                    ) {
                      // Replace hot storage with fallback coordinates (always refresh from DB to pick up changes)
                      await redisHot.geoadd(
                        HOTGEODATA_KEY,
                        fallbackDevice.lon,
                        fallbackDevice.lat,
                        deviceId
                      )

                      // Refresh updatedAt in cold storage to prevent re-cleanup for another cycle
                      data.updatedAt = Math.floor(Date.now() / 1000)
                      data.isFallback = true
                      data.coordinates = [
                        fallbackDevice.lon,
                        fallbackDevice.lat,
                      ]
                      await redisCold.set(key, JSON.stringify(data))

                      logger.debug(
                        { deviceId, age: `${Math.floor(age / 3600)}h` },
                        "Refreshed device fallback location in hot storage"
                      )
                    } else {
                      // No fallback (or fallback removed by user): remove from hot storage and archive cold key
                      await redisHot.zrem(HOTGEODATA_KEY, deviceId)

                      const oldKey = `${COLDGEODATA_OLD_KEY_PREFIX}${deviceId}`
                      const notifiedKey = `${COLDGEODATA_NOTIFIED_KEY_PREFIX}${deviceId}`

                      // Guard against race with fallback-location-sync queue
                      const coldKeyExists = await redisCold.exists(key)
                      if (coldKeyExists) {
                        const transaction = redisCold.multi()
                        transaction.rename(key, oldKey)
                        transaction.del(notifiedKey)
                        await transaction.exec()
                      }

                      logger.debug(
                        { deviceId, age: `${Math.floor(age / 3600)}h` },
                        "Removed old device data from hot storage and archived in cold storage"
                      )
                    }
                  } catch (error) {
                    logger.error(
                      { error, deviceId },
                      "Error cleaning device data"
                    )
                  }
                } else if (age > notificationAge && !data.isFallback) {
                  // Skip notification for devices already running on fallback location
                  const notifiedKey = `${COLDGEODATA_NOTIFIED_KEY_PREFIX}${deviceId}`

                  try {
                    const alreadyNotified = await redisCold.exists(notifiedKey)

                    if (!alreadyNotified && isWithinNotificationWindow()) {
                      const hasFallback = fallbackMap.has(
                        parseInt(deviceId, 10)
                      )

                      try {
                        await addTask(
                          tasks.BACKGROUND_GEOLOCATION_LOST_NOTIFY,
                          {
                            deviceId,
                            hasFallback,
                          }
                        )

                        logger.info(
                          { deviceId, age: `${Math.floor(age / 3600)}h` },
                          "Enqueued background geolocation lost notification task"
                        )
                      } catch (notifError) {
                        logger.error(
                          { deviceId, error: notifError },
                          "Error enqueueing background geolocation lost notification task"
                        )
                      }
                      // Mark as notified with expiry matching cleanup age
                      await redisCold.set(notifiedKey, "1", "EX", cleanupAge)
                    } else if (
                      !alreadyNotified &&
                      !isWithinNotificationWindow()
                    ) {
                      logger.debug(
                        { deviceId, age: `${Math.floor(age / 3600)}h` },
                        "Skipping notification outside business hours (9-19h)"
                      )
                    }
                  } catch (error) {
                    logger.error(
                      { error, deviceId },
                      "Error processing notification for device"
                    )
                  }
                }
              } catch (error) {
                logger.error({ error, key }, "Error processing device data")
              }
            }
          )
        }
      } while (coldCursor !== "0")
    }

    // this is temporary function (fixing actual data)
    // async function cleanupOrphanedHotGeodata() {
    //   // Get all devices from hot storage
    //   const hotDevices = new Set()
    //   let hotCursor = "0"
    //   do {
    //     // Use zscan to iterate through the sorted set
    //     const [newCursor, items] = await redisHot.zscan(
    //       HOTGEODATA_KEY,
    //       hotCursor,
    //       "COUNT",
    //       "100"
    //     )
    //     hotCursor = newCursor

    //     // Extract device IDs (every other item in the result is a score)
    //     for (let i = 0; i < items.length; i += 2) {
    //       hotDevices.add(items[i])
    //     }
    //   } while (hotCursor !== "0")

    //   // Process each hot device
    //   await async.eachLimit(
    //     [...hotDevices],
    //     MAX_PARALLEL_PROCESS,
    //     async (deviceId) => {
    //       try {
    //         // Check if device exists in cold storage
    //         const coldKey = `${COLDGEODATA_DEVICE_KEY_PREFIX}${deviceId}`
    //         const exists = await redisCold.exists(coldKey)

    //         // If device doesn't exist in cold storage, remove it from hot storage
    //         if (!exists) {
    //           await redisHot.zrem(HOTGEODATA_KEY, deviceId)
    //           logger.debug(
    //             { deviceId },
    //             "Removed orphaned device data from hot storage (not found in cold storage)"
    //           )
    //         }
    //       } catch (error) {
    //         logger.error(
    //           { error, deviceId },
    //           "Error checking orphaned device data"
    //         )
    //       }
    //     }
    //   )
    // }

    // Schedule cleanup function to run periodically
    cron.schedule(CLEANUP_CRON, async () => {
      await processGeodataCleanup()
      // await cleanupOrphanedHotGeodata()
    })
  }
}
