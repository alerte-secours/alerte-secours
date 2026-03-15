const { ctx } = require("@modjo/core")

const nominatimReverse = require("./nominatim-reverse")
const geoplatformeReverse = require("./geoplateforme-reverse")

module.exports = async function geocodeReverse(coords, options = {}) {
  const config = ctx.get("config.project")
  const provider = config.geocodeReverseProvider || "nominatim"
  if (provider === "geoplateforme") {
    return geoplatformeReverse(coords, options)
  }
  return nominatimReverse(coords, options)
}
