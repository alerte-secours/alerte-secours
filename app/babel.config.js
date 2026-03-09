const crypto = require("crypto");

const envVars = [
  "CLAIMS_NAMESPACE",

  "APP_MINIO_URL",
  "APP_OA_FILES_URL",
  "APP_GRAPHQL_URL",
  "APP_GRAPHQL_WS_URL",
  "APP_GEOLOC_SYNC_URL",

  "STAGING_APP_MINIO_URL",
  "STAGING_APP_OA_FILES_URL",
  "STAGING_APP_GRAPHQL_URL",
  "STAGING_APP_GRAPHQL_WS_URL",
  "STAGING_APP_GEOLOC_SYNC_URL",

  "APP_OSRM_CAR_URL",
  "APP_OSRM_FOOT_URL",
  "APP_OSRM_BICYCLE_URL",
  "APP_MAPVIEW_STYLE_URL",
  "APP_MAPVIEW_DARK_STYLE_URL",
  "APP_LOG_SCOPES",
  "APP_LOG_MIN_LEVEL",
  "LOCAL_DEV",
  "SENTRY_DSN",
  "BUILD_TIME",
];

function getEnvHash() {
  // List of variables used in transform-inline-environment-variables

  // Create a sorted string of env var values
  const envString = envVars
    .sort()
    .map((key) => `${key}=${process.env[key] || ""}`)
    .join("|");

  // Create hash
  return crypto.createHash("md5").update(envString).digest("hex");
}

module.exports = function (api) {
  // Invalidate cache based on env vars hash, see also https://github.com/babel/minify/issues/919
  api.cache.invalidate(() => getEnvHash());

  return {
    presets: ["babel-preset-expo"],
    env: {
      production: {
        plugins: ["react-native-paper/babel"],
      },
    },
    plugins: [
      "@babel/plugin-proposal-export-namespace-from",
      ["@babel/plugin-transform-flow-strip-types"],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      ["@babel/plugin-proposal-private-methods", { loose: true }],
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "~": "./src",
          },
        },
      ],
      [
        "transform-inline-environment-variables",
        {
          include: envVars,
        },
      ],
      [
        "react-native-reanimated/plugin",
        {
          relativeSourceLocation: true,
        },
      ],
    ],
  };
};
