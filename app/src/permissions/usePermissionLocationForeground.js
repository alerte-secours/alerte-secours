import { useEffect } from "react";

import * as Location from "expo-location";

import { usePermissionsState, permissionsActions } from "~/stores";

import requestPermissionLocationForeground from "./requestPermissionLocationForeground";

export default function usePermissionLocationForeground() {
  const { setLocationForeground } = permissionsActions;
  const { locationForeground } = usePermissionsState(["locationForeground"]);

  useEffect(() => {
    if (locationForeground) {
      return;
    }
    (async () => {
      const granted = await requestPermissionLocationForeground();
      setLocationForeground(granted);
    })();
  }, [locationForeground, setLocationForeground]);

  return { ready: locationForeground };
}
