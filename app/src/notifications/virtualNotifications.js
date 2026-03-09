export const VirtualNotificationTypes = {
  REGISTER_RELATIVES: "REGISTER_RELATIVES",
  UNREAD_ALERT_MESSAGES: "UNREAD_ALERT_MESSAGES",
};

export const createRelativesVirtualNotification = () => ({
  id: "virtual-register-relatives",
  isVirtual: true,
  type: VirtualNotificationTypes.REGISTER_RELATIVES,
  message: "Enregistrez vos contacts d'urgence",
  acknowledged: false,
  createdAt: new Date().toISOString(),
});

export const createUnreadMessagesVirtualNotification = (alert) => ({
  id: `virtual-alert-${alert.alertId}`,
  isVirtual: true,
  type: VirtualNotificationTypes.UNREAD_ALERT_MESSAGES,
  alertId: alert.alertId,
  alertCode: alert.code,
  alertSubject: alert.subject,
  alertLevel: alert.level,
  unreadCount: alert.unreadCount,
  message: `${alert.unreadCount} message${
    alert.unreadCount > 1 ? "s" : ""
  } non lu${alert.unreadCount > 1 ? "s" : ""}`,
  acknowledged: false,
  createdAt: alert.lastMessageDate || new Date().toISOString(),
});

export const addVirtualNotifications = (notifications, params = {}) => {
  const { hasRegisteredRelatives, alertsWithUnreadMessages = [] } = params;

  // Create a copy of the notifications array to avoid modifying the original
  let notificationsWithVirtual = [...notifications];

  // Add virtual notification for emergency contacts if needed
  if (hasRegisteredRelatives === false) {
    // Check if the virtual notification already exists
    const virtualNotificationExists = notificationsWithVirtual.some(
      (notification) =>
        notification.isVirtual &&
        notification.type === VirtualNotificationTypes.REGISTER_RELATIVES,
    );

    // Only add if it doesn't exist already
    if (!virtualNotificationExists) {
      notificationsWithVirtual = [
        createRelativesVirtualNotification(),
        ...notificationsWithVirtual,
      ];
    }
  } else {
    // Remove the virtual notification if hasRegisteredRelatives is true
    notificationsWithVirtual = notificationsWithVirtual.filter(
      (notification) =>
        !(
          notification.isVirtual &&
          notification.type === VirtualNotificationTypes.REGISTER_RELATIVES
        ),
    );
  }

  // Add virtual notifications for alerts with unread messages
  alertsWithUnreadMessages.forEach((alert) => {
    // Check if the virtual notification for this alert already exists
    const alertVirtualNotificationExists = notificationsWithVirtual.some(
      (notification) =>
        notification.isVirtual &&
        notification.type === VirtualNotificationTypes.UNREAD_ALERT_MESSAGES &&
        notification.alertId === alert.alertId,
    );

    // Only add if it doesn't exist already
    if (!alertVirtualNotificationExists) {
      notificationsWithVirtual = [
        createUnreadMessagesVirtualNotification(alert),
        ...notificationsWithVirtual,
      ];
    }
  });

  return notificationsWithVirtual;
};

export const countUnacknowledged = (notifications) => {
  return notifications.filter((notification) => !notification.acknowledged)
    .length;
};

// export const countUnreadMessages = (alertsWithUnreadMessages) => {
//   return alertsWithUnreadMessages.reduce(
//     (total, alert) => total + alert.unreadCount,
//     0,
//   );
// };
