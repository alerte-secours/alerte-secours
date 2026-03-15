const { importJWK, createLocalJWKSet } = require("jose")
const { omit } = require("lodash")

const toInteger = require("lodash.tointeger")

const postgresTypes = require("@as/postgres-types")

const createJwks = require("common/jwks/jwks")

module.exports = async function createConfig({ env = process.env } = {}) {
  const jwks = await createJwks(env)
  const [jwk] = jwks
  const jwkAlgorithm = env.JWK_ALGORITHM || "Ed25519"
  const jwkAlg = env.JWK_ALG || "EdDSA"
  const jwkId = jwk.kid
  const jwkPrivateKey = await importJWK(jwk)
  const JWKSet = await createLocalJWKSet({
    keys: jwks.map((k) => omit(k, ["d"])),
  })
  const ringoverCallEventWebhookKey =
    env.EXTERNAL_RINGOVER_CALL_EVENT_WEBHOOK_KEY

  const postgresExternal = process.env.POSTGRES_EXTERNAL

  const config = {
    microserviceOapi: {
      serviceName: "api",
    },
    logger: {
      level: env.LOGLEVEL || "info",
    },
    httpServer: {
      host: env.HOST || "0.0.0.0",
      port: env.PORT || "4000",
    },
    express: {
      // logRequests: env.LOG_REQUESTS === "true",
      logRequests: true,
    },
    postgres: {
      dsn: env.DATABASE_URL,
      max: toInteger(env.PG_MAXIMUM_POOL_SIZE) || 10,
      types: await postgresTypes(),
      ssl: !!postgresExternal,
    },
    amqp: {
      url: env.AMQP_URL,
    },
    hasura: {
      dsn: env.HASURA_GRAPHQL_URL,
      adminSecret: env.HASURA_GRAPHQL_ADMIN_SECRET,
    },
    apolloClient: {
      dsn: env.HASURA_GRAPHQL_URL,
      headers: {
        "X-Hasura-Admin-Secret": env.HASURA_GRAPHQL_ADMIN_SECRET,
        "X-Hasura-Use-Backend-Only-Permissions": "true",
      },
    },
    project: {
      jwks,
      jwkAlg,
      jwkAlgorithm,
      jwkId,
      JWKSet,
      // jwkAuthToken: await createJwkAuthToken(env),
      jwkExpirationInDays: toInteger(env.JWK_EXPIRATION_IN_DAYS) || 30,
      jwtExpirationInHours: toInteger(env.JWT_EXPIRATION_IN_HOURS) || 7 * 24,
      jwkPrivateKey,
      bearerCookieName: env.BEARER_COOKIE_NAME || "bearer",
      claimsNamespace: env.CLAIMS_NAMESPACE || "https://hasura.io/jwt/claims",
      external: {
        ringoverCallEventWebhookKey,
      },
      nominatimUrl: env.NOMINATIM_URL,
      geoplatformeUrl:
        env.GEOPLATEFORME_URL || "https://data.geopf.fr/geocodage",
      geocodeReverseProvider: env.GEOCODE_REVERSE_PROVIDER || "nominatim", // "nominatim" or "geoplateforme"
      what3wordsApiKey: env.WHAT3WORDS_API_KEY,
    },
  }

  return config
}
