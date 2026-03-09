import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";
import { Light } from "~/theme/app";
import { displayNotification } from "../helpers";
import { generateBackgroundGeolocationLostContent } from "../content";

const { colors } = Light;

const backgroundGeolocationLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "background-geolocation-channel",
});

const channelId = "system";

export default async function notifBackgroundGeolocationLost(data) {
  backgroundGeolocationLogger.debug(
    "Displaying background geolocation lost notification",
    {
      data,
    },
  );

  // DEBUG: Log notification configuration for diagnosis
  backgroundGeolocationLogger.info(
    "DEBUG: Background geolocation notification config",
    {
      channelId,
      pressActionId: "open-settings",
      launchActivity: "default",
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    },
  );

  // Generate notification content
  const { title, body, bigText } =
    generateBackgroundGeolocationLostContent(data);

  await displayNotification({
    channelId,
    title,
    body,
    data,
    color: colors.warning || colors.primary,
    bigText,
    android: {
      pressAction: {
        id: "open-background-geolocation-settings",
        launchActivity: "default",
      },
      actions: [
        {
          title: "Paramètres",
          pressAction: {
            id: "open-background-geolocation-settings",
            launchActivity: "default",
          },
        },
      ],
    },
  });

  backgroundGeolocationLogger.info(
    "Background geolocation lost notification displayed successfully",
  );
}
