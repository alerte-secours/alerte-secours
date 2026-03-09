import BackgroundGeolocation from "react-native-background-geolocation";

import { ensureBackgroundGeolocationReady } from "~/location/backgroundGeolocationService";
import { BASE_GEOLOCATION_CONFIG } from "~/location/backgroundGeolocationConfig";

/**
 * BGGeo diagnostics helpers.
 *
 * Intentionally lives outside UI code so we don't scatter direct BGGeo calls.
 *
 * NOTE: Calling these will execute `.ready()` (vendor requirement), but they do not start
 * tracking by themselves.
 */

export async function bggeoGetStatusSnapshot() {
  await ensureBackgroundGeolocationReady(BASE_GEOLOCATION_CONFIG);
  const [state, count] = await Promise.all([
    BackgroundGeolocation.getState(),
    BackgroundGeolocation.getCount(),
  ]);

  return {
    enabled: !!state?.enabled,
    isMoving: !!state?.isMoving,
    trackingMode: state?.trackingMode ?? null,
    schedulerEnabled: !!state?.schedulerEnabled,
    pending: count ?? null,
  };
}

export async function bggeoSyncNow() {
  await ensureBackgroundGeolocationReady(BASE_GEOLOCATION_CONFIG);
  const pendingBefore = await BackgroundGeolocation.getCount();
  const records = await BackgroundGeolocation.sync();
  const pendingAfter = await BackgroundGeolocation.getCount();

  return {
    pendingBefore: pendingBefore ?? null,
    synced: records?.length ?? 0,
    pendingAfter: pendingAfter ?? null,
  };
}

export async function bggeoGetDiagnosticsSnapshot() {
  await ensureBackgroundGeolocationReady(BASE_GEOLOCATION_CONFIG);

  const [state, count, locations] = await Promise.all([
    BackgroundGeolocation.getState(),
    BackgroundGeolocation.getCount(),
    BackgroundGeolocation.getLocations(),
  ]);

  const last =
    Array.isArray(locations) && locations.length
      ? locations[locations.length - 1]
      : null;

  return {
    state: {
      enabled: !!state?.enabled,
      isMoving: !!state?.isMoving,
      trackingMode: state?.trackingMode ?? null,
      schedulerEnabled: !!state?.schedulerEnabled,
    },
    pending: count ?? null,
    lastLocation: last
      ? {
          latitude: last?.coords?.latitude ?? null,
          longitude: last?.coords?.longitude ?? null,
          accuracy: last?.coords?.accuracy ?? null,
          timestamp: last?.timestamp ?? null,
        }
      : null,
  };
}
