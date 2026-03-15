const { ctx } = require("@modjo/core")
const { taskCtx } = require("@modjo/microservice-worker/ctx")

const geoplatformeReverse = require("common/external-api/geoplateforme-reverse")

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

      const geoplatformeResult = await geoplatformeReverse(coordinates)
      if (!geoplatformeResult) {
        logger.error({ params }, "Failed to get geoplateforme result")
        return
      }
      const { display_name: address } = geoplatformeResult

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
