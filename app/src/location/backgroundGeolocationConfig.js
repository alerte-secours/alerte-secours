import { Platform } from "react-native";
import BackgroundGeolocation from "react-native-background-geolocation";
import env from "~/env";

const LOCATION_ACCURACY_GATE_M = 100;
const IS_ANDROID = Platform.OS === "android";
const IS_DEBUG_LOGGING = __DEV__ || env.IS_STAGING;

// Native filter to reduce GPS drift and suppress stationary jitter.
// This is the primary mechanism to prevent unwanted persisted/uploaded points while the device
// is not moving (works even when JS is suspended).
const DEFAULT_LOCATION_FILTER = {
  policy: BackgroundGeolocation.LocationFilterPolicy.Conservative,
  useKalman: true,
  kalmanProfile: BackgroundGeolocation.KalmanProfile.Conservative,
  trackingAccuracyThreshold: LOCATION_ACCURACY_GATE_M,
};

// Common config: keep always-on tracking enabled, but default to an IDLE low-power profile.
// High-accuracy and tighter distance thresholds are enabled only when an active alert is open.
//
// Expected behavior (both Android + iOS):
// - Foreground: locations recorded only after moving beyond `distanceFilter`.
// - Background: same rule; native service continues even if JS is suspended.
// - Terminated:
//   - Android: native service continues (`stopOnTerminate:false`); JS headless is NOT required.
//   - iOS: OS will relaunch app on significant movement / stationary-geofence exit.
//
// NOTE: We avoid creating persisted records from UI-only lookups (eg map refresh), since
// persisted records can trigger native HTTP uploads even while stationary.
//
// Product goals:
// - IDLE (no open alert): minimize battery; server updates are acceptable only on OS-level significant movement.
// - ACTIVE (open alert): first location should reach server within seconds, then continuous distance-based updates.
//
// Notes:
// - We keep config deterministic across launches to avoid stale persisted settings creating
//   unexpected periodic wakeups/uploads.
// - `maxRecordsToPersist: 1` matches product requirement (only latest geopoint).
export const BASE_GEOLOCATION_CONFIG = {
  reset: true,

  // Logger config
  logger: {
    // Logging can become large and also adds overhead.
    // Keep verbose logs to dev/staging.
    debug: IS_DEBUG_LOGGING,
    logLevel: IS_DEBUG_LOGGING
      ? BackgroundGeolocation.LogLevel.Verbose
      : BackgroundGeolocation.LogLevel.Error,
  },

  // Geolocation config
  geolocation: {
    // Default profile is IDLE.
    //
    // Important: `DesiredAccuracy.Low` (wifi/cell) can yield very large errors (km-level).
    // Those poor fixes can create false motion/geofence transitions on some Android devices,
    // resulting in periodic uploads while the user is stationary.
    //
    // We default to a GPS-capable accuracy but rely on motion + distance thresholds to
    // protect battery.
    desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.High,

    // Default to the IDLE profile behaviour.
    distanceFilter: 200,

    // Ensure deterministic behavior when switching profiles.
    // If we enable significant-changes mode in Android IDLE, we *must* explicitly
    // restore it to `false` in ACTIVE (and other modes) to avoid the SDK keeping a
    // previously-set `true` value.
    useSignificantChangesOnly: false,

    // Prevent dynamic distanceFilter shrink.
    // Elasticity can lower the effective threshold (eg while stationary), resulting in
    // unexpected frequent updates.
    disableElasticity: true,

    // Stop-detection.
    stopTimeout: 5,

    // True-stationary strategy: once stop-detection decides we're stationary, stop active
    // tracking and rely on the stationary geofence to detect significant movement.
    // This is intended to eliminate periodic stationary updates on Android.
    //
    // HOWEVER: On some Android devices, the stationary-geofence EXIT can be triggered by
    // extremely poor "trigger" fixes (eg hAcc=500m), causing false motion transitions and
    // periodic persisted uploads while the phone is actually stationary.
    //
    // Mitigation (Android IDLE): do NOT rely on stationary-geofence mode; instead rely on
    // distanceFilter + native filtering.
    stopOnStationary: IS_ANDROID ? false : true,
    stationaryRadius: 200,

    // Prevent identical/noise locations from being persisted.
    // This reduces DB churn and avoids triggering native HTTP uploads with redundant points.
    allowIdenticalLocations: false,

    // Native-side filter (see DEFAULT_LOCATION_FILTER above).
    filter: DEFAULT_LOCATION_FILTER,

    // Permission request strategy
    locationAuthorizationRequest: "Always",
  },

  // Application / lifecycle config
  app: {
    // Android Headless Mode
    // We do not require JS execution while terminated.  Native tracking + native HTTP upload
    // are sufficient for our needs (stopOnTerminate:false).
    enableHeadless: false,

    stopOnTerminate: false,
    startOnBoot: true,

    // Background scheduling
    // Disable heartbeats to avoid periodic background wakeups while stationary.
    heartbeatInterval: 0,

    // Android foreground service notification
    notification: {
      title: "Alerte Secours",
      text: "Suivi de localisation actif",
      channelName: "Location tracking",
      priority: BackgroundGeolocation.NotificationPriority.High,
    },

    // Android 10+ rationale dialog
    backgroundPermissionRationale: {
      title:
        "Autoriser Alerte-Secours à accéder à la localisation en arrière-plan",
      message:
        "Alerte-Secours nécessite la localisation en arrière-plan pour vous alerter en temps réel lorsqu'une personne à proximité a besoin d'aide urgente. Cette fonction est essentielle pour permettre une intervention rapide et efficace en cas d'urgence.",
      positiveAction: "Autoriser",
      negativeAction: "Désactiver",
    },
  },

  // HTTP config
  // IMPORTANT: Default to uploads disabled until we have an auth token.
  // Authenticated mode will set `http.url` + `Authorization` header and enable `autoSync`.
  http: {
    url: "",
    method: BackgroundGeolocation.HttpMethod.POST,
    rootProperty: "location",
    // Keep uploads simple: 1 location record -> 1 HTTP request.
    // (We intentionally keep only the latest record; batching provides no benefit.)
    autoSync: false,
    // Ensure no persisted config can keep batching/threshold behavior.
    batchSync: false,
    autoSyncThreshold: 0,
  },

  // Persistence config
  persistence: {
    // Product requirement: keep only the latest geopoint.
    maxRecordsToPersist: 1,

    // Behavior tweaks
    disableProviderChangeRecord: true,
  },
};

