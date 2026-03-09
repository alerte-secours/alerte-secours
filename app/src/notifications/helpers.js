import * as Sentry from "@sentry/react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidBadgeIconType,
  AndroidStyle,
} from "@notifee/react-native";
import { Platform } from "react-native";
import { smallIcon } from "./icons";

const log = (message, data = {}) => {
  console.log(`[Notifee] ${message}`, data);
};

export async function createChannel({ id, name, ...options }) {
  try {
    const isCreated = await notifee.isChannelCreated(id);
    if (isCreated) {
      log("Notification channel already created", { channelId: id });
      return;
    }

    await notifee.createChannel({
      id,
      name,
      badge: true,
      sound: "default",
      importance: AndroidImportance.HIGH,
      vibration: true,
      vibrationPattern: [300, 500],
      lights: true,
      bypassDnd: true,
      ...options,
    });
    log("Notification channel created", { channelId: id });
  } catch (error) {
    const errorData = {
      error: error.message,
      stack: error.stack,
    };
    log("Failed to create notification channel", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("channelId", id);
      scope.setExtra("errorDetails", errorData);
      Sentry.captureException(
        new Error("Failed to create notification channel"),
      );
    });
    throw error;
  }
}

export async function displayNotification({
  channelId,
  title,
  body,
  data,

  color,
  largeIcon,
  bigText,

  android = {},
  ios = {},
}) {
  const defaultAndroid = {
    channelId,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    badgeIconType: AndroidBadgeIconType.SMALL,
    smallIcon,
    style: {
      type: AndroidStyle.BIGTEXT,
      text: bigText,
    },
    pressAction: {
      launchActivity: "default",
    },
    autoCancel: false,
    largeIcon,
    color,
  };

  const defaultIos = {
    categoryId: channelId,
    threadId: channelId,
    foregroundPresentationOptions: {
      banner: true,
      list: true,
      badge: true,
      sound: true,
    },
    sound: "default",
    badgeCount: 1,
    critical: false,
    criticalVolume: 1.0,
    interruptionLevel: "critical",
  };

  if (Platform.OS === "ios") {
    await notifee.incrementBadgeCount();
  }

  await notifee.displayNotification({
    id: data.uid,
    title,
    body,
    data: {
      json: JSON.stringify(data),
    },
    android: {
      ...defaultAndroid,
      ...android,
    },
    ios: {
      ...defaultIos,
      ...ios,
    },
  });
}
