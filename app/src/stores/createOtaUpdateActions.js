// Factory for OTA database update actions shared between defibs and usefulPlaces stores.

import memoryAsyncStorage from "~/storage/memoryAsyncStorage";
import userFriendlyDbError from "~/utils/places/userFriendlyDbError";

const AUTO_DISMISS_DELAY = 4_000;

/**
 * Create the three OTA update actions (loadLastUpdate, triggerUpdate, dismissUpdateError)
 * for a store that uses merge() to set state.
 *
 * @param {Object} opts
 * @param {function} opts.merge - store's merge function
 * @param {function} opts.updateFn - async function that performs the DB update
 * @param {string}   opts.storageKey - storage key for the last-update timestamp
 * @param {Object} opts.keys - state key mapping:
 *   { state, progress, error, lastUpdatedAt }
 * @param {Object} opts.clearOnSuccess - extra state to merge on successful update
 *   (e.g. { nearUserPlaces: [] } or { nearUserDefibs: [], corridorDefibs: [] })
 * @param {function} [opts.migrateStorageKey] - optional async fn to migrate legacy storage keys
 */
export default function createOtaUpdateActions({
  merge,
  updateFn,
  storageKey,
  keys,
  clearOnSuccess,
  migrateStorageKey,
}) {
  const {
    state: stateKey,
    progress: progressKey,
    error: errorKey,
    lastUpdatedAt: lastUpdatedAtKey,
  } = keys;

  let _dismissTimer = null;

  function scheduleDismiss() {
    clearDismissTimer();
    _dismissTimer = setTimeout(() => {
      _dismissTimer = null;
      merge({ [stateKey]: "idle" });
    }, AUTO_DISMISS_DELAY);
  }

  function clearDismissTimer() {
    if (_dismissTimer !== null) {
      clearTimeout(_dismissTimer);
      _dismissTimer = null;
    }
  }

  return {
    loadLastUpdate: async () => {
      try {
        let stored = await memoryAsyncStorage.getItem(storageKey);

        // Run optional migration (e.g. legacy DAE_DB_UPDATED_AT → USEFUL_PLACES_DB_UPDATED_AT)
        if (!stored && typeof migrateStorageKey === "function") {
          stored = await migrateStorageKey();
        }

        if (stored) {
          merge({ [lastUpdatedAtKey]: stored });
        }
      } catch {
        // Non-fatal
      }
    },

    triggerUpdate: async () => {
      // Cancel any pending dismiss timer from a previous update
      clearDismissTimer();

      merge({
        [stateKey]: "checking",
        [progressKey]: 0,
        [errorKey]: null,
      });

      try {
        const result = await updateFn({
          onPhase: (phase) => {
            merge({ [stateKey]: phase });
          },
          onProgress: ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            const progress =
              totalBytesExpectedToWrite > 0
                ? totalBytesWritten / totalBytesExpectedToWrite
                : 0;
            merge({
              [stateKey]: "downloading",
              [progressKey]: progress,
            });
          },
        });

        if (result.alreadyUpdating || result.alreadyUpToDate) {
          merge({ [stateKey]: "up-to-date" });
          scheduleDismiss();
          return;
        }

        if (!result.success) {
          merge({
            [stateKey]: "error",
            [errorKey]: userFriendlyDbError(result.error),
          });
          return;
        }

        merge({
          [stateKey]: "done",
          [lastUpdatedAtKey]: result.updatedAt,
          ...clearOnSuccess,
        });

        scheduleDismiss();
      } catch (error) {
        merge({
          [stateKey]: "error",
          [errorKey]: userFriendlyDbError(error),
        });
      }
    },

    dismissUpdateError: () => {
      merge({ [stateKey]: "idle", [errorKey]: null });
    },
  };
}
