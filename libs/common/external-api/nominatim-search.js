const { default: axios } = require("axios")
const qs = require("qs")
const { ctx } = require("@modjo/core")
// see https://nominatim.org/release-docs/latest/api/Search/

module.exports = async function nominatimSearch(query, options = {}) {
  const config = ctx.get("config.project")
  const { nominatimUrl } = config

  const logger = ctx.require("logger")

  if (!nominatimUrl) {
    logger.error("nominatimUrl is not configured in project config")
    return []
  }

  const search = qs.stringify({
    format: "json",
    addressdetails: 1,
    limit: 5,
    ...options,
    q: query,
  })

  const url = `${nominatimUrl}/search?${search}`
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
        "nominatim server did not answer with a HTTP code 200"
      )
    }
    return res.data || []
  } catch (e) {
    if (e.response?.data)
      logger.error(
        { responseData: e.response.data, error: e },
        "nominatim search failed"
      )
    else logger.error({ url, error: e }, "nominatim search failed")
    return []
  }
}
