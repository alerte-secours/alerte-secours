import { useEffect } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { networkActions } from "~/stores";
import { createLogger } from "~/lib/logger";
import { NETWORK_SCOPES } from "~/lib/logger/scopes";

const networkLogger = createLogger({
  module: NETWORK_SCOPES.HTTP,
  feature: "connectivity",
});

export default function useNetworkListener() {
  const { isConnected, type, isInternetReachable, details } = useNetInfo();

  useEffect(() => {
    // NetInfo's `isConnected` can be true while the network is not actually usable
    // (e.g. captive portal / no route / transient DNS). Prefer `isInternetReachable`
    // when it explicitly reports `false`, but keep "unknown" (null/undefined)
    // optimistic to avoid false-offline on some devices.
    const hasInternetConnection =
      Boolean(isConnected) && isInternetReachable !== false;

    networkLogger.info("Network connectivity changed", {
      isConnected,
      type,
      isInternetReachable,
      details,
      hasInternetConnection,
    });

    networkActions.setHasInternetConnection(hasInternetConnection);

    if (!hasInternetConnection) {
      networkLogger.warn("Network connection lost", {
        lastConnectionType: type,
        isConnected,
        isInternetReachable,
      });
    } else {
      networkLogger.debug("Network connection established", {
        connectionType: type,
        details,
      });
    }
  }, [isConnected, type, isInternetReachable, details]);
}
