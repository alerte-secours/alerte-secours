import * as Sentry from "@sentry/react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidBadgeIconType,
  AndroidStyle,
} from "@notifee/react-native";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import { Light } from "~/theme/app";

import network from "~/network";

import { smallIcon } from "../icons";
import { createChannel, displayNotification } from "../helpers";
import { generateRelativeAllowAskContent } from "../content";

import { RELATIVE_QUERY } from "../gql";

const { colors } = Light;

const relativeAllowLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "relative-allow-channel",
});

const channelId = "relative-allow-ask";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Contacts d'urgence",
  });
}

export default async function notifRelativeAllowAsk(data) {
  if (!data?.relativeId) {
    throw new Error("No relativeId provided");
  }

  relativeAllowLogger.debug("Fetching relative data", {
    relativeId: data.relativeId,
  });
  const relativeResult = await network.apolloClient.query({
    query: RELATIVE_QUERY,
    variables: {
      relativeId: data.relativeId,
    },
  });
  const { data: relativeData } = relativeResult;

  if (!relativeData?.selectManyViewRelativePhoneNumber?.length) {
    relativeAllowLogger.warn("No relative data found or access denied", {
      relativeId: data.relativeId,
    });
    return;
  }

  const [{ onePhoneNumber }] = relativeData.selectManyViewRelativePhoneNumber;

  const { number } = onePhoneNumber || {};

  // Generate notification content
  const { title, body, bigText } = generateRelativeAllowAskContent({
    number,
  });

  await displayNotification({
    channelId,
    title,
    body,
    data: {
      ...data,
      phoneNumber: number,
    },
    color: colors.primary,
    bigText,
    android: {
      pressAction: {
        id: "open-relatives",
        launchActivity: "default",
      },
      actions: [
        {
          title: "Ouvrir",
          pressAction: {
            id: "open-relatives",
            launchActivity: "default",
          },
        },
        {
          title: "Accepter",
          pressAction: {
            id: "relative-allow-accept",
          },
        },
        {
          title: "Refuser",
          pressAction: {
            id: "relative-allow-reject",
          },
        },
      ],
    },
  });
}
