import React, { useEffect } from "react";
import { notificationsActions, useSessionState } from "~/stores";
import useLatestWithSubscription from "~/hooks/useLatestWithSubscription";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES, NETWORK_SCOPES } from "~/lib/logger/scopes";

import {
  LOAD_NOTIFICATIONS_QUERY,
  LOAD_NOTIFICATIONS_SUBSCRIPTION,
} from "./gql";

const notificationsLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: NETWORK_SCOPES.GRAPHQL,
});

const NotificationsSubscription = () => {
  const { userId } = useSessionState(["userId"]);
  const ITEMS_PER_PAGE = 20;

  // Set initial loading state
  useEffect(() => {
    if (userId) {
      notificationsActions.setLoading(true);
    }
  }, [userId]);

  // Notification query and subscription using useLatestWithSubscription
  // This handles DESC order for initial query and ASC order for subscription
  const {
    data: notificationsData,
    error: notificationError,
    loading,
  } = useLatestWithSubscription(
    LOAD_NOTIFICATIONS_QUERY,
    LOAD_NOTIFICATIONS_SUBSCRIPTION,
    {
      cursorVar: "cursor",
      cursorKey: "id",
      uniqKey: "id",
      variables: {
        userId,
        limit: ITEMS_PER_PAGE,
      },
      skip: !userId,
      fetchPolicy: "network-only",
      subscriptionKey: "notifications",
      shouldIncludeItem: (item) => {
        // Only include notifications for this user
        return item && item.userId === userId;
      },
    },
  );

  // Update loading state
  useEffect(() => {
    notificationsActions.setLoading(loading);
  }, [loading]);

  // Effect for notifications data processing
  useEffect(() => {
    if (!notificationsData) {
      return;
    }

    if (notificationsData.selectManyNotification) {
      // Update notifications list
      notificationsActions.updateNotificationsList(
        notificationsData.selectManyNotification,
      );

      // Set hasMore flag based on count
      const count =
        notificationsData.selectAggNotification?.aggregate?.count || 0;
      notificationsActions.setHasMoreNotifications(count > ITEMS_PER_PAGE);

      // Set cursor for pagination if we have notifications
      if (notificationsData.selectManyNotification.length > 0) {
        const lastItem =
          notificationsData.selectManyNotification[
            notificationsData.selectManyNotification.length - 1
          ];
        notificationsActions.setCursor(lastItem.id);
      }
    }
  }, [notificationsData]);

  if (notificationError) {
    notificationsLogger.error("Notification subscription error", {
      error: notificationError.message,
      stack: notificationError.stack,
    });
    notificationsActions.setError(notificationError);
  }

  return null;
};

export default NotificationsSubscription;
