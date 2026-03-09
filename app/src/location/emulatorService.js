import BackgroundGeolocation from "react-native-background-geolocation";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import { getAuthState } from "~/stores";

import { ensureBackgroundGeolocationReady } from "~/location/backgroundGeolocationService";
import { BASE_GEOLOCATION_CONFIG } from "~/location/backgroundGeolocationConfig";

// Global variables
let emulatorIntervalId = null;
let isEmulatorModeEnabled = false;

// Create a logger for the emulator service
const emulatorLogger = createLogger({
  module: BACKGROUND_SCOPES.GEOLOCATION,
  feature: "emulator",
});

// Initialize emulator mode based on stored preference
export const initEmulatorMode = async () => {
  try {
    const storedValue = await AsyncStorage.getItem(
      STORAGE_KEYS.EMULATOR_MODE_ENABLED,
    );
    emulatorLogger.debug("Initializing emulator mode", { storedValue });

    if (storedValue === "true") {
      await enableEmulatorMode();
    }
  } catch (error) {
    emulatorLogger.error("Failed to initialize emulator mode", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// Enable emulator mode
export const enableEmulatorMode = async () => {
  emulatorLogger.info("Enabling emulator mode");

  // Clear existing interval if any
  if (emulatorIntervalId) {
    clearInterval(emulatorIntervalId);
  }

  try {
    const { userToken } = getAuthState();
    if (!userToken) {
      emulatorLogger.warn(
        "Emulator mode requires authentication (BGGeo is disabled pre-auth)",
      );
      isEmulatorModeEnabled = false;
      await AsyncStorage.setItem(STORAGE_KEYS.EMULATOR_MODE_ENABLED, "false");
      return;
    }

    await ensureBackgroundGeolocationReady(BASE_GEOLOCATION_CONFIG);

    // Call immediately once
    await BackgroundGeolocation.changePace(true);
    emulatorLogger.debug("Initial changePace call successful");

    // Then set up interval
    emulatorIntervalId = setInterval(
      () => {
        BackgroundGeolocation.changePace(true);
        emulatorLogger.debug("Interval changePace call executed");
      },
      30 * 60 * 1000,
    ); // 30 minutes

    isEmulatorModeEnabled = true;

    // Persist the setting
    await AsyncStorage.setItem(STORAGE_KEYS.EMULATOR_MODE_ENABLED, "true");
    emulatorLogger.debug("Emulator mode setting saved");
  } catch (error) {
    emulatorLogger.error("Failed to enable emulator mode", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// Disable emulator mode
export const disableEmulatorMode = async () => {
  emulatorLogger.info("Disabling emulator mode");

  if (emulatorIntervalId) {
    clearInterval(emulatorIntervalId);
    emulatorIntervalId = null;
  }

  isEmulatorModeEnabled = false;

  // Persist the setting
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EMULATOR_MODE_ENABLED, "false");
    emulatorLogger.debug("Emulator mode setting saved");
  } catch (error) {
    emulatorLogger.error("Failed to save emulator mode setting", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// Get current emulator mode state
export const getEmulatorModeState = () => {
  return isEmulatorModeEnabled;
};

// Toggle emulator mode
export const toggleEmulatorMode = async (enabled) => {
  emulatorLogger.info("Toggling emulator mode", { enabled });

  if (enabled) {
    await enableEmulatorMode();
  } else {
    await disableEmulatorMode();
  }

  return isEmulatorModeEnabled;
};
