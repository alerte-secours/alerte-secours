import { Platform } from "react-native";
import SendIntentAndroid from "react-native-send-intent";
import {
  RequestDisableOptimization,
  BatteryOptEnabled,
} from "react-native-battery-optimization-check";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const log = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "battery-optimization",
});

/**
 * Returns true if battery optimization is currently ENABLED for this app on Android.
 * On iOS, returns false (no battery optimization concept).
 */
export async function isBatteryOptimizationEnabled() {
  if (Platform.OS !== "android") return false;
  try {
    const enabled = await BatteryOptEnabled();
    log.info("Battery optimization status", { enabled });
    return enabled;
  } catch (e) {
    log.error("Failed to read battery optimization status", {
      error: e?.message,
      stack: e?.stack,
    });
    // Conservative: assume enabled if unknown
    return true;
  }
}

/**
 * Launches the primary system flow to request ignoring battery optimizations.
 * This opens a Settings screen; it does not yield a synchronous result.
 *
 * Returns:
 *  - false on Android to indicate the user must complete an action in Settings
 *  - true on iOS (no-op)
 */
export async function requestBatteryOptimizationExemption() {
  if (Platform.OS !== "android") return true;

  try {
    log.info("Requesting to disable battery optimization (primary intent)");
    // This opens the OS dialog/settings. No result is provided, handle via AppState return.
    RequestDisableOptimization();
    return false;
  } catch (e) {
    log.error("Primary request to disable battery optimization failed", {
      error: e?.message,
      stack: e?.stack,
    });
    // Even if it throws, we'll guide users via fallbacks.
    return false;
  }
}

/**
 * Opens best-effort fallback screens to let users disable battery optimization.
 * Call this AFTER the user returns and status is still enabled.
 *
 * Strategy:
 *  - Try the list of battery optimization exceptions
 *  - Fallback to app settings
 */
export async function openBatteryOptimizationFallbacks() {
  if (Platform.OS !== "android") return true;

  // Try the generic battery optimization settings list
  try {
    log.info("Opening fallback: IGNORE_BATTERY_OPTIMIZATION_SETTINGS");
    await SendIntentAndroid.openSettings(
      "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS",
    );
    return true;
  } catch (e) {
    log.warn("Failed to open IGNORE_BATTERY_OPTIMIZATION_SETTINGS", {
      error: e?.message,
    });
  }

  // Final fallback: app details settings
  try {
    log.info("Opening fallback: APPLICATION_DETAILS_SETTINGS (app details)");
    await SendIntentAndroid.openAppSettings();
    return true;
  } catch (e) {
    log.error("Failed to open APPLICATION_DETAILS_SETTINGS", {
      error: e?.message,
      stack: e?.stack,
    });
    return false;
  }
}
