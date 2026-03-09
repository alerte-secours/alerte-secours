import * as Sentry from "@sentry/react-native";
import notifee from "@notifee/react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";
import displayNotificationHandler from "./displayNotificationHandler";

const messageLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "messages",
});

export default async function onMessageReceived(message) {
  try {
    messageLogger.info("New message received", {
      messageId: message?.messageId,
      from: message?.from,
      type: message?.data ? "data" : "notification",
    });

    // Validate message structure
    if (!message) {
      throw new Error("Received empty message");
    }

    // Handle both data-only messages and notification messages with data payload
    if (!message.data?.json) {
      messageLogger.warn("Message missing data.json payload", { message });
      return;
    }

    let data;
    try {
      data = JSON.parse(message.data.json);
      if (!data.uid && message.data.uid) {
        data.uid = message.data.uid;
      }
    } catch (parseError) {
      throw new Error(`Failed to parse message data: ${parseError.message}`);
    }

    // Validate required data fields
    if (!data.action) {
      throw new Error("Message data missing required 'action' field");
    }

    messageLogger.debug("Processing message data", { data });

    await displayNotificationHandler(data).catch((error) => {
      throw new Error(`Failed to display notification: ${error.message}`);
    });

    messageLogger.info("Message processed successfully", {
      action: data.action,
      messageId: message.messageId,
    });
  } catch (error) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      messageId: message?.messageId,
    };
    messageLogger.error("Message processing failed", errorData);

    Sentry.withScope((scope) => {
      scope.setExtra("messageData", message);
      scope.setExtra("errorDetails", errorData);
      Sentry.captureException(error);
    });
  }
}
