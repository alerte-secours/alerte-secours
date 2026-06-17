const { ctx } = require("@modjo/core")
const { omit } = require("lodash")

module.exports = function () {
  const config = ctx.require("config.project")
  const { jwks, jwkExpirationInDays } = config

  const keys = jwks.map((jwk) => omit(jwk, ["d"]))

  // Cap the public cache lifetime: a long JWKS TTL (default 30d) delays key
  // revocation across Hasura / CDN / client caches. Keys rarely rotate, so a 1h
  // refresh is cheap and bounds the window during which a compromised key stays
  // trusted.
  const maxAge = Math.min(jwkExpirationInDays * 24 * 3600, 3600)

  return async function getOneJwks(_req, res) {
    res.set("Cache-Control", `public, max-age=${maxAge}`)
    return {
      keys,
    }
  }
}
