import React, { useMemo, useRef, useEffect } from "react";
import { View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { createStyles, useTheme } from "~/theme";
import ChatMessages from "./ChatMessages";
import { navActions } from "~/stores";

import withConnectivity from "~/hoc/withConnectivity";

export default withConnectivity(function AlertAggMessage() {
  const styles = useStyles();
  const scrollViewRef = useRef(null);
  const isFocused = useIsFocused();

  // Track when this view is focused/unfocused
  useEffect(() => {
    navActions.setMessageViewFocus(isFocused);

    return () => {
      if (isFocused) {
        navActions.setMessageViewFocus(false);
      }
    };
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <View style={styles.chatMessages}>
        <ChatMessages scrollViewRef={scrollViewRef} />
      </View>
    </View>
  );
});

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    flex: 1,
    flexDirection: "column",
    // alignItems: "center",
    // justifyContent: "center",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  chatMessages: {
    display: "flex",
    flex: 1,
    // backgroundColor: "green",
  },
  resolvedLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  resolvedLabelText: {
    fontSize: 15,
  },
  resolvedLabelImage: {
    paddingHorizontal: 5,
    fontSize: 15,
  },
  archivedLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  archivedLabelText: {
    fontSize: 15,
  },
  archivedLabelImage: {
    paddingHorizontal: 5,
    fontSize: 15,
  },
  // createdAt: {},
  // createdAtLabel: {},
  // io: {},
  // ioLabel: {},
  // alertLevel: {
  //   display: "flex",
  //   flex: 1,
  //   flexDirection: "row",
  //   alignItems: "center",
  // },
  // alertLevelLabel: { display: "flex" },
  // alertLevelIcon: { paddingRight: 5 },
}));
