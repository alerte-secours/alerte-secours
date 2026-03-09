import { Platform } from "react-native";
import notifee from "@notifee/react-native";
import { createNotificationChannel as createAlertChannel } from "./channels/notifAlert";
import { createNotificationChannel as createAlertInfosChannel } from "./channels/notifAlertInfos";
import { createNotificationChannel as createSuggestCloseChannel } from "./channels/notifSuggestClose";
import { createNotificationChannel as createSuggestKeepOpenChannel } from "./channels/notifSuggestKeepOpen";
import { createNotificationChannel as createRelativeAllowAskChannel } from "./channels/notifRelativeAllowAsk";
import { createNotificationChannel as createRelativeInvitationChannel } from "./channels/notifRelativeInvitation";
import { createNotificationChannel as createSystemChannel } from "./channels/notifSystem";

export default async function setActionCategories() {
  // Create all notification channels
  try {
    await Promise.all([
      createAlertChannel(),
      createAlertInfosChannel(),
      createSuggestCloseChannel(),
      createSuggestKeepOpenChannel(),
      createRelativeAllowAskChannel(),
      createRelativeInvitationChannel(),
      createSystemChannel(),
    ]);
  } catch (error) {
    const errorData = {
      error: error.message,
      stack: error.stack,
    };
    console.log("[Notifee] Failed to create notification channels", errorData);
  }

  // https://notifee.app/react-native/docs/ios/interaction
  // if (Platform.OS !== "ios") {
  //   return;
  // }
  await notifee.setNotificationCategories([
    {
      id: "alert",
      actions: [
        {
          id: "open-alert",
          title: "Ouvrir",
          foreground: true,
        },
      ],
    },
    {
      id: "alert-infos",
      actions: [
        {
          id: "open-alert",
          title: "Détails de l'alerte",
          foreground: true,
        },
      ],
    },
    {
      id: "suggest-close",
      actions: [
        {
          id: "noop",
          title: "Garder ouverte",
        },
        {
          id: "close-alert",
          title: "Terminer",
        },
      ],
    },
    {
      id: "suggest-keep-open",
      actions: [
        {
          id: "keep-open-alert",
          title: "Garder ouverte",
        },
        {
          id: "close-alert",
          title: "Terminer",
        },
      ],
    },
    {
      id: "relative-allow-ask",
      actions: [
        {
          id: "open-relatives",
          title: "Ouvrir",
          foreground: true,
        },
        {
          id: "relative-allow-accept",
          title: "Accepter",
        },
        {
          id: "relative-allow-reject",
          title: "Refuser",
        },
      ],
    },
    {
      id: "relative-invitation",
      actions: [
        {
          id: "open-relatives",
          title: "Ouvrir",
          foreground: true,
        },
        {
          id: "relative-invitation-accept",
          title: "Accepter",
        },
        {
          id: "relative-invitation-reject",
          title: "Refuser",
        },
      ],
    },
    {
      id: "system",
      actions: [
        {
          id: "open-settings",
          title: "Paramètres",
          foreground: true,
        },
        {
          id: "open-background-geolocation-settings",
          title: "Paramètres",
          foreground: true,
        },
      ],
    },
  ]);
}
