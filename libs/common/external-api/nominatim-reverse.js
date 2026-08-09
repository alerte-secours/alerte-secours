const { default: axios } = require("axios")
const qs = require("qs")
const { ctx } = require("@modjo/core")
// see https://nominatim.org/release-docs/latest/api/Reverse/

// human-readable locality, formatted as "Bayonne, Nouvelle-Aquitaine"
// reverse returns addressdetails by default, no need to ask for them
function getNearestPlace(address = {}) {
  const locality =
    address.village ||
    address.town ||
    address.city ||
    address.municipality ||
    address.hamlet ||
    address.suburb
  const region = address.state || address.county
  return [locality, region].filter(Boolean).join(", ")
}

module.exports = async function nominatimReverse(coords, options = {}) {
  const config = ctx.get("config.project")
  const { nominatimUrl } = config

  const logger = ctx.require("logger")

  const [lon, lat] = coords
  const search = qs.stringify({
    format: "json", // see https://nominatim.org/release-docs/latest/api/Output/
    zoom: 18,
    ...options,
    lat,
    lon,
  })

  let data
  const url = `${nominatimUrl}/reverse?${search}`
  try {
    const res = await axios.request({
      url,
      method: "get",
      headers: {
        "accept-language": "fr", // RFC1766 ISO639
      },
    })
    if (res.status !== 200) {
      logger.error(
        { res, url },
        "nominatim server did not answer with a HTTP code 200"
      )
    }
    data = { ...res.data, nearestPlace: getNearestPlace(res.data?.address) }
  } catch (e) {
    if (e.response?.data)
      logger.error(
        { responseData: e.response.data, error: e },
        "nominatim reverse failed"
      )
    else logger.error({ url, error: e }, "nominatim reverse failed")
  }
  return data
}
