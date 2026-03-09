import { navActions } from "~/stores";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

const settingsLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "action-open-settings",
});

export default function actionOpenSettings({ data }) {
  settingsLogger.debug("actionOpenSettings called", {
    data,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
  });

  navActions.setNextNavigation([
    {
      name: "Params",
    },
  ]);

  settingsLogger.debug("Navigation set to Params screen", {
    navigationTarget: "Params",
  });
}
