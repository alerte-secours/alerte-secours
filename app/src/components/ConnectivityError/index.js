import React, { useCallback, useEffect } from "react";

import { useNetInfoInstance } from "@react-native-community/netinfo";
import { useNavigation } from "@react-navigation/native";

import { networkActions, useNetworkState } from "~/stores";

import { createStyles } from "~/theme";
import ConnectivityErrorExpanded from "./Expanded";
import ConnectivityErrorCompact from "./Compact";

export default function ConnectivityError({
  compact = false,
  containerProps = {},
}) {
  const styles = useStyles();
  const { hasInternetConnection } = useNetworkState(["hasInternetConnection"]);
  const {
    netInfo: { isConnected },
    refresh,
  } = useNetInfoInstance();

  const retryConnect = () => refresh();

  useEffect(() => {
    networkActions.setHasInternetConnection(isConnected);
  }, [isConnected]);

  const navigation = useNavigation();

  useEffect(() => {
    if (hasInternetConnection) {
      // networkActions.triggerReload();
    }
  }, [hasInternetConnection, navigation]);

  return (
    <>
      {compact && (
        <ConnectivityErrorCompact
          containerProps={containerProps}
          retryConnect={retryConnect}
        />
      )}

      {!compact && (
        <ConnectivityErrorExpanded
          containerProps={containerProps}
          retryConnect={retryConnect}
        />
      )}
    </>
  );
}

const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  icon: {
    paddingBottom: 15,
    color: colors.primary,
  },
  label: {
    textAlign: "center",
    fontSize: 15,
  },
}));
