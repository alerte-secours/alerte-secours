const { ctx } = require("@modjo/core")
const { taskCtx } = require("@modjo/microservice-worker/ctx")

const what3words = require("common/external-api/what3words")

module.exports = async function () {
  return Object.assign(
    async function geocodeAlertWhat3words(params) {
      const logger = taskCtx.require("logger")
      logger.info({ params }, "queue handler geocodeAlertWhat3words")

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
          "Invalid coordinates for geocodeAlertWhat3words"
        )
        return
      }

      const what3wordsResult = await what3words(coordinates)
      if (!what3wordsResult) {
        logger.error({ params }, "Failed to get what3words result")
        return
      }

      const { words, nearestPlace } = what3wordsResult

      // nearest_place is written by both this handler and
      // geocodeAlertGuessAddress; each only writes what it actually resolved,
      // so neither clobbers the other with a null. what3words is the only
      // source that covers the overseas territories, where the self-hosted
      // Nominatim extract stops at "France".
      const fields = {}
      if (words) {
        fields[isLast ? "last_what3words" : "what3words"] = words
      }
      if (nearestPlace) {
        fields[isLast ? "last_nearest_place" : "nearest_place"] = nearestPlace
      }

      if (Object.keys(fields).length === 0) {
        logger.warn({ params }, "what3words result has no usable field")
        return
      }

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
