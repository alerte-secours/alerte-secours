const { default: axios } = require("axios")
const qs = require("qs")
const { ctx } = require("@modjo/core")
// see https://data.geopf.fr/geocodage/reverse (API Géoplateforme - Géocodage)

const DEFAULT_URL = "https://data.geopf.fr/geocodage"

module.exports = async function geoplatformeReverse(coords, options = {}) {
  const config = ctx.get("config.project")
  const geoplatformeUrl = config.geoplatformeUrl || DEFAULT_URL

  const logger = ctx.require("logger")

  const [lon, lat] = coords
  const search = qs.stringify({
    index: "address",
    limit: 1,
    ...options,
    lon,
    lat,
  })

  let data
  const url = `${geoplatformeUrl}/reverse?${search}`
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
    if (features.length > 0) {
      const feature = features[0]
      // Map GeoJSON feature to Nominatim-compatible shape
      data = {
        display_name: feature.properties.label || "",
      }
    }
  } catch (e) {
    if (e.response?.data)
      logger.error(
        { responseData: e.response.data, error: e },
        "geoplateforme reverse failed"
      )
    else logger.error({ url, error: e }, "geoplateforme reverse failed")
  }
  return data
}
