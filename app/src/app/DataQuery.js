import { useEffect } from "react";
import { useQuery } from "@apollo/client";

import { paramsActions, sessionActions, useSessionState } from "~/stores";

import { USER_QUERY } from "./gql";

export default function DataQuery() {
  const { deviceId } = useSessionState(["deviceId"]);

  const { data } = useQuery(USER_QUERY, {
    variables: { deviceId },
    skip: !deviceId,
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    const { radiusAll, radiusReach, preferredEmergencyCall } =
      data.selectOneDevice;
    sessionActions.loadUserPreference({
      radiusAll,
      radiusReach,
    });
    paramsActions.setPreferredEmergencyCall(preferredEmergencyCall);
  }, [data]);

  return null;
}
