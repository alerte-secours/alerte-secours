import * as Sentry from "@sentry/react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";
import notifAlert from "./channels/notifAlert";
import notifAlertInfos from "./channels/notifAlertInfos";
import notifSuggestClose from "./channels/notifSuggestClose";
import notifSuggestKeepOpen from "./channels/notifSuggestKeepOpen";
import notifRelativeAllowAsk from "./channels/notifRelativeAllowAsk";
import notifRelativeInvitation from "./channels/notifRelativeInvitation";
import notifBackgroundGeolocationLost from "./channels/notifBackgroundGeolocationLost";
// import notifGeolocationHeartbeatSync from "./channels/notifGeolocationHeartbeatSync.js.bak";

const displayLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "display",
});

const SUPPORTED_ACTIONS = {
  alert: notifAlert,
  "alert-infos": notifAlertInfos,
  "suggest-close": notifSuggestClose,
  "suggest-keep-open": notifSuggestKeepOpen,
  "relative-allow-ask": notifRelativeAllowAsk,
  "relative-invitation": notifRelativeInvitation,
  "background-geolocation-lost": notifBackgroundGeolocationLost,
  // "geolocation-heartbeat-sync": notifGeolocationHeartbeatSync,
};

export default async function displayNotificationHandler(data) {
  try {
    if (!data) {
      throw new Error("No notification data provided");
    }

    const { action } = data;

    if (!action) {
      throw new Error("No action specified in notification data");
    }

    const handler = SUPPORTED_ACTIONS[action];
    if (!handler) {
      throw new Error(`Unsupported notification action: ${action}`);
    }

    displayLogger.info("Displaying notification", {
      action,
      alertingId: data.alertingId,
    });

    try {
      await handler(data);
    } catch (error) {
      throw new Error(`Handler failed for action ${action}: ${error.message}`);
    }

    displayLogger.info("Notification displayed successfully", {
      action,
      alertingId: data.alertingId,
    });
  } catch (error) {
    // Capture the error in a new variable so it’s available in inner scopes
    const err = error;

    const errorData = {
      error: err.message,
      stack: err.stack,
      data,
    };
    displayLogger.error("Failed to display notification", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("notificationData", data);
      scope.setExtra("errorDetails", errorData);
      scope.setTag("notification_action", data?.action || "unknown");
      Sentry.captureException(err);
    });

    throw error; // Re-throw to be caught by onMessageReceived
  }
}
