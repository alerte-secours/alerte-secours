import React, { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import ChatMessages from "~/containers/ChatMessages";
import {
  useAggregatedMessagesState,
  aggregatedMessagesActions,
} from "~/stores";

const LiveMessagesFetcher = ({ scrollViewRef, alertId }) => {
  // Get messages from aggregated messages store
  const {
    messagesList,
    loading: storeLoading,
    error: storeError,
  } = useAggregatedMessagesState(
    (state) => {
      const { messagesList: fullMessageList, loading, error } = state;
      const messagesList = fullMessageList.filter(
        (message) => message.alertId === alertId,
      );
      return {
        messagesList,
        loading,
        error,
      };
    },
    [alertId],
  );

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
  }, [alertId, isFocused, messagesList]);

  return (
    <ChatMessages
      scrollViewRef={scrollViewRef}
      messages={messagesList || []}
      loading={storeLoading}
    />
  );
};

export default LiveMessagesFetcher;
