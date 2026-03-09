import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";
import messaging from "@react-native-firebase/messaging";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import { createLogger } from "~/lib/logger";
import { SYSTEM_SCOPES, FEATURE_SCOPES } from "~/lib/logger/scopes";

import {
  permissionsActions,
  usePermissionWizardState,
  useNetworkState,
  networkActions,
} from "~/stores";
import { secureStore } from "~/storage/memorySecureStore";
import memoryAsyncStorage from "~/storage/memoryAsyncStorage";

import requestPermissionLocationBackground from "~/permissions/requestPermissionLocationBackground";
import requestPermissionLocationForeground from "~/permissions/requestPermissionLocationForeground";
import requestPermissionMotion from "~/permissions/requestPermissionMotion";
import requestPermissionFcm from "~/permissions/requestPermissionFcm";
import requestPermissionPhoneCall from "~/permissions/requestPermissionPhoneCall";

import network from "~/network";

const lifecycleLogger = createLogger({
  module: SYSTEM_SCOPES.LIFECYCLE,
  feature: "app-state",
});

const permissionLogger = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "manager",
});

// Track permissions that were denied after being lost
const deniedReRequests = {
  fcm: false,
  phoneCall: false,
  locationForeground: false,
  locationBackground: false,
  motion: false,
};

// Track permissions that were previously granted
const previouslyGranted = {
  fcm: false,
  phoneCall: false,
  locationForeground: false,
  locationBackground: false,
  motion: false,
};

const checkPermissions = async (completed) => {
  permissionLogger.info("Checking app permissions");

  // Check phone call permission (Android only)
  if (Platform.OS === "android") {
    permissionLogger.debug("Checking phone call permission");
    const phoneCallStatus = await check(PERMISSIONS.ANDROID.CALL_PHONE);
    const phoneCallGranted = phoneCallStatus === RESULTS.GRANTED;
    permissionsActions.setPhoneCall(phoneCallGranted);

    // Handle phone call permission
    if (phoneCallGranted) {
      previouslyGranted.phoneCall = true;
      deniedReRequests.phoneCall = false;
      permissionLogger.debug("Phone call permission granted");
    } else if (previouslyGranted.phoneCall && !deniedReRequests.phoneCall) {
      permissionLogger.warn("Phone call permission lost, requesting again");
      const granted = await requestPermissionPhoneCall();
      if (!granted) {
        deniedReRequests.phoneCall = true;
        permissionLogger.warn("Phone call permission request denied");
      }
      permissionsActions.setPhoneCall(granted);
    }
  }

  // Check FCM/notification permission
  permissionLogger.debug("Checking FCM permission");
  const authStatus = await messaging().hasPermission();
  const notificationGranted =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  permissionsActions.setFcm(notificationGranted);

  // Handle FCM permission
  if (notificationGranted) {
    previouslyGranted.fcm = true;
    deniedReRequests.fcm = false;
    permissionLogger.debug("FCM permission granted");
  } else if (previouslyGranted.fcm && !deniedReRequests.fcm) {
    permissionLogger.warn("FCM permission lost, requesting again");
    const granted = await requestPermissionFcm();
    if (!granted) {
      deniedReRequests.fcm = true;
      permissionLogger.warn("FCM permission request denied");
    }
    permissionsActions.setFcm(granted);
  }

  // Check location permissions
  permissionLogger.debug("Checking location permissions");
  const { status: locationStatus } =
    await Location.getForegroundPermissionsAsync();
  const locationForegroundGranted = locationStatus === "granted";
  permissionsActions.setLocationForeground(locationForegroundGranted);

  // Handle foreground location permission
  if (locationForegroundGranted) {
    previouslyGranted.locationForeground = true;
    deniedReRequests.locationForeground = false;
    permissionLogger.debug("Foreground location permission granted");
  } else if (
    previouslyGranted.locationForeground &&
    !deniedReRequests.locationForeground
  ) {
    permissionLogger.warn(
      "Foreground location permission lost, requesting again",
    );
    const granted = await requestPermissionLocationForeground();
    if (!granted) {
      deniedReRequests.locationForeground = true;
      permissionLogger.warn("Foreground location permission request denied");
    }
    permissionsActions.setLocationForeground(granted);
  }

  const { status: locationBgStatus } =
    await Location.getBackgroundPermissionsAsync();
  const locationBackgroundGranted = locationBgStatus === "granted";
  permissionsActions.setLocationBackground(locationBackgroundGranted);

  // Handle background location permission
  if (locationBackgroundGranted) {
    previouslyGranted.locationBackground = true;
    deniedReRequests.locationBackground = false;
    permissionLogger.debug("Background location permission granted");
  } else if (
    previouslyGranted.locationBackground &&
    !deniedReRequests.locationBackground
  ) {
    permissionLogger.warn(
      "Background location permission lost, requesting again",
    );
    const granted = await requestPermissionLocationBackground();
    if (!granted) {
      deniedReRequests.locationBackground = true;
      permissionLogger.warn("Background location permission request denied");
    }
    permissionsActions.setLocationBackground(granted);
  }

  // Check motion permission
  permissionLogger.debug("Checking motion permission");
  const motionGranted = await requestPermissionMotion.checkPermission();
  permissionsActions.setMotion(motionGranted);

  // Handle motion permission
  if (motionGranted) {
    previouslyGranted.motion = true;
    deniedReRequests.motion = false;
    permissionLogger.debug("Motion permission granted");
  }

  permissionLogger.info("Permission check complete", {
    phoneCall: previouslyGranted.phoneCall,
    fcm: previouslyGranted.fcm,
    locationForeground: previouslyGranted.locationForeground,
    locationBackground: previouslyGranted.locationBackground,
    motion: previouslyGranted.motion,
  });
};

