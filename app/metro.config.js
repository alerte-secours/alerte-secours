const { getDefaultConfig: getExpoDefaultConfig } = require("expo/metro-config");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const defaultConfig = getDefaultConfig(__dirname);
const sentryConfig = getSentryExpoConfig(__dirname);

// Enhanced asset configuration
const config = {
  resolver: {
    ...sentryConfig.resolver,
    // Ignore transient JNI output folders to prevent ENOENT watchers on missing ABI directories
    blockList: exclusionList([
      /node_modules\/.*\/android\/build\/intermediates\/(library_jni|merged_jni_libs)\/.*/,
    ]),
    sourceExts: [...sentryConfig.resolver.sourceExts, "cjs"],
    assetExts: [...defaultConfig.resolver.assetExts, "ttf", "db"],
  },
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Ensure proper CORS headers for asset requests
        res.setHeader("Access-Control-Allow-Origin", "*");
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(
  getExpoDefaultConfig(__dirname),
  defaultConfig,
  sentryConfig,
  config,
);
