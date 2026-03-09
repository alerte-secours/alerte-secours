import { createAtom } from "~/lib/atomic-zustand";
import memoryAsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";

const paramsLogger = createLogger({
  module: SYSTEM_SCOPES.APP,
  feature: "params",
});

export default createAtom(({ merge, reset }) => {
  const setDevModeEnabled = (b) => {
    merge({
      devModeEnabled: b,
    });
  };

  const setPreferredEmergencyCall = (preferredEmergencyCall) => {
    merge({
      preferredEmergencyCall,
    });
  };

  const setColorScheme = (colorScheme) => {
    merge({
      colorScheme,
    });
  };

  const setMapColorScheme = (mapColorScheme) => {
    merge({
      mapColorScheme,
    });
  };

  const setHasRegisteredRelatives = (hasRegisteredRelatives) => {
    merge({
      hasRegisteredRelatives,
    });
  };

  const setAlertListSortBy = (alertListSortBy) => {
    merge({
      alertListSortBy,
    });
  };

  const setSentryEnabled = async (sentryEnabled) => {
    merge({
      sentryEnabled,
    });

    // Persist to storage
    try {
      await memoryAsyncStorage.setItem(
        STORAGE_KEYS.SENTRY_ENABLED,
        JSON.stringify(sentryEnabled),
      );
    } catch (error) {
      paramsLogger.warn("Failed to persist Sentry preference", {
        error: error.message,
      });
    }
  };

  const initSentryEnabled = async () => {
    try {
      const stored = await memoryAsyncStorage.getItem(
        STORAGE_KEYS.SENTRY_ENABLED,
      );
      if (stored !== null) {
        const sentryEnabled = JSON.parse(stored);
        merge({ sentryEnabled });
        return sentryEnabled;
      }
    } catch (error) {
      paramsLogger.warn("Failed to load Sentry preference", {
        error: error.message,
      });
    }
  };

  const init = async () => {
    await initSentryEnabled();
  };

  return {
    default: {
      // devModeEnabled: false,
      devModeEnabled: __DEV__ || process.env.NODE_ENV !== "production",
      preferredEmergencyCall: "voice",
      colorScheme: "auto",
      mapColorScheme: "auto",
      hasRegisteredRelatives: null,
      alertListSortBy: "location",
      sentryEnabled: true,
    },
    actions: {
      reset,
      setDevModeEnabled,
      setPreferredEmergencyCall,
      setColorScheme,
      setMapColorScheme,
      setHasRegisteredRelatives,
      setAlertListSortBy,
      setSentryEnabled,
      init,
    },
  };
});
