// const { reqCtx } = require("@modjo/express/ctx")

const geoplatformeReverse = require("common/external-api/geoplateforme-reverse")

module.exports = function ({ services: { middlewareRateLimiterIpUser } }) {
  async function getOneInfoNominatim(req) {
    const { lat, lon } = req.query
    const coordinates = [lon, lat]

    const geoplatformeResult = await geoplatformeReverse(coordinates)
    if (!geoplatformeResult) {
      return
    }
    const { display_name: displayName } = geoplatformeResult
    const address = displayName || ""
    return { address }
  }
  return [
    middlewareRateLimiterIpUser({
      points: 90, // allowed requests
      duration: 60, // per duration in seconds
    }),
    getOneInfoNominatim,
  ]
}
