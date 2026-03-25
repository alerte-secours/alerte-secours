import { useEffect } from "react";

import usePermissionLocationForeground from "~/permissions/usePermissionLocationForeground";

import { usePermissionsState, permissionsActions } from "~/stores";

import requestPermissionLocationBackgroundWithDisclosure from "./requestPermissionLocationBackgroundWithDisclosure";

export default function usePermissionLocationBackground() {
  usePermissionLocationForeground();
  const { setLocationBackground } = permissionsActions;
  const { locationForeground, locationBackground } = usePermissionsState([
    "locationForeground",
    "locationBackground",
  ]);

  useEffect(() => {
    if (locationBackground) {
      return;
    }
    if (!locationForeground) {
      return;
    }
    (async () => {
      const granted = await requestPermissionLocationBackgroundWithDisclosure();
      setLocationBackground(granted);
    })();
  }, [locationForeground, locationBackground, setLocationBackground]);

  return { ready: locationBackground };
}
