import * as Sentry from "@sentry/react-native";
import { Platform } from "react-native";

import env from "~/env";
import packageJson from "../../package.json";
import memoryAsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";

const sentryLogger = createLogger({
  module: SYSTEM_SCOPES.APP,
  feature: "sentry",
});

// Get the build number from native code
const getBuildNumber = () => {
  if (Platform.OS === "ios") {
    // Use the same format as ios-archive.sh
    return packageJson.customExpoVersioning?.buildNumber || "0";
  }
  return packageJson.customExpoVersioning?.versionCode || "0";
};

// Construct release name in the same format as ios-archive.sh
const getReleaseVersion = () => {
  const version = packageJson.version;
  const buildNumber = getBuildNumber();
  if (Platform.OS === "ios") {
    return `com.alertesecours.alertesecours@${version}+${buildNumber}`;
  }
  return `com.alertesecours@${version}+${buildNumber}`;
};

// Check if Sentry is enabled by user preference
const checkSentryEnabled = async () => {
  try {
    // Wait for memory storage to be initialized
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        const stored = await memoryAsyncStorage.getItem(
          STORAGE_KEYS.SENTRY_ENABLED,
        );
        if (stored !== null) {
          return JSON.parse(stored);
        }
        break; // Storage is ready, no preference stored
      } catch (error) {
        if (
          error.message?.includes("not initialized") &&
          retries < maxRetries - 1
        ) {
          // Wait a bit and retry if storage not initialized
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
          continue;
        }
        sentryLogger.warn("Failed to check Sentry preference", {
          error: error.message,
        });
        break;
      }
    }
  } catch (error) {
    sentryLogger.warn("Failed to check Sentry preference", {
      error: error.message,
    });
  }
  // Default to enabled if no preference stored or error occurred
  return true;
};

// Initialize Sentry with user preference check
const initializeSentry = async () => {
  const isEnabled = await checkSentryEnabled();

  Sentry.init({
    dsn: env.SENTRY_DSN,
    enabled: isEnabled,
    tracesSampleRate: 0.1,
    debug: __DEV__,
    // Configure release to match ios-archive.sh format
    release: getReleaseVersion(),
    // Use BUILD_TIME from env to match the value used in sourcemap upload
    dist: env.BUILD_TIME,
    enableNative: true,
    attachStacktrace: true,
    environment: __DEV__ ? "development" : "production",
    normalizeDepth: 10,
    maxBreadcrumbs: 100,
    // Enable debug ID tracking
    _experiments: {
      debugIds: true,
    },
    beforeSend(event) {
      event.extra = {
        ...event.extra,
        jsEngine: global.HermesInternal ? "hermes" : "jsc",
        hermesEnabled: !!global.HermesInternal,
        version: packageJson.version,
        buildNumber: getBuildNumber(),
        buildTime: env.BUILD_TIME,
      };

      if (event.exception) {
        event.exception.values = event.exception.values?.map((value) => ({
          ...value,
          mechanism: {
            ...value.mechanism,
            handled: true,
            synthetic: false,
            type: "hermes",
          },
        }));
      }

      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console") {
        return breadcrumb;
      }
      return breadcrumb;
    },
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [
      // Sentry.mobileReplayIntegration({
      //   maskAllText: false,
      //   maskAllImages: false,
      //   maskAllVectors: false,
      // }),
    ],
  });
};

// Initialize Sentry asynchronously
initializeSentry().catch((error) => {
  sentryLogger.warn("Failed to initialize Sentry", {
    error: error.message,
  });
});

// Export function to dynamically control Sentry
export const setSentryEnabled = (enabled) => {
  try {
    // Use the newer Sentry API
    const client = Sentry.getClient();
    if (client) {
      const options = client.getOptions();
      options.enabled = enabled;
      if (!enabled) {
        // Clear any pending events when disabling
        Sentry.withScope((scope) => {
          scope.clear();
        });
      }
      sentryLogger.info("Sentry state toggled", { enabled });
    } else {
      sentryLogger.warn("Sentry client not available for toggling");
    }
  } catch (error) {
    sentryLogger.warn("Failed to toggle Sentry state", {
      error: error.message,
    });
  }
};
