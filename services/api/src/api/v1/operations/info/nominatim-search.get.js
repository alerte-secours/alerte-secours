const geoplatformeSearch = require("common/external-api/geoplateforme-search")

module.exports = function ({ services: { middlewareRateLimiterIpUser } }) {
  async function getOneInfoNominatimSearch(req) {
    const { q } = req.query
    const geoplatformeResults = await geoplatformeSearch(q)
    const results = geoplatformeResults.map((result) => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name || "",
    }))
    return { results }
  }
  return [
    middlewareRateLimiterIpUser({
      points: 90,
      duration: 60,
    }),
    getOneInfoNominatimSearch,
  ]
}
