const nominatimSearch = require("common/external-api/nominatim-search")

module.exports = function ({ services: { middlewareRateLimiterIpUser } }) {
  async function getOneInfoNominatimSearch(req) {
    const { q } = req.query
    const nominatimResults = await nominatimSearch(q)
    const results = nominatimResults.map((result) => ({
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
