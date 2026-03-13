import { createAtom } from "~/lib/atomic-zustand";

import getNearbyDefibs from "~/data/getNearbyDefibs";
import {
  computeCorridorQueryRadiusMeters,
  filterDefibsInCorridor,
} from "~/utils/geo/corridor";
import { updateUsefulPlacesDb } from "~/db/updateUsefulPlacesDb";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import createOtaUpdateActions from "./createOtaUpdateActions";

const DEFAULT_NEAR_USER_RADIUS_M = 10_000;
const DEFAULT_CORRIDOR_M = 10_000;
const DEFAULT_LIMIT = 200;

export default createAtom(({ merge, reset }) => {
  const actions = {
    reset,

    setShowDefibsOnAlertMap: (showDefibsOnAlertMap) => {
      merge({ showDefibsOnAlertMap });
    },

    setSelectedDefib: (selectedDefib) => {
      merge({ selectedDefib });
    },

    setShowDaeSuggestModal: (showDaeSuggestModal) => {
      merge({ showDaeSuggestModal });
    },

    setShowUnavailable: (showUnavailable) => {
      merge({ showUnavailable });
    },

    loadNearUser: async ({
      userLonLat,
      radiusMeters = DEFAULT_NEAR_USER_RADIUS_M,
    }) => {
      merge({ loadingNearUser: true, errorNearUser: null });
      try {
        const [lon, lat] = userLonLat;
        const nearUserDefibs = await getNearbyDefibs({
          lat,
          lon,
          radiusMeters,
          limit: DEFAULT_LIMIT,
          progressive: true,
        });
        merge({ nearUserDefibs, loadingNearUser: false });
        return { defibs: nearUserDefibs, error: null };
      } catch (error) {
        // Keep previously loaded data on error (e.g. DB temporarily locked during OTA)
        merge({
          loadingNearUser: false,
          errorNearUser: error,
        });
        return { defibs: [], error };
      }
    },

    loadCorridor: async ({
      userLonLat,
      alertLonLat,
      corridorMeters = DEFAULT_CORRIDOR_M,
    }) => {
      merge({ loadingCorridor: true, errorCorridor: null });
      try {
        const radiusMeters = computeCorridorQueryRadiusMeters({
          userLonLat,
          alertLonLat,
          corridorMeters,
        });

        const midLon = (userLonLat[0] + alertLonLat[0]) / 2;
        const midLat = (userLonLat[1] + alertLonLat[1]) / 2;

        const candidates = await getNearbyDefibs({
          lat: midLat,
          lon: midLon,
          radiusMeters,
          limit: DEFAULT_LIMIT,
          progressive: true,
        });

        const corridorDefibs = filterDefibsInCorridor({
          defibs: candidates,
          userLonLat,
          alertLonLat,
          corridorMeters,
        }).slice(0, DEFAULT_LIMIT);

        merge({ corridorDefibs, loadingCorridor: false });
        return { defibs: corridorDefibs, error: null };
      } catch (error) {
        merge({
          corridorDefibs: [],
          loadingCorridor: false,
          errorCorridor: error,
        });
        return { defibs: [], error };
      }
    },

    // ── DAE DB Over-the-Air Update (shared factory) ───────────────────
    ...(({ loadLastUpdate, triggerUpdate, dismissUpdateError }) => ({
      loadLastDaeUpdate: loadLastUpdate,
      triggerDaeUpdate: triggerUpdate,
      dismissDaeUpdateError: dismissUpdateError,
    }))(
      createOtaUpdateActions({
        merge,
        updateFn: updateUsefulPlacesDb,
        storageKey: STORAGE_KEYS.USEFUL_PLACES_DB_UPDATED_AT,
        keys: {
          state: "daeUpdateState",
          progress: "daeUpdateProgress",
          error: "daeUpdateError",
          lastUpdatedAt: "daeLastUpdatedAt",
        },
        clearOnSuccess: { nearUserDefibs: [], corridorDefibs: [] },
      }),
    ),
  };

  return {
    default: {
      nearUserDefibs: [],
      corridorDefibs: [],
      showDefibsOnAlertMap: false,
      selectedDefib: null,
      showDaeSuggestModal: false,
      showUnavailable: false,

      loadingNearUser: false,
      loadingCorridor: false,
      errorNearUser: null,
      errorCorridor: null,

      // DAE DB update state
      daeUpdateState: "idle", // "idle"|"checking"|"downloading"|"installing"|"done"|"error"|"up-to-date"
      daeUpdateProgress: 0, // 0..1
      daeUpdateError: null,
      daeLastUpdatedAt: null,
    },
    actions,
  };
});
