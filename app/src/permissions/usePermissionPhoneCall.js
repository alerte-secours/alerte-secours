import { useEffect } from "react";

import { usePermissionsState, permissionsActions } from "~/stores";

import requestPermissionPhoneCall from "./requestPermissionPhoneCall";

export default function usePermissionPhoneCall() {
  const { setPhoneCall } = permissionsActions;
  const { phoneCall } = usePermissionsState(["phoneCall"]);

  useEffect(() => {
    if (phoneCall) {
      return;
    }
    (async () => {
      const granted = await requestPermissionPhoneCall();

      setPhoneCall(granted);
    })();
  }, [phoneCall, setPhoneCall]);

  return { ready: phoneCall };
}
