import * as Sentry from "@sentry/react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidBadgeIconType,
} from "@notifee/react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import { Light } from "~/theme/app";

import network from "~/network";

import { largeIcons, smallIcon } from "../icons";
import { createChannel, displayNotification } from "../helpers";
import { generateSuggestKeepOpenContent } from "../content";

import { ALERT_QUERY } from "../gql";

const { custom } = Light;

const suggestKeepOpenLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "suggest-keep-open-channel",
});

const channelId = "suggest-keep-open";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Alertes en cours",
  });
}

export default async function notifSuggestKeepOpen(data) {
  if (!data?.alertId) {
    throw new Error("No alertId provided");
  }

  suggestKeepOpenLogger.debug("Fetching alert data", { alertId: data.alertId });
  const alertResult = await network.apolloClient.query({
    query: ALERT_QUERY,
    variables: {
      alertId: data.alertId,
    },
  });
  const { data: alertData } = alertResult;

  if (!alertData.selectOneAlert) {
    suggestKeepOpenLogger.warn("No alert data found or access denied", {
      alertId: data.alertId,
    });
    return;
  }
  const { code, level } = alertData.selectOneAlert;

  const largeIcon = largeIcons[level];

  // Generate notification content
  const { title, body } = generateSuggestKeepOpenContent({
    code,
  });

  await displayNotification({
    channelId,
    title,
    body,
    data,
    largeIcon,
    color: custom.appColors[level],
    color: custom.appColors[level],
    android: {
      pressAction: {
        id: "open-alert",
        launchActivity: "default",
      },
      actions: [
        {
          title: "Garder ouverte",
          pressAction: {
            id: "keep-open-alert",
          },
        },
        {
          title: "Terminer",
          pressAction: {
            id: "close-alert",
          },
        },
      ],
    },
  });
}
