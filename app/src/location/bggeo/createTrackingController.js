import BackgroundGeolocation from "react-native-background-geolocation";
import { AppState } from "react-native";

import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";
import env from "~/env";

import {
  getAlertState,
  getAuthState,
  getSessionState,
  subscribeAlertState,
  subscribeSessionState,
} from "~/stores";

import setLocationState from "~/location/setLocationState";
import { storeLocation } from "~/location/storage";

import {
  BASE_GEOLOCATION_CONFIG,
  BASE_GEOLOCATION_INVARIANTS,
  TRACKING_PROFILES,
} from "~/location/backgroundGeolocationConfig";

import buildBackgroundGeolocationSetConfigPayload from "~/location/buildBackgroundGeolocationSetConfigPayload";

import {
  ensureBackgroundGeolocationReady,
  clearBackgroundGeolocationEventHandlers,
  setBackgroundGeolocationEventHandlers,
} from "~/location/backgroundGeolocationService";

// Correlation ID to differentiate multiple JS runtimes (eg full `Updates.reloadAsync()`).
const TRACKING_INSTANCE_ID = `${Date.now().toString(36)}-${Math.random()
  .toString(16)
  .slice(2, 8)}`;

const MOVING_EDGE_COOLDOWN_MS = 5 * 60 * 1000;
const PERSISTED_ACCURACY_GATE_M = 100;
const UI_ACCURACY_GATE_M = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldAllowPersistedFix = (location) => {
  const acc = location?.coords?.accuracy;
  return !(typeof acc === "number" && acc > PERSISTED_ACCURACY_GATE_M);
};

const shouldUseLocationForUi = (location) => {
  const acc = location?.coords?.accuracy;
  return !(typeof acc === "number" && acc > UI_ACCURACY_GATE_M);
};

/**
 * Creates a BGGeo tracking controller.
 *
 * Policy constraints enforced:
 * - Pre-auth: BGGeo must remain stopped (no tracking). We also avoid calling `.ready()` pre-auth.
 * - Authenticated: BGGeo configured with `http.url` + `Authorization` header + `autoSync:true`.
 * - No time-based polling (heartbeat remains disabled).
 */
