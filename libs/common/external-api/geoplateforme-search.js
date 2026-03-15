const { default: axios } = require("axios")
const qs = require("qs")
const { ctx } = require("@modjo/core")
// see https://data.geopf.fr/geocodage/search (API Géoplateforme - Géocodage)

const DEFAULT_URL = "https://data.geopf.fr/geocodage"

module.exports = async function geoplatformeSearch(query, options = {}) {
  const config = ctx.get("config.project")
  const geoplatformeUrl = config.geoplatformeUrl || DEFAULT_URL

  const logger = ctx.require("logger")

  const search = qs.stringify({
    autocomplete: 1,
    index: "address",
    limit: 5,
    ...options,
    q: query,
  })

  const url = `${geoplatformeUrl}/search?${search}`
  try {
    const res = await axios.request({
      url,
      method: "get",
      headers: {
        "accept-language": "fr",
      },
    })
    if (res.status !== 200) {
      logger.error(
        { res, url },
        "geoplateforme server did not answer with a HTTP code 200"
      )
    }
    const featureCollection = res.data || {}
    const features = featureCollection.features || []
    // Map GeoJSON features to Nominatim-compatible shape
    return features.map((feature) => ({
      lat: String(feature.geometry.coordinates[1]),
      lon: String(feature.geometry.coordinates[0]),
      display_name: feature.properties.label || "",
    }))
  } catch (e) {
    if (e.response?.data)
      logger.error(
        { responseData: e.response.data, error: e },
        "geoplateforme search failed"
      )
    else logger.error({ url, error: e }, "geoplateforme search failed")
    return []
  }
}
