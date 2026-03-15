// const { reqCtx } = require("@modjo/express/ctx")

const geocodeReverse = require("common/external-api/geocode-reverse")

module.exports = function ({ services: { middlewareRateLimiterIpUser } }) {
  async function getOneInfoNominatim(req) {
    const { lat, lon } = req.query
    const coordinates = [lon, lat]

    const result = await geocodeReverse(coordinates)
    if (!result) {
      return
    }
    const { display_name: displayName } = result
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
