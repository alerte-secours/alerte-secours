const { ctx } = require("@modjo/core")

const nominatimReverse = require("./nominatim-reverse")
const geoplatformeReverse = require("./geoplateforme-reverse")

module.exports = async function geocodeReverse(coords, options = {}) {
  const config = ctx.get("config.project")
  const provider = config.geocodeReverseProvider || "nominatim"
  if (provider === "geoplateforme") {
    return geoplatformeReverse(coords, options)
  }

  const result = await nominatimReverse(coords, options)
  if (result?.nearestPlace) {
    return result
  }

  // The self-hosted Nominatim runs on the metropolitan France extract: overseas
  // territories resolve no further than "France", yielding no locality. The IGN
  // Géoplateforme covers the DROM and the COM, so it takes over there.
  const logger = ctx.require("logger")
  logger.info(
    { coords, nominatimDisplayName: result?.display_name },
    "nominatim reverse resolved no locality, falling back to geoplateforme"
  )
  const fallback = await geoplatformeReverse(coords, options)
  return fallback?.nearestPlace ? fallback : result
}
