import { Platform } from "react-native";
import BackgroundGeolocation from "react-native-background-geolocation";
import { memoryAsyncStorage } from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { createLogger } from "~/lib/logger";
import { getStoredLocation } from "./storage";
import { getAuthState } from "~/stores";
import env from "~/env";

// Constants for persistence
const FORCE_SYNC_INTERVAL = 12 * 60 * 60 * 1000;
// const FORCE_SYNC_INTERVAL = 1 * 60 * 1000; // DEBUGGING

const geolocBgLogger = createLogger({
  service: "background-task",
  task: "headless",
});

// Helper functions for persisting sync time
const getLastSyncTime = async () => {
  try {
    const value = await memoryAsyncStorage.getItem(
      STORAGE_KEYS.GEOLOCATION_LAST_SYNC_TIME,
    );
    return value ? parseInt(value, 10) : Date.now();
  } catch (error) {
    return 0;
  }
};

const setLastSyncTime = async (time) => {
  try {
    await memoryAsyncStorage.setItem(
      STORAGE_KEYS.GEOLOCATION_LAST_SYNC_TIME,
      time.toString(),
    );
  } catch (error) {
    // silent error
  }
};

const executeSyncAndroid = async () => {
  await BackgroundGeolocation.changePace(true);
  await BackgroundGeolocation.sync();
};

const executeSyncIOS = async () => {
  const debugWebhook =
    "https://webhook.site/433b6aca-b169-4073-924a-4f089ca30406";

  // Helper function to send debug info
  const sendDebug = async (step, data = {}) => {
    try {
      // Build query string manually since URLSearchParams is not available in React Native
      const queryData = {
        step,
        timestamp: new Date().toISOString(),
        ...Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] =
            typeof value === "object" ? JSON.stringify(value) : String(value);
          return acc;
        }, {}),
      };

      const queryString = Object.entries(queryData)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
        )
        .join("&");

      await fetch(`${debugWebhook}?${queryString}`, { method: "GET" });
    } catch (e) {
      // Ignore debug errors
    }
  };

  try {
    // Debug point 1: Function start
    await sendDebug("1_function_start", { platform: "iOS" });

    // Debug point 2: Before getStoredLocation
    await sendDebug("2_before_get_stored_location");

    const locationData = await getStoredLocation();

    // Debug point 3: After getStoredLocation
    await sendDebug("3_after_get_stored_location", {
      hasData: !!locationData,
      timestamp: locationData?.timestamp || "null",
      hasCoords: !!locationData?.coords,
      latitude: locationData?.coords?.latitude || "null",
      longitude: locationData?.coords?.longitude || "null",
    });

    if (!locationData) {
      geolocBgLogger.debug("No stored location data found, skipping sync");
      await sendDebug("3a_no_location_data");
      return;
    }

    const { timestamp, coords } = locationData;

    // Check if timestamp is too old (> 2 weeks)
    const now = new Date();
    const locationTime = new Date(timestamp);
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
    const locationAge = now - locationTime;

    // Debug point 4: Timestamp validation
    await sendDebug("4_timestamp_validation", {
      locationAge: locationAge,
      maxAge: twoWeeksInMs,
      isTooOld: locationAge > twoWeeksInMs,
      timestamp: timestamp,
    });

    if (locationAge > twoWeeksInMs) {
      geolocBgLogger.debug("Stored location is too old, skipping sync", {
        locationAge: locationAge,
        maxAge: twoWeeksInMs,
        timestamp: timestamp,
      });
      await sendDebug("4a_location_too_old");
      return;
    }

    // Get auth token
    const { userToken } = getAuthState();

    // Debug point 5: Auth token check
    await sendDebug("5_auth_token_check", {
      hasToken: !!userToken,
      tokenLength: userToken ? userToken.length : 0,
    });

    if (!userToken) {
      geolocBgLogger.debug("No auth token available, skipping sync");
      await sendDebug("5a_no_auth_token");
      return;
    }

    // Validate coordinates
    if (
      !coords ||
      typeof coords.latitude !== "number" ||
      typeof coords.longitude !== "number"
    ) {
      geolocBgLogger.error("Invalid coordinates in stored location", {
        coords,
      });
      await sendDebug("5b_invalid_coordinates", {
        hasCoords: !!coords,
        latType: typeof coords?.latitude,
        lonType: typeof coords?.longitude,
      });
      return;
    }

    // Prepare payload according to API spec
    const payload = {
      location: {
        event: "heartbeat",
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      },
    };

    geolocBgLogger.debug("Syncing location to server", {
      url: env.GEOLOC_SYNC_URL,
      coords: payload.location.coords,
    });

    // Debug point 6: Before sync request
    await sendDebug("6_before_sync_request", {
      url: env.GEOLOC_SYNC_URL,
      latitude: payload.location.coords.latitude,
      longitude: payload.location.coords.longitude,
      event: payload.location.event,
    });

    // Make HTTP request
    const response = await fetch(env.GEOLOC_SYNC_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await sendDebug("7a_sync_http_error", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    if (responseData.ok !== true) {
      await sendDebug("7b_sync_api_error", {
        apiOk: responseData.ok,
        responseData: JSON.stringify(responseData),
      });
      throw new Error(`API returned ok: ${responseData.ok}`);
    }

    // Debug point 7: Sync success
    await sendDebug("7_sync_success", {
      status: response.status,
      latitude: payload.location.coords.latitude,
      longitude: payload.location.coords.longitude,
    });

    geolocBgLogger.info("iOS location sync completed successfully", {
      status: response.status,
      coords: payload.location.coords,
    });
  } catch (error) {
    // Debug point 8: Error catch
    await sendDebug("8_error_caught", {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack ? error.stack.substring(0, 500) : "no_stack",
    });

    geolocBgLogger.error("iOS location sync failed", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// Shared heartbeat logic - mutualized between Android and iOS
const executeSync = async () => {
  if (Platform.OS === "ios") {
    await executeSyncIOS();
  } else if (Platform.OS === "android") {
    await executeSyncAndroid();
  }
};
export const executeHeartbeatSync = async () => {
  const lastSyncTime = await getLastSyncTime();
  const now = Date.now();
  const timeSinceLastSync = now - lastSyncTime;

  if (timeSinceLastSync >= FORCE_SYNC_INTERVAL) {
    geolocBgLogger.info("Forcing location sync", {
      timeSinceLastSync,
      forceInterval: FORCE_SYNC_INTERVAL,
    });

    try {
      const syncResult = await Promise.race([
        executeSync(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("changePace timeout")), 20000),
        ),
      ]);

      await setLastSyncTime(now);

      geolocBgLogger.info("Force sync completed successfully", {
        syncResult,
      });

      return syncResult;
    } catch (syncError) {
      geolocBgLogger.error("Force sync failed", {
        error: syncError.message,
        timeSinceLastSync,
      });

      return {
        syncPerformed: true,
        syncSuccessful: false,
        error: syncError.message,
      };
    }
  } else {
    geolocBgLogger.debug("Sync not needed yet", {
      timeSinceLastSync,
      forceInterval: FORCE_SYNC_INTERVAL,
      timeUntilNextSync: FORCE_SYNC_INTERVAL - timeSinceLastSync,
    });

    return {
      syncPerformed: false,
      syncSuccessful: true,
    };
  }
};
