import notifee from "@notifee/react-native";
import * as Sentry from "@sentry/react-native";
import { Platform } from "react-native";
import { onBoostrapEvent, onForegroundEvent } from "./onEvent";

const log = (message, data = {}) => {
  console.log(`[Notifee] ${message}`, data);
};

export async function requestNotifeePermission() {
  try {
    const settings = await notifee.requestPermission({
      alert: true,
      badge: true,
      sound: true,
      criticalAlert: true,
      provisional: true,
      announcement: true,
      carPlay: true,
    });

    if (!settings.authorizationStatus) {
      log("Permissions not granted", { settings });
      return false;
    }

    log("Permissions granted successfully", { settings });
    return true;
  } catch (error) {
    const errorData = {
      error: error.message,
      stack: error.stack,
    };
    log("Permission request failed", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("errorDetails", errorData);
      Sentry.captureException(
        new Error("Failed to request Notifee permissions"),
      );
    });
    return false;
  }
}

export async function bootstrap() {
  if (Platform.OS === "ios") {
    return;
  }
  const initialNotification = await notifee.getInitialNotification();
  if (initialNotification) {
    onBoostrapEvent(initialNotification);
  }
}

export function setupNotifeeListeners() {
  const unsubscribeForegroundEvent =
    notifee.onForegroundEvent(onForegroundEvent);
  return unsubscribeForegroundEvent;
}
