import { useEffect, useRef } from "react";
import messaging from "@react-native-firebase/messaging";
import * as Sentry from "@sentry/react-native";
import notifee from "@notifee/react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";
import {
  useSessionState,
  useFcmState,
  fcmActions,
  permissionsActions,
  useAuthState,
  usePermissionWizardState,
} from "~/stores";
import useMount from "~/hooks/useMount";
import setActionCategories from "./setActionCategories";
import onMessageReceived from "./onMessageReceived";
import { requestFcmPermission, setupFcm } from "./firebase";
import {
  requestNotifeePermission,
  bootstrap,
  setupNotifeeListeners,
} from "./notifee";
import { onNotificationOpenedAppEvent } from "./onEvent";

const notifLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  service: "fcm",
});

async function requestNotificationPermission() {
  // First request FCM permissions as it's required for token generation
  const fcmEnabled = await requestFcmPermission();
  if (!fcmEnabled) return false;

  // Then request Notifee permissions for enhanced notification features
  const notifeeEnabled = await requestNotifeePermission();
  if (!notifeeEnabled) return false;

  notifLogger.info("All permissions granted successfully");
  return true;
}

export function useFcm() {
  const { deviceId } = useSessionState(["deviceId"]);
  const { initialized: authInitialized } = useAuthState(["initialized"]);
  const { fcmToken } = useFcmState(["fcmToken"]);
  const { completed: wizardCompleted } = usePermissionWizardState([
    "completed",
  ]);

  const previousDeviceId = useRef(null);
  const notificationsInitialized = useRef(false);

  // Initialize notifications once
  useMount(() => {
    const initialize = async () => {
      if (notificationsInitialized.current) return;

      try {
        notifLogger.info("Initializing notifications");
        await setActionCategories();
        await fcmActions.init();
        notificationsInitialized.current = true;
        notifLogger.info("Initialization complete");
      } catch (error) {
        const errorData = { error: error.message, stack: error.stack };
        notifLogger.error("Initialization failed", errorData);

        Sentry.withScope((scope) => {
          scope.setExtra("errorDetails", errorData);
          Sentry.captureException(
            new Error("Failed to initialize notifications"),
          );
        });
      }
    };
    initialize();
  });

  // Handle FCM setup
  useEffect(() => {
    if (!authInitialized) {
      notifLogger.debug("Waiting for auth initialization");
      return;
    }

    if (!deviceId) {
      notifLogger.debug("No device ID available");
      return;
    }

    // Skip FCM setup if wizard is not completed
    if (!wizardCompleted) {
      notifLogger.debug("Waiting for permission wizard completion");
      return;
    }

    const deviceChanged = deviceId !== previousDeviceId.current;
    if (!deviceChanged && fcmToken) {
      notifLogger.debug("Device unchanged and token exists", { deviceId });
      return;
    }

    previousDeviceId.current = deviceId;

    const setup = async () => {
      notifLogger.info("Starting setup", {
        deviceId,
        deviceChanged,
      });

      try {
        // Check permissions
        notifLogger.info("Requesting permissions");
        const hasPermission = await requestNotificationPermission();

        if (hasPermission) {
          permissionsActions.setFcm(true);
          notifLogger.info("Permissions granted");

          // Force new token on device change
          const forceNew = deviceChanged;
          const success = await setupFcm({ deviceId, forceNew });
          if (!success) {
            notifLogger.error("FCM setup failed");
          }
        } else {
          notifLogger.warn("No permissions yet");
          permissionsActions.setFcm(false);
        }
      } catch (error) {
        const errorData = { error: error.message, stack: error.stack };
        notifLogger.error("Setup failed", errorData);

        Sentry.withScope((scope) => {
          scope.setExtra("errorDetails", errorData);
          scope.setExtra("deviceId", deviceId);
          scope.setExtra("deviceChanged", deviceChanged);
          Sentry.captureException(new Error("FCM setup failed"));
        });
      }
    };

    setup();
  }, [deviceId, authInitialized, fcmToken, wizardCompleted]);

  // Handle token refresh
  useMount(() => {
    const unsubscribe = messaging().onTokenRefresh((token) => {
      notifLogger.info("Token refreshed", { tokenLength: token.length });
      if (token) {
        fcmActions.setFcmToken(token);
      }
    });
    return unsubscribe;
  });

  // Handle messages
  useMount(() => {
    notifLogger.info("Setting up message handlers");

    // Configure background messaging
    messaging()
      .registerDeviceForRemoteMessages()
      .then(() => {
        notifLogger.info("Registered for remote messages");
        // Let Firebase Messaging handle APNS token automatically
        return messaging().getAPNSToken();
      })
      .then((token) => {
        if (token) {
          notifLogger.info("Got APNS token", { tokenLength: token.length });
        }
      })
      .catch((error) =>
        notifLogger.error("Failed to register for remote messages", {
          error: error.message,
        }),
      );

    // Handle foreground messages
    const unsubscribeForegroundMessage =
      messaging().onMessage(onMessageReceived);

    // Handle notification tap in background state
    const unsubscribeBackgroundTap = messaging().onNotificationOpenedApp(
      onNotificationOpenedAppEvent,
    );

    const unsubscribeForegroundEvent = setupNotifeeListeners();

    bootstrap();
    return () => {
      unsubscribeForegroundMessage && unsubscribeForegroundMessage();
      unsubscribeBackgroundTap && unsubscribeBackgroundTap();
      unsubscribeForegroundEvent && unsubscribeForegroundEvent();
    };
  });

  useMount(() => {
    notifee.setBadgeCount(0).then(() => {
      notifLogger.debug("Badge count reset");
    });
  });
}
