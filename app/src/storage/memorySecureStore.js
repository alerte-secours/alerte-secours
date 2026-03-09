import { secureStore as originalSecureStore } from "./secureStore";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES } from "~/lib/logger/scopes";
import { getSecureStoreKeys } from "./storageKeys";

const storageLogger = createLogger({
  module: SYSTEM_SCOPES.STORAGE,
  feature: "memory-secure-store",
});

// In-memory cache for secure store values
const memoryCache = new Map();

// Track if we've loaded from secure store
let isInitialized = false;
const initPromise = new Promise((resolve) => {
  global.__memorySecureStoreInitResolve = resolve;
});

/**
 * Memory-first secure store wrapper that maintains an in-memory cache
 * for headless/background mode access when secure store is unavailable
 */
export const memorySecureStore = {
  /**
   * Initialize the memory cache by loading all known keys from secure store
   */
  async init() {
    if (isInitialized) return;

    storageLogger.info("Initializing memory secure store");

    // Get all registered secure store keys from the registry
    const knownKeys = getSecureStoreKeys();

    // Load all known keys into memory
    for (const key of knownKeys) {
      try {
        const value = await originalSecureStore.getItemAsync(key);
        if (value !== null) {
          memoryCache.set(key, value);
          storageLogger.debug("Loaded key into memory", {
            key,
            hasValue: true,
          });
        }
      } catch (error) {
        storageLogger.warn("Failed to load key from secure store", {
          key,
          error: error.message,
        });
      }
    }

    isInitialized = true;
    if (global.__memorySecureStoreInitResolve) {
      global.__memorySecureStoreInitResolve();
      delete global.__memorySecureStoreInitResolve;
    }

    storageLogger.info("Memory secure store initialized", {
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
   * Get item from memory first, fallback to secure store
   */
  async getItemAsync(key) {
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

    // Fallback to secure store
    try {
      const value = await originalSecureStore.getItemAsync(key);
      if (value !== null) {
        // Cache for future use
        memoryCache.set(key, value);
        storageLogger.debug("Retrieved from secure store and cached", { key });
      }
      return value;
    } catch (error) {
      storageLogger.warn(
        "Failed to retrieve from secure store, returning null",
        {
          key,
          error: error.message,
        },
      );
      // In headless mode, secure store might not be accessible
      return null;
    }
  },

  /**
   * Set item in both memory and secure store
   */
  async setItemAsync(key, value) {
    await this.ensureInitialized();

    // Always set in memory first
    memoryCache.set(key, value);
    storageLogger.debug("Set in memory cache", { key });

    // Try to persist to secure store
    try {
      await originalSecureStore.setItemAsync(key, value);
      storageLogger.debug("Persisted to secure store", { key });
    } catch (error) {
      storageLogger.warn(
        "Failed to persist to secure store, kept in memory only",
        {
          key,
          error: error.message,
        },
      );
      // Continue - value is at least in memory
    }
  },

  /**
   * Delete item from both memory and secure store
   */
  async deleteItemAsync(key) {
    await this.ensureInitialized();

    // Delete from memory
    memoryCache.delete(key);
    storageLogger.debug("Deleted from memory cache", { key });

    // Try to delete from secure store
    try {
      await originalSecureStore.deleteItemAsync(key);
      storageLogger.debug("Deleted from secure store", { key });
    } catch (error) {
      storageLogger.warn("Failed to delete from secure store", {
        key,
        error: error.message,
      });
      // Continue - at least removed from memory
    }
  },

  /**
   * Sync memory cache back to secure store (useful when returning from background)
   */
  async syncToSecureStore() {
    storageLogger.info("Syncing memory cache to secure store");

    const syncResults = {
      success: 0,
      failed: 0,
    };

    for (const [key, value] of memoryCache.entries()) {
      try {
        await originalSecureStore.setItemAsync(key, value);
        syncResults.success++;
      } catch (error) {
        syncResults.failed++;
        storageLogger.warn("Failed to sync key to secure store", {
          key,
          error: error.message,
        });
      }
    }

    storageLogger.info("Memory cache sync completed", syncResults);
  },
};

// Export as default to match the original secureStore interface
export const secureStore = memorySecureStore;
