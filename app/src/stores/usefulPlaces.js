import { createAtom } from "~/lib/atomic-zustand";

import getNearbyUsefulPlaces from "~/data/getNearbyUsefulPlaces";
import { updateUsefulPlacesDb } from "~/db/updateUsefulPlacesDb";
import memoryAsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { ALL_TYPES, DEFAULT_TYPES } from "~/utils/places/constants";
import createOtaUpdateActions from "./createOtaUpdateActions";

const DEFAULT_RADIUS_M = 50_000;
const DEFAULT_LIMIT = 200;

export default createAtom(({ merge, reset }) => {
  const actions = {
    reset,

    setSelectedPlace: (selectedPlace) => {
      merge({ selectedPlace });
    },

    setMapVisibleTypes: (mapVisibleTypes) => {
      merge({ mapVisibleTypes });
    },

    setListVisibleTypes: (listVisibleTypes) => {
      merge({ listVisibleTypes });
    },

    setAlertAggVisibleTypes: (alertAggVisibleTypes) => {
      merge({ alertAggVisibleTypes });
    },

    loadNearUser: async ({
      userLonLat,
      radiusMeters = DEFAULT_RADIUS_M,
      types = null,
    }) => {
      merge({ loadingNearUser: true, errorNearUser: null });
      try {
        const [lon, lat] = userLonLat;
        const nearUserPlaces = await getNearbyUsefulPlaces({
          lat,
          lon,
          radiusMeters,
          limit: DEFAULT_LIMIT,
          types,
          progressive: true,
        });
        merge({ nearUserPlaces, loadingNearUser: false });
        return { places: nearUserPlaces, error: null };
      } catch (error) {
        // Keep previously loaded data on error (e.g. DB temporarily locked during OTA)
        merge({
          loadingNearUser: false,
          errorNearUser: error,
        });
        return { places: [], error };
      }
    },

    // ── OTA Update (shared factory) ────────────────────────────────────
    ...createOtaUpdateActions({
      merge,
      updateFn: updateUsefulPlacesDb,
      storageKey: STORAGE_KEYS.USEFUL_PLACES_DB_UPDATED_AT,
      keys: {
        state: "updateState",
        progress: "updateProgress",
        error: "updateError",
        lastUpdatedAt: "lastUpdatedAt",
      },
      clearOnSuccess: { nearUserPlaces: [] },
      // Migrate legacy DAE_DB_UPDATED_AT → USEFUL_PLACES_DB_UPDATED_AT
      migrateStorageKey: async () => {
        if (!STORAGE_KEYS.DAE_DB_UPDATED_AT) return null;
        const legacy = await memoryAsyncStorage.getItem(
          STORAGE_KEYS.DAE_DB_UPDATED_AT,
        );
        if (legacy) {
          await memoryAsyncStorage.setItem(
            STORAGE_KEYS.USEFUL_PLACES_DB_UPDATED_AT,
            legacy,
          );
          await memoryAsyncStorage.removeItem(STORAGE_KEYS.DAE_DB_UPDATED_AT);
          return legacy;
        }
        return null;
      },
    }),
  };

  return {
    default: {
      nearUserPlaces: [],
      selectedPlace: null,
      mapVisibleTypes: ALL_TYPES,
      listVisibleTypes: DEFAULT_TYPES,
      alertAggVisibleTypes: DEFAULT_TYPES,

      loadingNearUser: false,
      errorNearUser: null,

      // OTA update state
      updateState: "idle", // "idle"|"checking"|"downloading"|"installing"|"done"|"error"|"up-to-date"
      updateProgress: 0,
      updateError: null,
      lastUpdatedAt: null,
    },
    actions,
  };
});
