import BackgroundGeolocation from "react-native-background-geolocation";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import { BASE_GEOLOCATION_CONFIG } from "./backgroundGeolocationConfig";

const bgGeoLogger = createLogger({
  module: BACKGROUND_SCOPES.GEOLOCATION,
  feature: "bg-geo-service",
});

let readyPromise = null;
let lastReadyState = null;

let subscriptions = [];
let handlersSignature = null;

export function clearBackgroundGeolocationEventHandlers() {
  subscriptions.forEach((s) => s?.remove?.());
  subscriptions = [];
  handlersSignature = null;
}

export async function ensureBackgroundGeolocationReady(
  config = BASE_GEOLOCATION_CONFIG,
) {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    bgGeoLogger.info("Calling BackgroundGeolocation.ready");
    const state = await BackgroundGeolocation.ready(config);
    lastReadyState = state;
    bgGeoLogger.info("BackgroundGeolocation is ready", {
      enabled: state?.enabled,
      isMoving: state?.isMoving,
      trackingMode: state?.trackingMode,
      schedulerEnabled: state?.schedulerEnabled,
    });
    return state;
  })().catch((error) => {
    // Allow retry if ready fails.
    readyPromise = null;
    lastReadyState = null;
    bgGeoLogger.error("BackgroundGeolocation.ready failed", {
      error: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    throw error;
  });

  return readyPromise;
}

export function getLastReadyState() {
  return lastReadyState;
}

export function setBackgroundGeolocationEventHandlers({
  onLocation,
  onLocationError,
  onGeofence,
  onHttp,
  onHeartbeat,
  onSchedule,
  onMotionChange,
  onActivityChange,
  onProviderChange,
  onConnectivityChange,
  onEnabledChange,
} = {}) {
  // Avoid duplicate registration when `trackLocation()` is called multiple times.
  // We use a simple signature so calling with identical functions is a no-op.
  const sig = [
    onLocation ? "L1" : "L0",
    onGeofence ? "G1" : "G0",
    onHttp ? "H1" : "H0",
    onHeartbeat ? "HB1" : "HB0",
    onSchedule ? "S1" : "S0",
    onMotionChange ? "M1" : "M0",
    onActivityChange ? "A1" : "A0",
    onProviderChange ? "P1" : "P0",
    onConnectivityChange ? "C1" : "C0",
    onEnabledChange ? "E1" : "E0",
  ].join("-");
  if (handlersSignature === sig && subscriptions.length) {
    return;
  }

  clearBackgroundGeolocationEventHandlers();

  if (onLocation) {
    subscriptions.push(
      BackgroundGeolocation.onLocation(onLocation, onLocationError),
    );
  }

  if (onGeofence) {
    subscriptions.push(BackgroundGeolocation.onGeofence(onGeofence));
  }
  if (onHttp) {
    subscriptions.push(BackgroundGeolocation.onHttp(onHttp));
  }

  if (onHeartbeat) {
    if (typeof BackgroundGeolocation.onHeartbeat === "function") {
      subscriptions.push(BackgroundGeolocation.onHeartbeat(onHeartbeat));
    } else {
      bgGeoLogger.warn("BackgroundGeolocation.onHeartbeat is not available");
    }
  }

  if (onSchedule) {
    if (typeof BackgroundGeolocation.onSchedule === "function") {
      subscriptions.push(BackgroundGeolocation.onSchedule(onSchedule));
    } else {
      bgGeoLogger.warn("BackgroundGeolocation.onSchedule is not available");
    }
  }
  if (onMotionChange) {
    subscriptions.push(BackgroundGeolocation.onMotionChange(onMotionChange));
  }
  if (onActivityChange) {
    subscriptions.push(
      BackgroundGeolocation.onActivityChange(onActivityChange),
    );
  }
  if (onProviderChange) {
    subscriptions.push(
      BackgroundGeolocation.onProviderChange(onProviderChange),
    );
  }
  if (onConnectivityChange) {
    subscriptions.push(
      BackgroundGeolocation.onConnectivityChange(onConnectivityChange),
    );
  }
  if (onEnabledChange) {
    subscriptions.push(BackgroundGeolocation.onEnabledChange(onEnabledChange));
  }

  handlersSignature = sig;
}

export async function stopBackgroundGeolocation() {
  await ensureBackgroundGeolocationReady();
  return BackgroundGeolocation.stop();
}

export async function startBackgroundGeolocation() {
  await ensureBackgroundGeolocationReady();
  return BackgroundGeolocation.start();
}
