import * as SecureStore from "expo-secure-store";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";

const storageLogger = createLogger({
  module: SYSTEM_SCOPES.STORAGE,
  feature: "secure-store",
});

const secureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

/**
 * Wrapper for SecureStore that uses AFTER_FIRST_UNLOCK accessibility
 * to prevent "User interaction is not allowed" errors on iOS
 * see also https://github.com/expo/expo/issues/23924
 */
export const secureStore = {
  getItemAsync: async (key) => {
    storageLogger.debug("Retrieving secure item", { key });
    const value = await SecureStore.getItemAsync(key, secureStoreOptions);
    storageLogger.debug("Secure item retrieval result", {
      key,
      hasValue: !!value,
    });
    return value;
  },
  setItemAsync: async (key, value) => {
    storageLogger.debug("Setting secure item", { key });
    await SecureStore.setItemAsync(key, value, secureStoreOptions);
    storageLogger.debug("Secure item set successfully", { key });
  },
  deleteItemAsync: async (key) => {
    storageLogger.debug("Deleting secure item", { key });
    await SecureStore.deleteItemAsync(key, secureStoreOptions);
    storageLogger.debug("Secure item deleted successfully", { key });
  },
};

/**
 * Migrates a key from the old accessibility setting to the new one
 */
export const migrateKey = async (oldKey, newKey = oldKey) => {
  storageLogger.info("Starting secure store key migration", { oldKey, newKey });
  try {
    // Try to get value with old accessibility setting
    const value = await SecureStore.getItemAsync(oldKey);
    if (value) {
      storageLogger.debug("Found value with old accessibility setting", {
        oldKey,
      });
      // Store with new accessibility setting
      await secureStore.setItemAsync(newKey, value);
      storageLogger.debug("Stored value with new accessibility setting", {
        newKey,
      });
      // Clean up old key if the new key is different
      if (oldKey !== newKey) {
        await SecureStore.deleteItemAsync(oldKey);
        storageLogger.debug("Cleaned up old key", { oldKey });
      }
      storageLogger.info("Key migration completed successfully", {
        oldKey,
        newKey,
      });
      return value;
    }
  } catch (error) {
    storageLogger.error("Failed to migrate secure store key", {
      oldKey,
      error: error.message,
      stack: error.stack,
    });
  }
  return null;
};
