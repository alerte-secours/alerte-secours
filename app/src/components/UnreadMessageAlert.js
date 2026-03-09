import React, { useCallback, useEffect, useRef, useState } from "react";
import DropdownAlert, {
  DropdownAlertData,
  DropdownAlertType,
} from "react-native-dropdownalert";
import { createStyles, useTheme } from "~/theme";
import actionOpenAlert from "~/notifications/actions/actionOpenAlert";
import {
  useAggregatedMessagesState,
  useNavState,
  useAlertState,
  useSessionState,
} from "~/stores";
import AntDesign from "@expo/vector-icons/AntDesign";
import { View } from "react-native";
import IconByAlertLevel from "~/components/IconByAlertLevel";

const UnreadMessageAlert = () => {
  const { userId: sessionUserId } = useSessionState(["userId"]);

  const alertCallbackRef = useRef((_data) => new Promise((res) => res(_data)));
  const prevUnreadCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const theme = useTheme();
  const styles = useStyles();
  const [selected, setSelected] = useState(null);

  const renderCustomIcon = useCallback(() => {
    if (!selected) return null;
    const isVirtualFirstMessage = selected.data.isVirtualFirstMessage;

    const alert = selected.data.oneAlert;
    return (
      <View style={styles.iconContainer}>
        {isVirtualFirstMessage && (
          <IconByAlertLevel
            level={alert?.level}
            size={24}
            color={theme.colors.onPrimary}
          />
        )}
        {!isVirtualFirstMessage && (
          <AntDesign
            name={"message1"}
            size={24}
            color={theme.colors.onPrimary}
          />
        )}
      </View>
    );
  }, [selected, styles.iconContainer, theme.colors.onPrimary]);

  // Get state from stores
  const { unreadCount, messagesList, loading } = useAggregatedMessagesState([
    "unreadCount",
    "messagesList",
    "loading",
  ]);
  const { isOnMessageView, currentMessageAlertId } = useNavState([
    "isOnMessageView",
    "currentMessageAlertId",
  ]);
  const { navAlertCur } = useAlertState(["navAlertCur"]);

  // Effect to set isInitialLoad to false after the first data load
  useEffect(() => {
    if (!loading && messagesList.length > 0 && isInitialLoadRef.current) {
      // Set a small delay to ensure all data is processed
      const timer = setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    }
  }, [loading, messagesList]);

  useEffect(() => {
    // Skip alerts during initial load
    if (isInitialLoadRef.current) {
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    const isUserOnMessagesView = (messageAlertId) => {
      if (isOnMessageView && !currentMessageAlertId) {
        return true;
      }

      if (isOnMessageView && currentMessageAlertId === messageAlertId) {
        return true;
      }
      return false;
    };

    if (unreadCount <= prevUnreadCountRef.current) {
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    const unreadMessages = messagesList.filter((msg) => !msg.isRead);

    if (unreadMessages.length > 0) {
      // Sort by creation date (assuming there's a createdAt field)
      const sortedMessages = [...unreadMessages].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      const latestMessage = sortedMessages[0];
      const alertId = latestMessage.alertId || latestMessage.oneAlert?.id;

      if (isUserOnMessagesView(alertId)) {
        return;
      }
      const selectedData = {
        ...latestMessage,
        alertId,
      };
      if (latestMessage.isVirtualFirstMessage) {
        const isMine = latestMessage.oneAlert.userId === sessionUserId;
        if (isMine) {
          return;
        }
        setSelected({
          title: "Nouvelle alerte",
          message: "Vous avez reçu une nouvelle demande d'aide",
          data: selectedData,
        });
      } else {
        const isMine = latestMessage.userId === sessionUserId;
        if (isMine) {
          return;
        }
        const userName = latestMessage.username || "anonyme";
        const messageText = latestMessage.text || latestMessage.content || "";
        const messageContent = `${userName} : ${messageText}`;
        setSelected({
          title: "Nouveau message",
          message: messageContent,
          data: selectedData,
        });
      }
    }

    prevUnreadCountRef.current = unreadCount;
  }, [
    unreadCount,
    messagesList,
    isOnMessageView,
    currentMessageAlertId,
    navAlertCur,
    styles.alertContainer,
    styles.alertIcon,
    styles.alertMessage,
    styles.alertTitle,
    styles.virtualAlertContainer,
    theme.custom.appColors,
    sessionUserId,
  ]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    alertCallbackRef.current(selected);
  }, [selected]);

  return (
    <DropdownAlert
      alert={(func) => (alertCallbackRef.current = func)}
      alertPosition={isOnMessageView ? "top" : "bottom"}
      dismissInterval={5000}
      renderImage={renderCustomIcon}
      onDismissPressDisabled={false}
      onDismissPress={(data) => {
        console.log("Alert pressed", selected.data?.alertId);
        if (selected.data.alertId) {
          actionOpenAlert({
            data: { alertId: selected.data.alertId },
            tab: selected.data.isVirtualFirstMessage
              ? undefined
              : "AlertCurMessage",
          });
        }
      }}
      imageStyle={styles.alertIcon}
      alertViewStyle={{
        ...styles.alertContainer,

        backgroundColor: selected?.data?.isVirtualFirstMessage
          ? theme.custom.appColors[selected.data.oneAlert?.level]
          : theme.colors.primary,
      }}
    />
  );
};

// Create styles for the alert
const useStyles = createStyles(({ theme }) => ({
  alertContainer: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  alertIcon: {
    tintColor: theme.colors.onPrimary,
    width: 24,
    height: 24,
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
}));

export default UnreadMessageAlert;