const AppLifecycleListener = () => {
  const appState = useRef(AppState.currentState);
  const activeTimeout = useRef(null);
  const lastActiveTimestamp = useRef(Date.now());
  const lastWsRestartAtRef = useRef(0);
  const MIN_WS_RESTART_INTERVAL_MS = 15_000;
  const { completed } = usePermissionWizardState(["completed"]);

  // Important: don't put rapidly-changing network state in the main effect deps,
  // otherwise we re-register the AppState listener and rerun the "initial permission check"
  // in a tight loop (causing freezes + log spam).
  const { hasInternetConnection, wsConnected, wsLastHeartbeatDate } =
    useNetworkState([
      "hasInternetConnection",
      "wsConnected",
      "wsLastHeartbeatDate",
    ]);
  const hasInternetConnectionRef = useRef(hasInternetConnection);
  const wsConnectedRef = useRef(wsConnected);
  const wsLastHeartbeatDateRef = useRef(wsLastHeartbeatDate);

  useEffect(() => {
    hasInternetConnectionRef.current = hasInternetConnection;
  }, [hasInternetConnection]);

  useEffect(() => {
    wsConnectedRef.current = wsConnected;
  }, [wsConnected]);

  useEffect(() => {
    wsLastHeartbeatDateRef.current = wsLastHeartbeatDate;
  }, [wsLastHeartbeatDate]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      lifecycleLogger.debug("App state changing", {
        from: appState.current,
        to: nextAppState,
        hasInternet: hasInternetConnectionRef.current,
      });

      if (!hasInternetConnectionRef.current) {
        lifecycleLogger.debug("Skipping state change handling - no internet");
        return;
      }

      if (appState.current === "active") {
        lastActiveTimestamp.current = Date.now();
      }

      if (
        nextAppState === "active" &&
        (appState.current === "background" || appState.current === "inactive")
      ) {
        const timeSinceLastActive = Date.now() - lastActiveTimestamp.current;
        clearTimeout(activeTimeout.current);

        // Permissions/sync are heavier; keep them for longer background durations.
        if (timeSinceLastActive > 10_000) {
          // First check permissions immediately
          lifecycleLogger.info(
            "App returned to foreground, checking permissions",
            {
              inactiveTime: timeSinceLastActive,
            },
          );
          checkPermissions(completed);

          // Sync memory stores back to persistent storage
          lifecycleLogger.info("Syncing memory stores to persistent storage");

          // Sync secure store
          secureStore.syncToSecureStore().catch((error) => {
            lifecycleLogger.error("Failed to sync memory secure store", {
              error: error.message,
            });
          });

          // Sync async storage
          memoryAsyncStorage.syncToAsyncStorage().catch((error) => {
            lifecycleLogger.error("Failed to sync memory async storage", {
              error: error.message,
            });
          });
        }

        // Always consider restarting WS on foreground (iOS can suspend sockets even for short durations).
        activeTimeout.current = setTimeout(() => {
          try {
            const now = Date.now();
            if (now - lastWsRestartAtRef.current < MIN_WS_RESTART_INTERVAL_MS) {
              return;
            }

            const hbMs = wsLastHeartbeatDateRef.current
              ? Date.parse(wsLastHeartbeatDateRef.current)
              : NaN;
            const heartbeatAgeMs = Number.isFinite(hbMs) ? now - hbMs : null;

            lifecycleLogger.info("Foreground WS check", {
              inactiveTime: timeSinceLastActive,
              wsConnected: wsConnectedRef.current,
              heartbeatAgeMs,
            });

            // Only restart the WS transport when it looks unhealthy.
            // Restarting while already connected causes unnecessary 4205 closes
            // and cascades into subscription teardown/resubscribe loops.
            const shouldRestart =
              !wsConnectedRef.current ||
              heartbeatAgeMs === null ||
              heartbeatAgeMs > 45_000 ||
              timeSinceLastActive > 30_000;

            if (!shouldRestart) {
              return;
            }

            lastWsRestartAtRef.current = now;
            lifecycleLogger.info("Restarting WebSocket connection");
            networkActions.WSRecoveryTouch();
            network.apolloClient.restartWS();
          } catch (error) {
            lifecycleLogger.error("Failed to restart WebSocket", { error });
          } finally {
            activeTimeout.current = null;
          }
        }, 1500);
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Initial permission check
    lifecycleLogger.info("Performing initial permission check");
    checkPermissions(completed);

    return () => {
      lifecycleLogger.debug("Cleaning up app state listener");
      subscription.remove();
      if (activeTimeout.current) {
        clearTimeout(activeTimeout.current);
        activeTimeout.current = null;
      }
    };
  }, [completed]);

  return null;
};

export default AppLifecycleListener;
