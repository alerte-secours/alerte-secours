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

import { ALERT_QUERY } from "../gql";

import { largeIcons, smallIcon } from "../icons";
import { createChannel, displayNotification } from "../helpers";
import { generateSuggestCloseContent } from "../content";

const { custom } = Light;

const suggestCloseLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "suggest-close-channel",
});

const channelId = "suggest-close";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Alertes en cours",
  });
}

export default async function notifSuggestClose(data) {
  if (!data?.alertId) {
    throw new Error("No alertId provided");
  }

  suggestCloseLogger.debug("Fetching alert data", { alertId: data.alertId });
  const alertResult = await network.apolloClient.query({
    query: ALERT_QUERY,
    variables: {
      alertId: data.alertId,
    },
  });
  const { data: alertData } = alertResult;

  if (!alertData.selectOneAlert) {
    suggestCloseLogger.warn("No alert data found or access denied", {
      alertId: data.alertId,
    });
    return;
  }
  const { code, level } = alertData.selectOneAlert;

  const largeIcon = largeIcons[level];

  // Generate notification content
  const { title, body } = generateSuggestCloseContent({
    code,
  });

  await displayNotification({
    channelId,
    title,
    body,
    largeIcon,
    color: custom.appColors[level],
    data,
    data,
    android: {
      pressAction: {
        id: "open-alert",
        launchActivity: "default",
      },
      actions: [
        {
          title: "Garder ouverte",
          pressAction: {
            id: "noop",
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
