const toInteger = require("lodash.tointeger")
const postgresTypes = require("@as/postgres-types")
const fs = require("fs-extra")

module.exports = async function createConfig({ env = process.env } = {}) {
  const googleServiceAccountKeyRaw = await fs.readFile(
    env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    { encoding: "utf-8" }
  )
  const googleServiceAccountKey = JSON.parse(googleServiceAccountKeyRaw)

  const smtp = {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    host: env.SMTP_HOST || "127.0.0.1",
    port: env.SMTP_PORT || "25",
    from: env.SMTP_FROM || env.SMTP_USER,
  }

  const postgresExternal = process.env.POSTGRES_EXTERNAL
  // const postgresUrl = new URL(env.DATABASE_URL)

  const apiUrl = env.API_URL || "https://api.alertesecours.fr/api"
  const config = {
    project: {
      nominatimUrl: env.NOMINATIM_URL,
      what3wordsApiKey: env.WHAT3WORDS_API_KEY,
      googleServiceAccountKey,
      apiUrl,
    },
    logger: {
      level: env.LOGLEVEL || "info",
    },
    postgres: {
      dsn: env.DATABASE_URL,
      // host: postgresUrl.hostname,
      // port: postgresUrl.port || 5432,
      // database: postgresUrl.pathname.split("/")[1],
      // username: postgresUrl.username,
      // password: postgresUrl.password,
      max: toInteger(env.PG_MAXIMUM_POOL_SIZE) || 10,
      types: await postgresTypes(),
      ssl: !!postgresExternal,
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
    amqp: {
      url: `${env.AMQP_URL}?heartbeat=30`, // https://github.com/amqp-node/amqplib/issues/733
    },
    smtp,
    minio: {
      endPoint: env.MINIO_ENDPOINT,
      port: toInteger(env.MINIO_PORT, 10) || 9000,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    },
  }

  return config
}
