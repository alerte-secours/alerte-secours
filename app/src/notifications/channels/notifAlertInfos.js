import * as Sentry from "@sentry/react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidBadgeIconType,
  AndroidStyle,
} from "@notifee/react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import network from "~/network";

import { Light } from "~/theme/app";

import { largeIcons, smallIcon } from "../icons";

import { ALERT_INFOS_QUERY } from "../gql";
import { displayNotification, createChannel } from "../helpers";
import { generateAlertEmergencyInfoContent } from "../content";

const { custom } = Light;

const alertInfoLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "alert-infos-channel",
});

const channelId = "alert-infos";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Alerte Infos",
  });
}

export default async function notifAlertInfos(data) {
  if (!data?.alertId) {
    throw new Error("No alertId provided");
  }

  alertInfoLogger.debug("Fetching alert info data", { alertId: data.alertId });
  const alertResult = await network.apolloClient.query({
    query: ALERT_INFOS_QUERY,
    variables: {
      alertId: data.alertId,
    },
  });
  const { data: alertData } = alertResult;

  if (!alertData.selectOneAlert) {
    alertInfoLogger.warn("No alert data found or access denied", {
      alertId: data.alertId,
    });
    return;
  }
  const { code, level, what3Words, address, nearestPlace } =
    alertData.selectOneAlert;

  const largeIcon = largeIcons[level];

  // Generate notification content
  const { title, body, bigText } = generateAlertEmergencyInfoContent({
    code,
    what3Words,
    address,
    nearestPlace,
  });

  // Display a notification
  await displayNotification({
    channelId,
    title,
    body,
    largeIcon,
    color: custom.appColors[level],
    bigText,
    data,
    data,
    android: {
      pressAction: {
        id: "open-alert",
      },
      actions: [
        {
          title: "Détails de l'alerte",
          pressAction: {
            id: "open-alert",
          },
        },
      ],
    },
  });
}
