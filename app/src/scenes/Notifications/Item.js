import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import actionOpenAlert from "~/notifications/actions/actionOpenAlert";
import actionOpenRelatives from "~/notifications/actions/actionOpenRelatives";
import network from "~/network";
import {
  Swipeable,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import { createStyles, useTheme } from "~/theme";
import { useMutation } from "@apollo/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Feather } from "@expo/vector-icons";
import { DELETE_NOTIFICATION, MARK_NOTIFICATION_AS_READ } from "./gql";
import {
  notificationsActions,
  getNotificationsState,
  aggregatedMessagesActions,
  getAggregatedMessagesState,
  paramsActions,
} from "~/stores";
import {
  getNotificationTypeText,
  getNotificationMessageText,
  getNotificationColor,
  createNotificationHandlers,
} from "~/notifications/notificationTypes";
import { getNotificationContent } from "~/notifications/content";
import { VirtualNotificationTypes } from "~/notifications/virtualNotifications";

const NotificationItem = ({
  notification,
  registerSwipeableRef,
  unregisterSwipeableRef,
  closeOtherSwipeables,
}) => {
  const theme = useTheme();
  const styles = useItemStyles();
  const swipeableRef = useRef(null);

  const [deleteNotification] = useMutation(DELETE_NOTIFICATION, {
    optimisticResponse: {
      deleteOneNotification: {
        __typename: "notification",
      },
    },
    update: (cache) => {
      // Remove the notification from all queries in the cache
      cache.modify({
        fields: {
          selectManyNotification: (
            existingNotifications = [],
            { readField },
          ) => {
            return existingNotifications.filter(
              (notificationRef) =>
                readField("id", notificationRef) !== notification.id,
            );
          },
        },
      });
    },
  });

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ, {
    optimisticResponse: {
      updateOneNotification: {
        __typename: "notification",
        id: notification.id,
        acknowledged: true,
      },
    },
    update: (cache, { data }) => {
      // Get the notification ID
      const notificationId = notification.id;

      // Update the notification in the cache by directly modifying the cached object
      cache.modify({
        id: cache.identify({
          __typename: "notification",
          id: notificationId,
        }),
        fields: {
          acknowledged: () => true,
        },
      });

      // Also update any lists containing this notification
      cache.modify({
        fields: {
          selectManyNotification: (
            existingNotifications = [],
            { readField },
          ) => {
            // Re-sort the notifications to match the expected order
            // (unacknowledged first, then by creation date)
            return [...existingNotifications].sort((a, b) => {
              const aAcknowledged =
                readField("id", a) === notificationId
                  ? true
                  : readField("acknowledged", a);
              const bAcknowledged =
                readField("id", b) === notificationId
                  ? true
                  : readField("acknowledged", b);

              // First sort by acknowledged status (unacknowledged first)
              if (aAcknowledged !== bAcknowledged) {
                return aAcknowledged ? 1 : -1;
              }

              // Then sort by id (higher/newer first)
              return readField("id", b) - readField("id", a);
            });
          },
        },
      });
    },
  });

  // Effect to register/unregister this swipeable reference
  useEffect(() => {
    // Register this swipeable ref when component mounts
    registerSwipeableRef(swipeableRef);

    // Unregister when component unmounts
    return () => {
      unregisterSwipeableRef();
    };
  }, [registerSwipeableRef, unregisterSwipeableRef]);

  // Function to handle long press - same effect as first swipe
  const handleLongPress = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE && swipeableRef.current) {
      // Close all other open swipeables
      closeOtherSwipeables();

      // Open the swipeable to show action buttons
      swipeableRef.current.openRight();
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy à HH:mm", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Determine style based on acknowledged status
  const itemStyle = [
    styles.notificationItem,
    notification.acknowledged
      ? styles.acknowledgedItem
      : styles.unacknowledgedItem,
  ];

  // Handle notification press based on notification type
  const handleNotificationPress = async () => {
    try {
      // Create notification handlers with the necessary actions
      const { virtualNotificationHandlers, regularNotificationHandlers } =
        createNotificationHandlers({
          openAlert: actionOpenAlert,
          openRelatives: actionOpenRelatives,
        });

      // Handle virtual notifications
      if (notification.isVirtual) {
        const handler = virtualNotificationHandlers[notification.type];
        if (handler) {
          await handler(notification);
          return;
        }
      }

      // Handle regular notifications
      if (!notification.data) return;

      try {
        const parsedData = JSON.parse(notification.data);
        const handler = regularNotificationHandlers[notification.type];

        if (handler) {
          await handler(parsedData);
        }

        // Mark as read after pressing
        if (!notification.acknowledged) {
          handleMarkAsRead();
        }
      } catch (e) {
        console.error("Error parsing notification data:", e);
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  };

  const performMarkAsRead = async () => {
    if (notification.acknowledged) return; // Skip if already acknowledged

    try {
      await markAsRead({
        variables: { notificationId: notification.id },
      });

      // Close the swipeable component after the action is complete
      if (swipeableRef.current) {
        swipeableRef.current.close();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      Alert.alert("Erreur", "Impossible de marquer la notification comme lue.");

      // Close the swipeable component even in case of error
      if (swipeableRef.current) {
        swipeableRef.current.close();
      }
    }
  };

  const performDelete = async () => {
    try {
      await deleteNotification({
        variables: { id: notification.id },
      });

      // Close the swipeable component after the action is complete
      if (swipeableRef.current) {
        swipeableRef.current.close();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Erreur", "Impossible de supprimer la notification.");

      // Close the swipeable component even in case of error
      if (swipeableRef.current) {
        swipeableRef.current.close();
      }
    }
  };

  const handleDelete = () => {
    try {
      if (notification.isVirtual) {
        // For virtual notifications, remove them from the local store
        if (notification.type === VirtualNotificationTypes.REGISTER_RELATIVES) {
          // Instead of filtering, set hasRegisteredRelatives to true
          // This will prevent the virtual notification from being added in the future
          paramsActions.setHasRegisteredRelatives(true);
        } else if (
          notification.type === VirtualNotificationTypes.UNREAD_ALERT_MESSAGES
        ) {
          // Get all messages from the aggregatedMessages store
          const { messagesList } = getAggregatedMessagesState();

          // Find all messages related to this alert that are unread
          const alertMessages = messagesList.filter(
            (message) =>
              message.oneAlert &&
              message.oneAlert.id === notification.alertId &&
              !message.isRead,
          );

          if (alertMessages.length > 0) {
            // Get all message IDs
            const messageIds = alertMessages.map((message) => message.id);

            // Add a new function to the aggregatedMessages store to handle this case
            aggregatedMessagesActions.markMultipleMessagesAsRead(messageIds);
          }
        }

        // Close the swipeable component
        if (swipeableRef.current) {
          swipeableRef.current.close();
        }
      } else {
        // For regular notifications, use the mutation
        performDelete();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Erreur", "Impossible de supprimer la notification.");
    }
  };

  const handleMarkAsRead = () => {
    try {
      performMarkAsRead();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      Alert.alert("Erreur", "Impossible de marquer la notification comme lue.");
    }
  };

  const renderRightActions = (progress, dragX) => {
    return (
      <View style={styles.actionsContainer}>
        <View style={styles.buttonsWrapper}>
          {/* Mark as Read button - only show if not acknowledged and not a virtual notification */}
          {!notification.acknowledged && !notification.isVirtual && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleMarkAsRead}
              style={[styles.actionButton]}
              activeOpacity={0.6}
            >
              <Feather
                name="check-circle"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Delete button */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleDelete}
            style={[
              styles.actionButton,
              // For virtual notifications, center the delete button vertically
              notification.isVirtual && { height: "100%" },
            ]}
            activeOpacity={0.6}
          >
            <Feather name="trash-2" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LongPressGestureHandler
      onHandlerStateChange={handleLongPress}
      minDurationMs={500}
    >
      <View>
        <Swipeable
          ref={swipeableRef}
          friction={1}
          rightThreshold={40}
          overshootRight={true}
          renderRightActions={renderRightActions}
          onSwipeableWillOpen={() => {
            // Close all other swipeables when this one opens
            closeOtherSwipeables();
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            style={itemStyle}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationType}>
                {getNotificationTypeText(notification)}
              </Text>
              {notification.acknowledged ? (
                <Text style={styles.acknowledgedBadge}>Vu</Text>
              ) : (
                <Text style={styles.unacknowledgedBadge}>Nouveau</Text>
              )}
            </View>
            <Text style={styles.notificationMessage}>
              {getNotificationMessageText(notification)}
            </Text>
            <View style={styles.notificationFooter}>
              <View style={styles.footerLeft}>
                {/* Display subject and alert code for virtual notifications */}
                {notification.isVirtual &&
                  notification.type ===
                    VirtualNotificationTypes.UNREAD_ALERT_MESSAGES && (
                    <View style={styles.alertInfoContainer}>
                      {notification.alertSubject && (
                        <Text style={styles.alertSubject}>
                          {notification.alertSubject.length > 30
                            ? notification.alertSubject.substring(0, 27) + "..."
                            : notification.alertSubject}
                        </Text>
                      )}
                      {notification.alertCode && (
                        <View style={styles.alertCodeContainer}>
                          {getNotificationColor(notification, theme) && (
                            <View
                              style={[
                                styles.colorDot,
                                {
                                  backgroundColor: getNotificationColor(
                                    notification,
                                    theme,
                                  ),
                                },
                              ]}
                            />
                          )}
                          <Text style={styles.alertCode}>
                            #{notification.alertCode}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                {/* Display alert code for non-virtual notifications */}
                {!notification.isVirtual &&
                  notification.data &&
                  (() => {
                    try {
                      const parsedData = JSON.parse(notification.data);
                      const content = getNotificationContent(
                        notification.type,
                        parsedData,
                      );

                      if (!content.code) return null;

                      return (
                        <View style={styles.alertCodeContainer}>
                          {getNotificationColor(
                            { ...notification, data: parsedData },
                            theme,
                          ) && (
                            <View
                              style={[
                                styles.colorDot,
                                {
                                  backgroundColor: getNotificationColor(
                                    { ...notification, data: parsedData },
                                    theme,
                                  ),
                                },
                              ]}
                            />
                          )}
                          <Text style={styles.alertCode}>#{content.code}</Text>
                        </View>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
              </View>

              <View style={styles.footerRight}>
                {notification.createdAt &&
                  !(
                    notification.isVirtual &&
                    notification.type ===
                      VirtualNotificationTypes.REGISTER_RELATIVES
                  ) && (
                    <Text style={styles.notificationDate}>
                      {formatDate(notification.createdAt)}
                    </Text>
                  )}
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    </LongPressGestureHandler>
  );
};

// Separate styles for the notification item
const useItemStyles = createStyles(({ theme }) => ({
  notificationItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10, // Keep this for spacing between cards
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  acknowledgedItem: {
    backgroundColor: theme.colors.surfaceVariant,
    borderLeftWidth: 0,
    opacity: 0.85,
  },
  unacknowledgedItem: {
    backgroundColor: theme.colors.surface,
    // Remove the left border as requested
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Changed from center to allow wrapping
    marginBottom: 8,
  },
  acknowledgedBadge: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
  },
  unacknowledgedBadge: {
    fontSize: 12,
    color: theme.colors.onPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    fontWeight: "500",
  },
  notificationMessage: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  notificationType: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1, // Allow the text to take available space
    flexWrap: "wrap", // Enable text wrapping
    marginRight: 8, // Add some space between the text and the badge
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  footerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  footerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  alertInfoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  alertSubject: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontWeight: "500",
    marginBottom: 4,
  },
  alertCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertCode: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: "500",
  },
  notificationDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: "right",
  },
  actionsContainer: {
    marginLeft: 4, // Add small gap for visual separation
    marginBottom: 10, // Match the card's marginBottom
    width: 60, // Keep fixed width for icon-only buttons
    alignSelf: "stretch", // Stretch to match the height of the card
  },
  buttonsWrapper: {
    flexDirection: "column",
    height: "100%", // Use full height
    justifyContent: "space-between", // Distribute buttons equally
    paddingVertical: 4, // Add some padding at top and bottom
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8, // Make all corners rounded
    padding: 0, // Remove padding
    height: "45%", // Take up almost half the available height
    width: "100%", // Use full width of container
  },
  markAsReadButton: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  deleteButton: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  swipeActiveButton: {
    backgroundColor: theme.custom.notifications.swipeActiveBackground,
  },
  deleteButtonSecondSwipe: {
    backgroundColor: theme.custom.notifications.deleteSwipeBackground,
  },
}));

export default NotificationItem;
