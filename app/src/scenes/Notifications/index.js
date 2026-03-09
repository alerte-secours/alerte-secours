import React, { useCallback, useState, useRef } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { createStyles, useTheme } from "~/theme";
import Loader from "~/components/Loader";
import { gql } from "@apollo/client";
import network from "~/network";
import {
  useSessionState,
  useNotificationsState,
  notificationsActions,
} from "~/stores";
import withConnectivity from "~/hoc/withConnectivity";
import NotificationItem from "./Item";

// This component displays the list of notifications
// It uses the notifications store to get the list of notifications
// and handles loading more notifications when the user scrolls to the bottom

export default withConnectivity(function Notifications() {
  const theme = useTheme();
  const styles = useNotificationsStyles();
  const { userId } = useSessionState(["userId"]);
  const {
    notificationsList: notifications,
    hasMoreNotifications,
    cursor,
    loading,
    error,
  } = useNotificationsState([
    "notificationsList",
    "hasMoreNotifications",
    "cursor",
    "loading",
    "error",
  ]);

  const [loadingMore, setLoadingMore] = useState(false);

  // Map to store all swipeable refs by notification ID
  const swipeableRefsMap = useRef(new Map());

  // Function to register a swipeable ref
  const registerSwipeableRef = useCallback((notificationId, ref) => {
    swipeableRefsMap.current.set(notificationId, ref);
  }, []);

  // Function to unregister a swipeable ref
  const unregisterSwipeableRef = useCallback((notificationId) => {
    swipeableRefsMap.current.delete(notificationId);
  }, []);

  // Function to close all other swipeables except the current one
  const closeOtherSwipeables = useCallback((currentNotificationId) => {
    swipeableRefsMap.current.forEach((ref, id) => {
      if (id !== currentNotificationId && ref.current) {
        ref.current.close();
      }
    });
  }, []);

  const loadMoreNotifications = useCallback(async () => {
    if (!hasMoreNotifications || loadingMore || !userId) return;

    setLoadingMore(true);

    try {
      // Make the GraphQL call directly to fetch older notifications
      const result = await network.apolloClient.query({
        query: gql`
          query loadMoreNotifications(
            $userId: Int!
            $limit: Int!
            $cursorId: Int
          ) {
            selectManyNotification(
              where: { userId: { _eq: $userId }, id: { _lt: $cursorId } }
              order_by: [{ acknowledged: asc }, { id: desc }]
              limit: $limit
            ) {
              id
              userId
              type
              message
              data
              acknowledged
              createdAt
            }
            selectAggNotification(
              where: { userId: { _eq: $userId }, id: { _lt: $cursorId } }
            ) {
              aggregate {
                count
              }
            }
          }
        `,
        variables: {
          userId,
          limit: 20,
          cursorId: cursor,
        },
      });

      if (result.data.selectManyNotification.length > 0) {
        // Get the last item for new cursor
        const lastItem =
          result.data.selectManyNotification[
            result.data.selectManyNotification.length - 1
          ];

        // Update store with the older notifications and new cursor
        notificationsActions.appendOlderNotifications(
          result.data.selectManyNotification,
          lastItem.id,
        );

        // Update hasMore flag
        const remainingCount =
          result.data.selectAggNotification?.aggregate?.count || 0;
        notificationsActions.setHasMoreNotifications(
          remainingCount > result.data.selectManyNotification.length,
        );
      } else {
        notificationsActions.setHasMoreNotifications(false);
      }
    } catch (error) {
      console.error("Error loading more notifications:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreNotifications, loadingMore, cursor, userId]);

  const renderFooter = () => {
    if (!hasMoreNotifications) return null;

    return (
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.loadMoreButton}
        onPress={loadMoreNotifications}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={styles.loadMoreText}>Charger plus de notifications</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !loadingMore) {
    return <Loader />;
  }
  return (
    <View style={styles.container}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              registerSwipeableRef={(ref) => registerSwipeableRef(item.id, ref)}
              unregisterSwipeableRef={() => unregisterSwipeableRef(item.id)}
              closeOtherSwipeables={() => closeOtherSwipeables(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
});

// Main component styles
const useNotificationsStyles = createStyles(({ theme }) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: 15,
  },
  loadMoreButton: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loadMoreText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
}));
