import { usePermissionsState, permissionsActions } from "~/stores";
import { useEffect } from "react";

import requestPermissionFcm from "./requestPermissionFcm";

export default function usePermissionFcm() {
  const { fcm } = usePermissionsState(["fcm"]);

  const { setFcm } = permissionsActions;

  useEffect(() => {
    if (fcm) {
      return;
    }
    (async () => {
      const granted = await requestPermissionFcm();
      setFcm(granted);
    })();
  }, [fcm, setFcm]);

  return { ready: fcm };
}
