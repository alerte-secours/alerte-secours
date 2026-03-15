const { ctx } = require("@modjo/core")
const { taskCtx } = require("@modjo/microservice-worker/ctx")

const geocodeReverse = require("common/external-api/geocode-reverse")

module.exports = async function () {
  return Object.assign(
    async function geocodeAlertGuessAddress(params) {
      const logger = taskCtx.require("logger")
      logger.info("queue hanlder geocodeAlertGuessAddress", params)

      const sql = ctx.require("postgres")

      const { coordinates, alertId, isLast = false } = params

      // Check if coordinates is valid
      if (
        !coordinates ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2
      ) {
        logger.error(
          { params },
          "Invalid coordinates for geocodeAlertGuessAddress"
        )
        return
      }

      const result = await geocodeReverse(coordinates)
      if (!result) {
        logger.error({ params }, "Failed to get geocode reverse result")
        return
      }
      const { display_name: address } = result

      if (!address) {
        return
      }

      const fields = isLast ? { last_address: address } : { address }

      await sql`
        UPDATE
          "alert"
        SET
          ${sql(fields)}
        WHERE
          "id" = ${alertId}
        `
    },
    {
      dedupOptions: { enabled: true },
    }
  )
}
