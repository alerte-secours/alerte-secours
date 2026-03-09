import React, { useMemo, useRef, useEffect } from "react";
import { View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import ChatInput from "~/containers/ChatInput";
import { createStyles, useTheme } from "~/theme";
import MessagesFetcher from "~/containers/MessagesFetcher";
import Text from "~/components/Text";
import { useAlertState, navActions } from "~/stores";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import withConnectivity from "~/hoc/withConnectivity";

function Chat() {
  const styles = useStyles();
  const { navAlertCur } = useAlertState(["navAlertCur"]);
  const { alert } = navAlertCur;
  const { id: alertId } = alert;
  const data = useMemo(() => ({ alertId }), [alertId]);
  const scrollViewRef = useRef(null);
  const isFocused = useIsFocused();

  const { state } = alert;

  // Track when this view is focused/unfocused
  useEffect(() => {
    navActions.setMessageViewFocus(isFocused, alertId);

    // Cleanup when component unmounts
    return () => {
      if (isFocused) {
        navActions.setMessageViewFocus(false, null);
      }
    };
  }, [isFocused, alertId]);
  const isClosed = state === "closed";
  const isArchived = state === "archived";

  return (
    <View style={styles.container}>
      <View style={styles.chatMessages}>
        <MessagesFetcher
          data={data}
          scrollViewRef={scrollViewRef}
          isArchived={isArchived}
        />
      </View>
      {isClosed && (
        <View key="closed" style={styles.resolvedLabel}>
          <MaterialCommunityIcons
            name="information-outline"
            style={styles.resolvedLabelImage}
          />
          <Text style={styles.resolvedLabelText}>
            Cette alerte est terminée
          </Text>
        </View>
      )}
      {isArchived && (
        <View key="archived" style={styles.archivedLabel}>
          <MaterialCommunityIcons
            name="information-outline"
            style={styles.archivedLabelImage}
          />
          <Text style={styles.archivedLabelText}>
            Cette alerte est archivée
          </Text>
        </View>
      )}
      {!isArchived && (
        <View key="input" style={styles.chatInput}>
          <ChatInput data={data} scrollViewRef={scrollViewRef} />
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  container: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  chatMessages: {
    display: "flex",
    flex: 1,
  },
  chatInput: {
    display: "flex",
    height: 55,
    marginTop: 2,
    marginLeft: 2,
    marginRight: 2,
    marginBottom: 4,
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
}));

export default withConnectivity(Chat, {
  keepVisible: true,
});
