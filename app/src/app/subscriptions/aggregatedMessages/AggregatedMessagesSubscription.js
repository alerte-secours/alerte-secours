import React, { useEffect, useRef } from "react";
import useStreamQueryWithSubscription from "~/hooks/useStreamQueryWithSubscription";
import { aggregatedMessagesActions } from "~/stores";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES, NETWORK_SCOPES } from "~/lib/logger/scopes";
import { AppState } from "react-native";

import {
  AGGREGATED_MESSAGES_QUERY,
  AGGREGATED_MESSAGES_SUBSCRIPTION,
} from "./gql";

const messagesLogger = createLogger({
  module: FEATURE_SCOPES.CHAT,
  feature: NETWORK_SCOPES.GRAPHQL,
});

const AggregatedMessagesSubscription = () => {
  // Ref to track if we've already run the cleanup
  const initRunRef = useRef(false);
  const lastForegroundCatchupAtRef = useRef(0);

  // Aggregated messages subscription
  const {
    data: messagesData,
    error: messagesError,
    loading,
    refetch,
  } = useStreamQueryWithSubscription(
    AGGREGATED_MESSAGES_QUERY,
    AGGREGATED_MESSAGES_SUBSCRIPTION,
    {
      cursorVar: "cursor",
      cursorKey: "id",
      uniqKey: "id",
      initialCursor: -1,
      subscriptionKey: "aggregated-messages",
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: false,
      // Chat is latency-sensitive; if the WS transport is up but this subscription
      // delivers nothing for a while, force a resubscribe.
      livenessStaleMs: 60_000,
      // If we detect staleness, first do a base refetch to catch-up, then resubscribe.
      refetchOnStale: true,
      refetchOnStaleCooldownMs: 60_000,

      // If WS reconnects, refetch base query once before resubscribing to reduce cursor gaps.
      refetchOnReconnect: true,
    },
  );

  // Foreground catch-up: on mobile, WS can take time to resume after background.
  // Do a lightweight refresh shortly after the app becomes active.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;

      const now = Date.now();
      // Avoid spamming refetches if the app toggles state quickly.
      if (now - lastForegroundCatchupAtRef.current < 15_000) return;
      lastForegroundCatchupAtRef.current = now;

      if (!refetch) return;
      try {
        messagesLogger.info(
          "Foreground catch-up: refetching aggregated messages",
        );
        Promise.resolve()
          .then(() => refetch())
          .catch((e) => {
            messagesLogger.warn("Foreground catch-up refetch failed", {
              error: e?.message,
            });
          });
      } catch (_e) {
        // ignore
      }
    });

    return () => sub.remove();
  }, [refetch]);

  // Update loading state
  useEffect(() => {
    aggregatedMessagesActions.setLoading(loading);
  }, [loading]);

  // Effect for messages data
  useEffect(() => {
    if (!messagesData) {
      return;
    }

    if (messagesData.selectManyMessage) {
      const messagesList = messagesData.selectManyMessage;
      aggregatedMessagesActions.debouncedUpdateMessagesList(messagesList);
      if (!initRunRef.current) {
        initRunRef.current = true;
        aggregatedMessagesActions.init(messagesList);
      }
    }
  }, [messagesData]);

  if (messagesError) {
    messagesLogger.error("Aggregated messages subscription error", {
      error: messagesError.message,
      stack: messagesError.stack,
    });
    aggregatedMessagesActions.setError(messagesError);
  }

  return null;
};

export default AggregatedMessagesSubscription;