// Options we want to be stable across launches even when the plugin loads a persisted config.
// NOTE: We intentionally do *not* include HTTP auth headers here.
export const BASE_GEOLOCATION_INVARIANTS = {
  app: {
    enableHeadless: false,
    stopOnTerminate: false,
    startOnBoot: true,
    // Never allow background heartbeats by default (prevents time-based wakeups/uploads).
    heartbeatInterval: 0,
  },
  http: {
    method: BackgroundGeolocation.HttpMethod.POST,
    rootProperty: "location",
    autoSync: false,
    batchSync: false,
    autoSyncThreshold: 0,
  },
  persistence: {
    maxRecordsToPersist: 1,
    disableProviderChangeRecord: true,
  },
  // NOTE: `speedJumpFilter` was a legacy Config knob; it is not part of v5 shared types.
  // If we still want jump filtering, we'll need to implement a server-side filter or
  // re-introduce a supported SDK filter (eg `geolocation.filter`) when available.
};

export const TRACKING_PROFILES = {
  idle: {
    geolocation: {
      // IDLE runtime relies on the SDK's stop-detection + stationary geofence (stopOnStationary).
      // IMPORTANT: ACTIVE sets stopOnStationary:false.
      // Ensure we restore it when transitioning back to IDLE, otherwise the SDK may
      // continue recording while stationary.
      //
      // Android mitigation: disable stopOnStationary to avoid stationary-geofence EXIT loops.
      stopOnStationary: IS_ANDROID ? false : true,

      // Android IDLE: rely on OS-level significant movement only.
      // This avoids periodic wakeups/records due to poor fused-location fixes while the phone
      // is stationary (screen-off / locked scenarios).
      // However, this mode can also delay updates for many minutes ("several times / hour"),
      // resulting in missed updates after moving ~200-300m while backgrounded.
      // Product requirement prefers reliability of distance-based updates in IDLE.
      useSignificantChangesOnly: false,

      // QA helper: allow easier validation in dev/staging while keeping production at 200m.
      stationaryRadius: 200,
    },
    app: {
      // Never use heartbeat-driven updates; only movement-driven.
      heartbeatInterval: 0,
    },
    activity: {
      // Android-only: reduce false-positive motion triggers due to screen-on/unlock.
      // (This is ignored on iOS.)
      // 5 minutes was observed to be too aggressive and can prevent a moving transition during
      // normal short trips, leading to "moving but no updates".
      motionTriggerDelay: IS_ANDROID ? 60000 : 0,
    },

    // Android-only: require meaningful motion-activity transitions before engaging moving-state.
    // This helps avoid false positives while still allowing IDLE distance-based updates.
    // (Ignored on iOS.)
    triggerActivities: IS_ANDROID
      ? "in_vehicle,on_foot,waking,running,walking,cycling"
      : undefined,
  },
  active: {
    geolocation: {
      // ACTIVE target: frequent updates while moving.
      distanceFilter: 25,

      // ACTIVE must not use significant-changes-only (we want continuous distance-based updates).
      useSignificantChangesOnly: false,

      // While ACTIVE, do not stop updates simply because the device appears stationary.
      // Motion-detection + distanceFilter should govern updates.
      stopOnStationary: false,
    },
    app: {
      // Never use heartbeat-driven updates; only movement-driven.
      heartbeatInterval: 0,
    },
    activity: {
      // Android-only: do not delay motion triggers while ACTIVE.
      motionTriggerDelay: 0,
    },
  },
};
