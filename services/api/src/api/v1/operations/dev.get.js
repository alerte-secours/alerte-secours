const httpError = require("http-errors")
const { ctx } = require("@modjo/core")

function getRandomInRange(from, to, fixed) {
  return (Math.random() * (to - from) + from).toFixed(fixed) * 1
}

function forHumans(seconds) {
  const levels = [
    [Math.floor(seconds / 31536000), "years"],
    [Math.floor((seconds % 31536000) / 86400), "days"],
    [Math.floor(((seconds % 31536000) % 86400) / 3600), "hours"],
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), "minutes"],
    [(((seconds % 31536000) % 86400) % 3600) % 60, "seconds"],
  ]
  let returntext = ""

  for (let i = 0, max = levels.length; i < max; i++) {
    if (levels[i][0] === 0) continue
    returntext += ` ${levels[i][0]} ${
      levels[i][0] === 1
        ? levels[i][1].substr(0, levels[i][1].length - 1)
        : levels[i][1]
    }`
  }
  return returntext.trim()
}

module.exports = function () {
  return async function dev() {
    // Foot-gun guard: this endpoint inserts 10M rows. Even though it is
    // admin-only, keep it disabled unless explicitly enabled, so it can never be
    // triggered in production by a misconfigured role.
    if (process.env.ENABLE_DEV_ENDPOINTS !== "true") {
      throw httpError(404)
    }

    const sql = ctx.require("postgres")

    const startTime = new Date()
    // const count = 1
    const count = 10000000
    const batchBy = 1000

    const userId = 3

    const getElapsed = () => Math.round((new Date() - startTime) / 1000)
    const getLat = () => getRandomInRange(-90, +90, 3)
    const getLon = () => getRandomInRange(-180, +180, 3)

    const promises = []
    for (let i = 0; i < count; i++) {
      const lat = getLat()
      const lon = getLon()
      promises.push(
        sql`
          INSERT INTO "device" ("location", "user_id")
            VALUES (ST_SetSRID (ST_MakePoint (${lon}, ${lat}), 4326), ${userId})
          `
      )
      if ((i && i % batchBy === 0) || i === count) {
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(promises)
        promises.length = 0

        const elapsed = getElapsed()
        const remainingEntries = count - i
        const timeByEntry = elapsed / i
        const remainingTime = Math.round(timeByEntry * remainingEntries)
        const progress = Math.round((i / count) * 100)

        // eslint-disable-next-line no-console
        console.log(
          `${i}/${count}`,
          `progress: ${progress}%, remaining: ${forHumans(
            remainingTime
          )}, elapsed: ${forHumans(elapsed)}`
        )

        /*
        UPDATE device
        SET radius_all = (array[500.0,1000.0,1500.0,2000.0,2500.0,3000.0,3500.0,4000.0,4500.0,5000.0,5500.0,6000.0,6500.0,7000.0,7500.0,8000.0,8500.0,9000.0,9500.0,10000.0,10500.0,11000.0,11500.0,12000.0,12500.0,13000.0,13500.0,14000.0,14500.0,15000.0,15500.0,16000.0,16500.0,17000.0,17500.0,18000.0,18500.0,19000.0,19500.0,20000.0,20500.0,21000.0,21500.0,22000.0,22500.0,23000.0,23500.0,24000.0,24500.0])[floor(random() * 48 + 1)]
        */
      }
    }

    const elapsed = getElapsed()
    return {
      count,
      elapsed,
    }
  }
}
