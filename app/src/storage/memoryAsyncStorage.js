import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";
import { getAsyncStorageKeys } from "./storageKeys";

const storageLogger = createLogger({
  module: SYSTEM_SCOPES.STORAGE,
  feature: "memory-async-storage",
});

// In-memory cache for AsyncStorage values
const memoryCache = new Map();

// Track if we've loaded from AsyncStorage
let isInitialized = false;
const initPromise = new Promise((resolve) => {
  global.__memoryAsyncStorageInitResolve = resolve;
});

/**
 * Memory-first AsyncStorage wrapper that maintains an in-memory cache
 * for headless/background mode access when AsyncStorage is unavailable
 */
export const memoryAsyncStorage = {
  /**
   * Initialize the memory cache by loading all known keys from AsyncStorage
   */
  async init() {
    if (isInitialized) return;

    storageLogger.info("Initializing memory async storage");

    // Get all registered AsyncStorage keys from the registry
    const knownKeys = getAsyncStorageKeys();

    // Load all known keys into memory
    for (const key of knownKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          memoryCache.set(key, value);
          storageLogger.debug("Loaded key into memory", {
            key,
            hasValue: true,
          });
        }
      } catch (error) {
        storageLogger.warn("Failed to load key from AsyncStorage", {
          key,
          error: error.message,
        });
      }
    }

    // Also load any keys that might exist with getAllKeys
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      for (const key of allKeys) {
        if (!memoryCache.has(key)) {
          try {
            const value = await AsyncStorage.getItem(key);
            if (value !== null) {
              memoryCache.set(key, value);
              storageLogger.debug("Loaded additional key into memory", { key });
            }
          } catch (error) {
            storageLogger.warn("Failed to load additional key", {
              key,
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      storageLogger.warn("Failed to get all keys from AsyncStorage", {
        error: error.message,
      });
    }

    isInitialized = true;
    if (global.__memoryAsyncStorageInitResolve) {
      global.__memoryAsyncStorageInitResolve();
      delete global.__memoryAsyncStorageInitResolve;
    }

    storageLogger.info("Memory async storage initialized", {
      cachedKeys: Array.from(memoryCache.keys()),
    });
  },

  /**
   * Ensure initialization is complete before operations
   */
  async ensureInitialized() {
    if (!isInitialized) {
      await initPromise;
    }
  },

  /**
   * Get item from memory first, fallback to AsyncStorage
   */
  async getItem(key) {
    await this.ensureInitialized();

    // Try memory first
    if (memoryCache.has(key)) {
      const value = memoryCache.get(key);
      storageLogger.debug("Retrieved from memory cache", {
        key,
        hasValue: !!value,
      });
      return value;
    }

    // Fallback to AsyncStorage
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        // Cache for future use
        memoryCache.set(key, value);
        storageLogger.debug("Retrieved from AsyncStorage and cached", { key });
      }
      return value;
    } catch (error) {
      storageLogger.warn(
        "Failed to retrieve from AsyncStorage, returning null",
        {
          key,
          error: error.message,
        },
      );
      // In headless mode, AsyncStorage might not be accessible
      return null;
    }
  },

  /**
   * Set item in both memory and AsyncStorage
   */
  async setItem(key, value) {
    await this.ensureInitialized();

    // Always set in memory first
    memoryCache.set(key, value);
    storageLogger.debug("Set in memory cache", { key });

    // Try to persist to AsyncStorage
    (async () => {
      try {
        await AsyncStorage.setItem(key, value);
        storageLogger.debug("Persisted to AsyncStorage", { key });
      } catch (error) {
        storageLogger.warn(
          "Failed to persist to AsyncStorage, kept in memory only",
          {
            key,
            error: error.message,
          },
        );
      }
    })();
  },

  /**
   * Remove item from both memory and AsyncStorage
   */
  async removeItem(key) {
    await this.ensureInitialized();

    // Delete from memory
    memoryCache.delete(key);
    storageLogger.debug("Deleted from memory cache", { key });

    // Try to delete from AsyncStorage
    (async () => {
      try {
        await AsyncStorage.removeItem(key);
        storageLogger.debug("Deleted from AsyncStorage", { key });
      } catch (error) {
        storageLogger.warn("Failed to delete from AsyncStorage", {
          key,
          error: error.message,
        });
        // Continue - at least removed from memory
      }
    })();
  },

  /**
   * Get all keys from memory cache
   */
  async getAllKeys() {
    await this.ensureInitialized();
    return Array.from(memoryCache.keys());
  },

  /**
   * Get multiple items
   */
  async multiGet(keys) {
    await this.ensureInitialized();
    const result = [];
    for (const key of keys) {
      const value = await this.getItem(key);
      result.push([key, value]);
    }
    return result;
  },

  /**
   * Set multiple items
   */
  async multiSet(keyValuePairs) {
    await this.ensureInitialized();
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  },

  /**
   * Remove multiple items
   */
  async multiRemove(keys) {
    await this.ensureInitialized();
    for (const key of keys) {
      await this.removeItem(key);
    }
  },

  /**
   * Clear all items (use with caution)
   */
  async clear() {
    await this.ensureInitialized();

    // Clear memory
    memoryCache.clear();
    storageLogger.info("Cleared memory cache");

    // Try to clear AsyncStorage
    (async () => {
      try {
        await AsyncStorage.clear();
        storageLogger.info("Cleared AsyncStorage");
      } catch (error) {
        storageLogger.warn("Failed to clear AsyncStorage", {
          error: error.message,
        });
      }
    })();
  },

  /**
   * Sync memory cache back to AsyncStorage (useful when returning from background)
   */
  async syncToAsyncStorage() {
    storageLogger.info("Syncing memory cache to AsyncStorage");

    const syncResults = {
      success: 0,
      failed: 0,
    };

    for (const [key, value] of memoryCache.entries()) {
      try {
        await AsyncStorage.setItem(key, value);
        syncResults.success++;
      } catch (error) {
        syncResults.failed++;
        storageLogger.warn("Failed to sync key to AsyncStorage", {
          key,
          error: error.message,
        });
      }
    }

    storageLogger.info("Memory cache sync completed", syncResults);
  },
};

// Export as default to match the AsyncStorage interface
export default memoryAsyncStorage;
