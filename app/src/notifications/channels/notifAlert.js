import * as Sentry from "@sentry/react-native";
import notifee, {
  AndroidImportance,
  AndroidStyle,
} from "@notifee/react-native";
import { Platform } from "react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import network from "~/network";
import { Light } from "~/theme/app";
import { largeIcons, smallIcon } from "../icons";
import { ALERTING_QUERY } from "../gql";
import { generateAlertContent } from "../content";

import { displayNotification, createChannel } from "../helpers";
import humanizeDistance from "~/lib/geo/humanizeDistance";

const { custom } = Light;

const alertLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "alert-channel",
});

const channelId = "alert";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Alertes",
  });
}

async function fetchAlertingData(alertingId) {
  try {
    alertLogger.debug("Fetching alerting data", { alertingId });
    const alertingResult = await network.apolloClient.query({
      query: ALERTING_QUERY,
      variables: { alertingId },
    });

    const { data: alertingData } = alertingResult;

    if (!alertingData?.selectOneAlerting) {
      throw new Error("No alerting data found or access denied");
    }

    alertLogger.debug("Alerting data fetched", {
      alertingId,
      code: alertingData.selectOneAlerting.oneAlert.code,
    });

    return alertingData.selectOneAlerting;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setExtra("alertingId", alertingId);
      scope.setExtra("errorDetails", {
        message: error.message,
        stack: error.stack,
      });
      scope.setTag("query", "ALERTING_QUERY");
      Sentry.captureException(new Error("Failed to fetch alerting data"));
    });
    throw new Error(`Failed to fetch alerting data: ${error.message}`);
  }
}

export default async function notifAlert(data) {
  if (!data?.alertingId) {
    throw new Error("No alertingId provided");
  }

  // Fetch alert data
  const alerting = await fetchAlertingData(data.alertingId);
  const { initialDistance, reason } = alerting;
  const { alertTag, code, level } = alerting.oneAlert;

  // Validate required data
  if (!level || !code) {
    throw new Error("Missing required alert data (level or code)");
  }

  // Prepare notification content
  const largeIcon = largeIcons[level];
  if (!largeIcon) {
    alertLogger.warn("Large icon not found for level", { level });
  }

  // Generate notification content
  const { title, body, bigText } = generateAlertContent({
    alertTag,
    code,
    level,
    initialDistance,
    reason,
  });

  await displayNotification({
    channelId,
    title,
    body,
    data,
    color: custom.appColors[level],
    largeIcon,
    bigText,
    android: {
      pressAction: {
        id: "open-alert",
        launchActivity: "default",
      },
      actions: [
        {
          title: "Ouvrir",
          pressAction: {
            id: "open-alert",
            launchActivity: "default",
          },
        },
      ],
    },
  });
}
