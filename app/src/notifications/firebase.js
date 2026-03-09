import messaging from "@react-native-firebase/messaging";
import * as Sentry from "@sentry/react-native";
import { fcmActions } from "~/stores";
import { storeFcmToken } from "~/auth/actions";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

const fcmLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "firebase-messaging",
});

export async function requestFcmPermission() {
  try {
    const authStatus = await messaging().requestPermission({
      alert: true,
      announcement: true,
      badge: true,
      carPlay: true,
      provisional: true,
      sound: true,
    });

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      fcmLogger.warn("FCM permissions not granted", { authStatus });
      return false;
    }

    fcmLogger.info("FCM permissions granted", { authStatus });
    return true;
  } catch (error) {
    const errorData = {
      error: error.message,
      stack: error.stack,
    };
    fcmLogger.error("Permission request failed", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("errorDetails", errorData);
      Sentry.captureException(new Error("Failed to request FCM permissions"));
    });
    return false;
  }
}

export async function deleteFcmToken() {
  try {
    await messaging().deleteToken();
    fcmLogger.info("Token deleted successfully");
    return true;
  } catch (error) {
    const errorData = { error: error.message, stack: error.stack };
    fcmLogger.error("Token deletion failed", errorData);
    return false;
  }
}

export async function getFcmToken(forceNew = false) {
  try {
    fcmLogger.debug("Registering for remote messages");
    await messaging().registerDeviceForRemoteMessages();

    if (forceNew) {
      fcmLogger.debug("Deleting existing token");
      await deleteFcmToken();
    }

    fcmLogger.debug("Getting FCM token");
    const token = await messaging().getToken();

    if (token) {
      fcmLogger.info("Token obtained", {
        length: token.length,
        isNew: forceNew,
      });
    } else {
      fcmLogger.warn("No token received");
    }

    return token || null;
  } catch (error) {
    const errorData = { error: error.message, stack: error.stack };
    fcmLogger.error("Failed to get token", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("errorDetails", errorData);
      scope.setExtra("forceNew", forceNew);
      Sentry.captureException(new Error("Failed to get FCM token"));
    });
    return null;
  }
}

export async function setupFcm({ deviceId, forceNew = false }) {
  fcmLogger.info("Starting setup", { deviceId, forceNew });

  try {
    // Get token
    fcmLogger.debug(forceNew ? "Getting new token" : "Getting token");
    const token = await getFcmToken(forceNew);

    if (!token) return false;

    fcmLogger.debug("Setting token in store", {
      deviceId,
      tokenLength: token.length,
      isNew: forceNew,
    });
    fcmActions.setFcmToken(token);

    // Store token
    try {
      fcmLogger.debug("Storing token", { deviceId });
      const result = await storeFcmToken({ deviceId, fcmToken: token });

      if (result?.updatedAt) {
        fcmLogger.info("Token stored successfully", {
          deviceId,
          updatedAt: result.updatedAt,
        });
        fcmActions.setFcmTokenStored({
          fcmToken: token,
          deviceId,
        });
        return true;
      }
    } catch (error) {
      const errorData = { error: error.message, stack: error.stack };
      fcmLogger.error("Token storage failed", errorData);

      Sentry.withScope((scope) => {
        scope.setExtra("errorDetails", errorData);
        scope.setExtra("deviceId", deviceId);
        scope.setExtra("tokenLength", token?.length);
        Sentry.captureException(new Error("Failed to store FCM token"));
      });
    }
  } catch (error) {
    const errorData = { error: error.message, stack: error.stack };
    fcmLogger.error("Setup failed", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("errorDetails", errorData);
      scope.setExtra("deviceId", deviceId);
      scope.setExtra("forceNew", forceNew);
      Sentry.captureException(new Error("FCM setup failed"));
    });
  }

  return false;
}
