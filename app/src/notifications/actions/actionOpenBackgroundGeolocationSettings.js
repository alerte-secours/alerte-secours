import { navActions } from "~/stores";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

const backgroundGeolocationLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "action-open-background-geolocation-settings",
});

export default function actionOpenBackgroundGeolocationSettings({ data }) {
  backgroundGeolocationLogger.debug(
    "actionOpenBackgroundGeolocationSettings called",
  );

  navActions.setNextNavigation([
    {
      name: "Params",
      params: {
        anchor: "permissions",
      },
    },
  ]);
}
