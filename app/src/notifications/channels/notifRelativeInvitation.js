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
import { generateRelativeInvitationContent } from "../content";

import { RELATIVE_INVITATION_QUERY } from "../gql";

const { colors } = Light;

const relativeInvitationLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "relative-invitation-channel",
});

const channelId = "relative-invitation";

export async function createNotificationChannel() {
  await createChannel({
    id: channelId,
    name: "Invitation contact d'urgence",
  });
}

export default async function notifRelativeInvitation(data) {
  if (!data?.relativeInvitationId) {
    throw new Error("No relativeInvitationId provided");
  }

  relativeInvitationLogger.debug("Fetching relative invitation data", {
    relativeInvitationId: data.relativeInvitationId,
  });
  const relativeInvitationResult = await network.apolloClient.query({
    query: RELATIVE_INVITATION_QUERY,
    variables: {
      relativeInvitationId: data.relativeInvitationId,
    },
  });
  const { data: relativeData } = relativeInvitationResult;

  if (!relativeData?.selectOneRelativeInvitation?.oneUserPhoneNumberRelative) {
    relativeInvitationLogger.warn(
      "No relative invitation data found or access denied",
      {
        relativeInvitationId: data.relativeInvitationId,
      },
    );
    return;
  }

  const oneUserPhoneNumberRelative =
    relativeData.selectOneRelativeInvitation.oneUserPhoneNumberRelative;
  const { onePhoneNumber } = oneUserPhoneNumberRelative || {};
  const { number } = onePhoneNumber || {};

  // Generate notification content
  const { title, body, bigText } = generateRelativeInvitationContent({
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
            id: "relative-invitation-accept",
          },
        },
        {
          title: "Refuser",
          pressAction: {
            id: "relative-invitation-reject",
          },
        },
      ],
    },
  });
}
