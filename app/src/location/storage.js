import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";

const storageLogger = createLogger({
  module: SYSTEM_SCOPES.STORAGE,
  feature: "location-cache",
});

/**
 * Stores location data in AsyncStorage with timestamp
 * @param {Object} coords - Location coordinates object
 * @param {number} coords.latitude - Latitude
 * @param {number} coords.longitude - Longitude
 * @param {number} [coords.accuracy] - Accuracy in meters
 * @param {number} [coords.altitude] - Altitude in meters
 * @param {number} [coords.altitudeAccuracy] - Altitude accuracy in meters
 * @param {number} [coords.heading] - Heading in degrees
 * @param {number} [coords.speed] - Speed in meters/second
 * @param {string|number} [timestamp] - Optional timestamp of the location update. If not provided, current time will be used.
 */
export async function storeLocation(
  coords,
  timestamp = new Date().toISOString(),
) {
  try {
    storageLogger.debug("Storing location data", {
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      },
      timestamp,
    });

    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_KNOWN_LOCATION,
      JSON.stringify({
        coords,
        timestamp,
      }),
    );
    storageLogger.debug("Location data stored successfully");
  } catch (error) {
    storageLogger.error("Failed to store location data", {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Retrieves the last known location from AsyncStorage
 * @returns {Promise<Object|null>} Location object with coords and timestamp, or null if not found
 */
export async function getStoredLocation() {
  try {
    storageLogger.debug("Retrieving stored location data");
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_KNOWN_LOCATION);

    if (!stored) {
      storageLogger.debug("No stored location data found");
      return null;
    }

    const locationData = JSON.parse(stored);
    storageLogger.debug("Retrieved stored location data", {
      timestamp: locationData.timestamp,
      hasCoords: !!locationData.coords,
    });

    return locationData;
  } catch (error) {
    storageLogger.error("Failed to retrieve stored location data", {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}
