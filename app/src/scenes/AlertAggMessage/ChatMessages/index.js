import React, { useCallback, useEffect, useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { createStyles, useTheme } from "~/theme";
import { Button, TouchableRipple } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import humanizeDistance from "~/lib/geo/humanizeDistance";
import {
  alertActions,
  useAlertState,
  useAggregatedMessagesState,
  aggregatedMessagesActions,
} from "~/stores";
import {
  getVisibleIndexes,
  isScrollAtBottom,
} from "~/containers/ChatMessages/utils";

import Text from "~/components/Text";
import MessageRow from "~/containers/ChatMessages/MessageRow";
import MessageWelcome from "./MessageWelcome";

const AggregateMessages = React.memo(function AggregateMessages({
  scrollViewRef,
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Use the aggregated messages store instead of direct GraphQL query/subscription
  const { messagesList, loading, error } = useAggregatedMessagesState([
    "messagesList",
    "loading",
    "error",
  ]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused || !messagesList) {
      return;
    }
    aggregatedMessagesActions.markMultipleMessagesAsRead(
      messagesList
        .filter((message) => !message.isRead)
        .map((message) => message.id),
    );
  }, [isFocused, messagesList]);

  const list = useMemo(() => {
    if (loading) return [];
    if (error) return [];
    if (!messagesList || messagesList.length === 0) return [];

    return messagesList;
  }, [messagesList, loading, error]);

  const [messageLayouts, setMessageLayouts] = useState([]);
  const [layoutsReady, setLayoutsReady] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [lastViewedIndex, setLastViewedIndex] = useState(list.length - 1);

  // Reset layouts when messages change
  useEffect(() => {
    setMessageLayouts([]);
    setLayoutsReady(false);
  }, [messagesList]);

  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [scrollViewRef]);

  // Handle new messages and auto-scrolling
  useEffect(() => {
    if (list.length === 0) return;

    const lastMessage = list[list.length - 1];

    // Only scroll if it's a new message and we're at the bottom
    if (lastMessage.id !== lastMessageId) {
      setLastMessageId(lastMessage.id);
      if (isAtBottom) {
        scrollToBottom();
      }
    }
  }, [list, isAtBottom, scrollToBottom, lastMessageId]);

  const listLength = list.length;

  const onScroll = useCallback(
    ({ nativeEvent }) => {
      const wasAtBottom = isAtBottom;
      const nowAtBottom = isScrollAtBottom(nativeEvent);

      setIsAtBottom(nowAtBottom);

      if (!wasAtBottom && nowAtBottom) {
        setLastViewedIndex(list.length - 1);
        return;
      }

      if (!layoutsReady) return;

      const visibleIndexes = getVisibleIndexes(nativeEvent, messageLayouts);

      if (listLength === 0 || messageLayouts.length === 0) {
        return;
      }

      const maxVisibleIndex = Math.max(...visibleIndexes);
      if (maxVisibleIndex > lastViewedIndex) {
        setLastViewedIndex(maxVisibleIndex);
      }
    },
    [
      listLength,
      messageLayouts,
      list,
      layoutsReady,
      isAtBottom,
      lastViewedIndex,
    ],
  );

  const onContentSizeChange = useCallback(() => {
    if (isAtBottom && lastMessageId) {
      scrollToBottom();
    }
  }, [isAtBottom, scrollToBottom, lastMessageId]);

  const onMessageLayout = useCallback(
    (index, event) => {
      const { layout } = event.nativeEvent;
      setMessageLayouts((prev) => {
        const next = [...prev];
        next[index] = layout;
        if (next.filter(Boolean).length === listLength) {
          setLayoutsReady(true);
        }
        return next;
      });
    },
    [listLength],
  );

  const newMessagesCount = Math.max(0, list.length - 1 - lastViewedIndex);
  const hasNewMessages = newMessagesCount > 0 && !isAtBottom;
  const newMessagesPlural = newMessagesCount > 1;
  const newMessagesText = hasNewMessages
    ? `${newMessagesCount} nouveau${newMessagesPlural ? "x" : ""} message${
        newMessagesPlural ? "s" : ""
      }`
    : "";

  const { alertingList } = useAlertState(["alertingList"]);

  if (loading) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {hasNewMessages && (
        <View style={{ zIndex: 10 }}>
          <Button
            style={styles.newMessageButton}
            labelStyle={styles.newMessageButtonLabel}
            contentStyle={styles.newMessageButtonContent}
            icon={() => (
              <AntDesign name="arrowdown" size={14} color={colors.onPrimary} />
            )}
            onPress={scrollToBottom}
          >
            {newMessagesText}
          </Button>
        </View>
      )}
      <ScrollView
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ref={scrollViewRef}
      >
        <View style={styles.container}>
          <MessageWelcome />
          {list.map((row, index) => {
            const sameUserAsPrevious = row.userId === list[index - 1]?.userId;
            const distance = alertingList.find(
              ({ alertId }) => alertId === row.oneAlert.id,
            )?.alert.distance;
            const distanceText =
              typeof distance === "number" ? humanizeDistance(distance) : "";
            return (
              <MessageRow
                key={row.id}
                row={row}
                index={index}
                sameUserAsPrevious={sameUserAsPrevious}
                onLayout={(event) => onMessageLayout(index, event)}
                extraBottom={
                  <TouchableRipple
                    onPress={() => {
                      alertActions.setNavAlertCur({ alert: row.oneAlert });
                      navigation.navigate({
                        name: "AlertCur",
                        params: {
                          screen: "AlertCurTab",
                          params: {
                            screen: "AlertCurMessage",
                          },
                        },
                      });
                    }}
                  >
                    <View>
                      {distanceText && (
                        <Text style={styles.relatedAlertText}>
                          alerte initialement lancée à {distanceText}
                        </Text>
                      )}
                      <Text style={styles.relatedAlertText}>
                        #{row.oneAlert.code}
                      </Text>
                    </View>
                  </TouchableRipple>
                }
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
});

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  wrapper: {
    flex: 1,
  },
  container: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    width: "100%",
    paddingTop: 20,
    paddingBottom: 50,
    paddingHorizontal: 5,
  },
  newMessageButton: {
    position: "absolute",
    top: 0,
    width: "100%",
    backgroundColor: colors.blueLight,
    borderRadius: 0,
  },
  newMessageButtonContent: {
    // alignItems: "flex-start",
  },
  newMessageButtonLabel: {
    top: 0,
    marginVertical: 0,
    color: colors.surface,
  },
  relatedAlertText: {
    textAlign: "right",
    color: colors.primary,
  },
}));

// Set display name for better debugging
AggregateMessages.displayName = "AggregateMessages";

export default AggregateMessages;
