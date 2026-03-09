import { createAtom } from "~/lib/atomic-zustand";

import getNearbyDefibs from "~/data/getNearbyDefibs";
import {
  computeCorridorQueryRadiusMeters,
  filterDefibsInCorridor,
} from "~/utils/geo/corridor";
import { updateDaeDb } from "~/db/updateDaeDb";
import memoryAsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";

const DEFAULT_NEAR_USER_RADIUS_M = 10_000;
const DEFAULT_CORRIDOR_M = 10_000;
const DEFAULT_LIMIT = 200;

const AUTO_DISMISS_DELAY = 4_000;

/**
 * Convert a technical DAE update error into a user-friendly French message.
 * The raw technical details are already logged via console.warn in updateDaeDb.
 */
function userFriendlyDaeError(error) {
  const msg = error?.message || "";
  if (msg.includes("Network") || msg.includes("network")) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.";
  }
  if (msg.includes("HTTP")) {
    return "Le serveur a rencontré un problème. Veuillez réessayer ultérieurement.";
  }
  if (msg.includes("Download failed") || msg.includes("file is empty")) {
    return "Le téléchargement a échoué. Veuillez réessayer.";
  }
  if (msg.includes("failed validation")) {
    return "Le fichier téléchargé est corrompu. Veuillez réessayer.";
  }
  return "La mise à jour a échoué. Veuillez réessayer ultérieurement.";
}

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
        merge({
          nearUserDefibs: [],
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

    // ── DAE DB Over-the-Air Update ─────────────────────────────────────

    loadLastDaeUpdate: async () => {
      try {
        const stored = await memoryAsyncStorage.getItem(
          STORAGE_KEYS.DAE_DB_UPDATED_AT,
        );
        if (stored) {
          merge({ daeLastUpdatedAt: stored });
        }
      } catch {
        // Non-fatal
      }
    },

    triggerDaeUpdate: async () => {
      merge({
        daeUpdateState: "checking",
        daeUpdateProgress: 0,
        daeUpdateError: null,
      });

      const result = await updateDaeDb({
        onPhase: (phase) => {
          merge({ daeUpdateState: phase });
        },
        onProgress: ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          const progress =
            totalBytesExpectedToWrite > 0
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0;
          merge({
            daeUpdateState: "downloading",
            daeUpdateProgress: progress,
          });
        },
      });

      if (result.alreadyUpToDate) {
        merge({ daeUpdateState: "up-to-date" });
        setTimeout(() => {
          merge({ daeUpdateState: "idle" });
        }, AUTO_DISMISS_DELAY);
        return;
      }

      if (!result.success) {
        merge({
          daeUpdateState: "error",
          daeUpdateError: userFriendlyDaeError(result.error),
        });
        return;
      }

      // Success: update stored timestamp and clear loaded defibs
      // so the next query fetches from the fresh DB.
      merge({
        daeUpdateState: "done",
        daeLastUpdatedAt: result.updatedAt,
        nearUserDefibs: [],
        corridorDefibs: [],
      });

      setTimeout(() => {
        merge({ daeUpdateState: "idle" });
      }, AUTO_DISMISS_DELAY);
    },

    dismissDaeUpdateError: () => {
      merge({ daeUpdateState: "idle", daeUpdateError: null });
    },
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
