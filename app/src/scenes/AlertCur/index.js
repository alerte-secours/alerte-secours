import React from "react";

import Empty from "./Empty";
import Tabs from "./Tabs";

import { useAlertState } from "~/stores";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES, UI_SCOPES } from "~/lib/logger/scopes";

const alertCurLogger = createLogger({
  module: FEATURE_SCOPES.ALERTS,
  feature: UI_SCOPES.SCENES,
});

export default React.memo(function AlertCur() {
  const { navAlertCur } = useAlertState(["navAlertCur"]);

  if (!navAlertCur) {
    return <Empty />;
  }
  // alertCurLogger.debug("Rendering AlertCur scene", { timestamp: new Date().toISOString() });

  return <Tabs />;
});
