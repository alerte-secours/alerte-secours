/**
 * Storage Keys Registry
 *
 * This file maintains a registry of all storage keys used throughout the application.
 * By defining keys as constants here, they are automatically included in memory storage
 * initialization, eliminating the need for manual maintenance of key lists.
 */

const secureStoreKeys = new Set();
const asyncStorageKeys = new Set();

/**
 * Register a secure store key and return it as a constant
 * @param {string} key - The storage key to register for secure store
 * @returns {string} The same key, now registered for secure store
 */
export const registerSecureStoreKey = (key) => {
  secureStoreKeys.add(key);
  return key;
};

/**
 * Register an AsyncStorage key and return it as a constant
 * @param {string} key - The storage key to register for AsyncStorage
 * @returns {string} The same key, now registered for AsyncStorage
 */
export const registerAsyncStorageKey = (key) => {
  asyncStorageKeys.add(key);
  return key;
};

/**
 * Get all secure store keys
 * @returns {string[]} Array of secure store keys
 */
export const getSecureStoreKeys = () => Array.from(secureStoreKeys);

/**
 * Get all AsyncStorage keys
 * @returns {string[]} Array of AsyncStorage keys
 */
export const getAsyncStorageKeys = () => Array.from(asyncStorageKeys);

/**
 * Get all registered storage keys (both types)
 * @returns {string[]} Array of all registered keys
 */
export const getAllRegisteredKeys = () => [
  ...Array.from(secureStoreKeys),
  ...Array.from(asyncStorageKeys),
];

/**
 * Storage key constants
 * All storage keys used throughout the application should be defined here.
 */
export const STORAGE_KEYS = {
  // Secure Store Keys - Authentication & Security
  DEVICE_UUID: registerSecureStoreKey("deviceUuid"),
  AUTH_TOKEN: registerSecureStoreKey("authToken"),
  USER_TOKEN: registerSecureStoreKey("userToken"),
  DEV_AUTH_TOKEN: registerSecureStoreKey("dev.authToken"),
  DEV_USER_TOKEN: registerSecureStoreKey("dev.userToken"),
  ANON_AUTH_TOKEN: registerSecureStoreKey("anon.authToken"),
  ANON_USER_TOKEN: registerSecureStoreKey("anon.userToken"),
  FCM_TOKEN_STORED: registerSecureStoreKey("fcmTokenStored"),
  FCM_TOKEN_STORED_DEVICE_ID: registerSecureStoreKey("fcmTokenStoredDeviceId"),
  ENV_IS_STAGING: registerSecureStoreKey("env.isStaging"),

  // AsyncStorage Keys - App State & Preferences
  GEOLOCATION_LAST_SYNC_TIME: registerAsyncStorageKey(
    "@geolocation_last_sync_time",
  ),
  EULA_ACCEPTED: registerAsyncStorageKey("@eula_accepted"),
  OVERRIDE_MESSAGES: registerAsyncStorageKey("@override_messages"),
  PERMISSION_WIZARD_COMPLETED: registerAsyncStorageKey(
    "@permission_wizard_completed",
  ),
  LAST_UPDATE_CHECK_TIME: registerAsyncStorageKey("lastUpdateCheckTime"),
  LAST_KNOWN_LOCATION: registerAsyncStorageKey("@last_known_location"),
  EULA_ACCEPTED_SIMPLE: registerAsyncStorageKey("eula_accepted"),
  EMULATOR_MODE_ENABLED: registerAsyncStorageKey("emulator_mode_enabled"),
  SENTRY_ENABLED: registerAsyncStorageKey("@sentry_enabled"),
  DAE_DB_UPDATED_AT: registerAsyncStorageKey("@dae_db_updated_at"),
  USEFUL_PLACES_DB_UPDATED_AT: registerAsyncStorageKey(
    "@useful_places_db_updated_at",
  ),
};