export function createTrackingController() {
  const log = createLogger({
    module: BACKGROUND_SCOPES.GEOLOCATION,
    feature: "tracking-controller",
  });

  /** @type {ReturnType<typeof AppState.addEventListener> | null} */
  let appStateSub = null;
  let appState = AppState.currentState;

  let currentProfile = null;
  let authReady = false;

  // Vendor constraint: never call BGGeo APIs before `.ready()`.
  // This flag tracks whether we've successfully executed `.ready()` in this JS runtime.
  let didReady = false;

  let stopAlertSubscription = null;
  let stopSessionSubscription = null;

  let lastMovingEdgeAt = 0;

  // Track identity so we can force a first geopoint when the effective user changes.
  let lastSessionUserId = null;

  const computeHasOwnOpenAlert = () => {
    try {
      const { userId } = getSessionState();
      const { alertingList } = getAlertState();
      if (!userId || !Array.isArray(alertingList)) return false;
      return alertingList.some(
        ({ oneAlert }) =>
          oneAlert?.state === "open" && oneAlert?.userId === userId,
      );
    } catch (e) {
      log.warn("Failed to compute active-alert state", { error: e?.message });
      return false;
    }
  };

  const safeSync = async (reason) => {
    // Sync can fail transiently (SDK busy, network warming up, etc). Retry a few times.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const [state, pendingBefore] = await Promise.all([
          BackgroundGeolocation.getState(),
          BackgroundGeolocation.getCount(),
        ]);

        log.info("Attempting BGGeo sync", {
          reason,
          attempt,
          enabled: state?.enabled,
          isMoving: state?.isMoving,
          trackingMode: state?.trackingMode,
          pendingBefore,
        });

        const records = await BackgroundGeolocation.sync();
        const pendingAfter = await BackgroundGeolocation.getCount();

        log.info("BGGeo sync success", {
          reason,
          attempt,
          synced: records?.length,
          pendingAfter,
        });
        return true;
      } catch (e) {
        log.warn("BGGeo sync failed", {
          reason,
          attempt,
          error: e?.message,
          stack: e?.stack,
        });
        await sleep(attempt * 1000);
      }
    }
    return false;
  };

  const getCurrentPositionWithDiagnostics = async (
    options,
    { reason, persist },
  ) => {
    const opts = {
      ...options,
      persist,
      extras: {
        ...(options?.extras || {}),
        req_reason: reason,
        req_persist: !!persist,
        req_at: new Date().toISOString(),
        req_app_state: appState,
        req_profile: currentProfile,
      },
    };
    log.debug("Requesting getCurrentPosition", {
      reason,
      persist: !!persist,
      desiredAccuracy: opts?.desiredAccuracy,
      samples: opts?.samples,
      maximumAge: opts?.maximumAge,
      timeout: opts?.timeout,
    });
    return BackgroundGeolocation.getCurrentPosition(opts);
  };

  const applyProfile = async (profileName) => {
    if (!authReady) return;
    if (currentProfile === profileName) {
      // Ensure we're not stuck in geofence-only mode.
      try {
        const s = await BackgroundGeolocation.getState();
        if (s?.trackingMode === 0) {
          await BackgroundGeolocation.start();
        }
      } catch {
        // ignore
      }
      return;
    }

    const profile = TRACKING_PROFILES[profileName];
    if (!profile) {
      log.warn("Unknown tracking profile", { profileName });
      return;
    }

    try {
      const payload = await buildBackgroundGeolocationSetConfigPayload(profile);
      await BackgroundGeolocation.setConfig(payload);

      const state = await BackgroundGeolocation.getState();
      if (state?.trackingMode === 0) {
        await BackgroundGeolocation.start();
      }

      if (profileName === "active") {
        if (!state?.isMoving) {
          await BackgroundGeolocation.changePace(true);
        }

        // ACTIVE: request one immediate persisted fix to ensure first point reaches server quickly.
        try {
          const fix = await getCurrentPositionWithDiagnostics(
            {
              samples: 3,
              timeout: 30,
              maximumAge: 0,
              desiredAccuracy: 10,
              extras: { active_profile_enter: true },
            },
            { reason: "active_profile_enter", persist: true },
          );

          if (!shouldAllowPersistedFix(fix)) {
            log.info("ACTIVE immediate persisted fix ignored (poor accuracy)", {
              accuracy: fix?.coords?.accuracy,
            });
          }
          lastMovingEdgeAt = Date.now();
        } catch (e) {
          log.warn("ACTIVE immediate fix failed", {
            error: e?.message,
            stack: e?.stack,
          });
        }
      } else {
        // IDLE: explicitly exit moving mode if needed.
        if (state?.isMoving) {
          await BackgroundGeolocation.changePace(false);
        }
      }

      currentProfile = profileName;

      log.info("Tracking profile applied", {
        profileName,
        instanceId: TRACKING_INSTANCE_ID,
      });
    } catch (e) {
      log.error("Failed to apply tracking profile", {
        profileName,
        error: e?.message,
        stack: e?.stack,
      });
    }
  };

  const subscribeProfileInputs = () => {
    if (stopSessionSubscription || stopAlertSubscription) return;

    stopSessionSubscription = subscribeSessionState(
      (s) => s?.userId,
      () => {
        const active = computeHasOwnOpenAlert();
        applyProfile(active ? "active" : "idle");
      },
    );
    stopAlertSubscription = subscribeAlertState(
      (s) => s?.alertingList,
      () => {
        const active = computeHasOwnOpenAlert();
        applyProfile(active ? "active" : "idle");
      },
    );
  };

  const unsubscribeProfileInputs = () => {
    try {
      stopAlertSubscription && stopAlertSubscription();
    } finally {
      stopAlertSubscription = null;
    }
    try {
      stopSessionSubscription && stopSessionSubscription();
    } finally {
      stopSessionSubscription = null;
    }
  };

  const registerEventHandlersOnceReady = () => {
    setBackgroundGeolocationEventHandlers({
      onLocation: async (location) => {
        // Ignore sampling locations (eg, emitted during getCurrentPosition).
        if (location?.sample) return;
        if (!shouldUseLocationForUi(location)) return;

        if (location?.coords?.latitude && location?.coords?.longitude) {
          setLocationState(location.coords);
          storeLocation(location.coords, location.timestamp);
        }
      },
      onLocationError: (error) => {
        log.warn("Location error", {
          error: error?.message,
          code: error?.code,
        });
      },
      onHttp: (response) => {
        // Keep minimal; noisy logs only in dev/staging.
        if (!response?.success || __DEV__ || env.IS_STAGING) {
          log.debug("HTTP response", {
            success: response?.success,
            status: response?.status,
          });
        }
      },
      onMotionChange: (event) => {
        log.info("Motion change", {
          instanceId: TRACKING_INSTANCE_ID,
          profile: currentProfile,
          appState,
          authReady,
          isMoving: event?.isMoving,
          accuracy: event?.location?.coords?.accuracy,
          speed: event?.location?.coords?.speed,
        });

        // ACTIVE only: on moving edge, force one persisted fix + sync (cooldown).
        if (event?.isMoving && authReady && currentProfile === "active") {
          const now = Date.now();
          if (now - lastMovingEdgeAt < MOVING_EDGE_COOLDOWN_MS) return;
          lastMovingEdgeAt = now;

          (async () => {
            try {
              const fix = await getCurrentPositionWithDiagnostics(
                {
                  samples: 1,
                  timeout: 30,
                  maximumAge: 0,
                  desiredAccuracy: 50,
                  extras: { moving_edge: true },
                },
                { reason: "moving_edge", persist: true },
              );

              if (!shouldAllowPersistedFix(fix)) {
                log.info("Moving-edge persisted fix ignored (poor accuracy)", {
                  accuracy: fix?.coords?.accuracy,
                });
                return;
              }
            } catch (e) {
              log.warn("Moving-edge fix failed", {
                error: e?.message,
                stack: e?.stack,
              });
            }
            await safeSync("moving-edge");
          })();
        }
      },
      onProviderChange: (event) => {
        log.info("Provider change", {
          status: event?.status,
          enabled: event?.enabled,
          network: event?.network,
          gps: event?.gps,
          accuracyAuthorization: event?.accuracyAuthorization,
        });
      },
    });
  };

  const ensureReadyAndApplyInvariants = async () => {
    await ensureBackgroundGeolocationReady(BASE_GEOLOCATION_CONFIG);
    didReady = true;

    // Ensure critical config cannot drift due to persisted plugin state.
    // (We intentionally keep auth headers separate and set them in handleAuthToken.)
    const payload = await buildBackgroundGeolocationSetConfigPayload(
      BASE_GEOLOCATION_INVARIANTS,
    );
    await BackgroundGeolocation.setConfig(payload);

    registerEventHandlersOnceReady();
  };

  const configureUploadsForAuth = async (token) => {
    const payload = await buildBackgroundGeolocationSetConfigPayload({
      http: {
        url: env.GEOLOC_SYNC_URL,
        autoSync: true,
        batchSync: false,
        autoSyncThreshold: 0,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    await BackgroundGeolocation.setConfig(payload);
  };

  const disableUploads = async () => {
    const payload = await buildBackgroundGeolocationSetConfigPayload({
      http: {
        url: "",
        autoSync: false,
        batchSync: false,
        autoSyncThreshold: 0,
        headers: {},
      },
    });
    await BackgroundGeolocation.setConfig(payload);
  };

  const ensureStarted = async () => {
    const state = await BackgroundGeolocation.getState();
    if (!state?.enabled) {
      await BackgroundGeolocation.start();
    }

    // Extra guard against geofence-only mode.
    const s2 = await BackgroundGeolocation.getState();
    if (s2?.trackingMode === 0) {
      await BackgroundGeolocation.start();
    }
  };

  const stopAndDetach = async () => {
    try {
      // Stop native service first (policy: no tracking while logged-out).
      if (didReady) {
        await BackgroundGeolocation.stop();
      }
    } catch (e) {
      log.debug("BGGeo stop failed (ignored)", { error: e?.message });
    }

    unsubscribeProfileInputs();
    clearBackgroundGeolocationEventHandlers();
    authReady = false;
    currentProfile = null;
    lastSessionUserId = null;
  };

  const handleAuthToken = async (token) => {
    const sessionUserId = (() => {
      try {
        return getSessionState()?.userId ?? null;
      } catch {
        return null;
      }
    })();

    if (!token || !sessionUserId) {
      // Pre-auth policy: BGGeo must remain stopped.
      log.info("No auth: ensuring BGGeo is stopped", {
        hasToken: !!token,
        hasSessionUserId: !!sessionUserId,
        instanceId: TRACKING_INSTANCE_ID,
      });

      // Safety net: if BGGeo was previously enabled (eg user logs out, or a prior run left
      // tracking enabled), remove upload credentials and stop native tracking.
      //
      // NOTE: This calls `.ready()` to comply with vendor rules, but does NOT start tracking.
      try {
        await ensureBackgroundGeolocationReady(BASE_GEOLOCATION_CONFIG);
        didReady = true;
        await disableUploads();
      } catch (e) {
        log.debug("Failed to ready/disable uploads during logout", {
          error: e?.message,
        });
      }

      await stopAndDetach();
      return;
    }

    // Authenticated path.
    log.info("Auth ready: configuring and starting BGGeo", {
      instanceId: TRACKING_INSTANCE_ID,
    });

    await ensureReadyAndApplyInvariants();
    await configureUploadsForAuth(token);

    authReady = true;

    await ensureStarted();

    // Identity change: force a persisted fix + sync for a fast first point.
    if (sessionUserId !== lastSessionUserId) {
      const reason = lastSessionUserId ? "user-switch" : "first-login";
      lastSessionUserId = sessionUserId;
      try {
        const fix = await getCurrentPositionWithDiagnostics(
          {
            samples: 1,
            timeout: 30,
            maximumAge: 0,
            desiredAccuracy: 50,
            extras: {
              identity_fix: true,
              identity_reason: reason,
              session_user_id: sessionUserId,
            },
          },
          { reason: `identity_fix:${reason}`, persist: true },
        );

        if (!shouldAllowPersistedFix(fix)) {
          log.info("Identity persisted fix ignored (poor accuracy)", {
            accuracy: fix?.coords?.accuracy,
          });
        }
      } catch (e) {
        log.warn("Identity persisted fix failed", {
          error: e?.message,
          stack: e?.stack,
        });
      }

      await safeSync(`identity-fix:${reason}`);
    }

    // Apply the right profile and subscribe to future changes.
    await applyProfile(computeHasOwnOpenAlert() ? "active" : "idle");
    subscribeProfileInputs();
  };

  const init = async () => {
    log.info("Tracking controller init", {
      instanceId: TRACKING_INSTANCE_ID,
      appState,
    });

    // AppState listener does not call BGGeo; safe pre-auth.
    try {
      appStateSub = AppState.addEventListener("change", (next) => {
        appState = next;
      });
    } catch (e) {
      log.debug("Failed to register AppState listener", { error: e?.message });
    }

    // Note: we intentionally do NOT call `.ready()` here (pre-auth policy).
  };

  const destroy = async () => {
    try {
      appStateSub?.remove?.();
    } finally {
      appStateSub = null;
    }
    await stopAndDetach();
  };

  return {
    init,
    destroy,
    handleAuthToken,
  };
}
