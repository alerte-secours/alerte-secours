import { createAtom } from "~/lib/atomic-zustand";
import {
  addVirtualNotifications,
  countUnacknowledged,
} from "~/notifications/virtualNotifications";

export default createAtom(({ merge, set, get, reset, subscribe }) => {
  const getAlertsWithUnreadMessages = () => {
    const messagesList = get("aggregatedMessages", "messagesList");
    if (!messagesList || messagesList.length === 0) return [];

    const alertGroups = {};

    messagesList.forEach((message) => {
      if (!message.oneAlert) return;

      const alertId = message.oneAlert.id;
      if (!alertGroups[alertId]) {
        alertGroups[alertId] = {
          alertId,
          code: message.oneAlert.code,
          subject: message.oneAlert.subject || "Alerte",
          level: message.oneAlert.level || "ok",
          messages: [],
          lastMessageDate: null,
        };
      }

      if (!message.isRead) {
        alertGroups[alertId].messages.push(message);
      }

      const messageDate = new Date(message.createdAt);
      if (
        !alertGroups[alertId].lastMessageDate ||
        messageDate > new Date(alertGroups[alertId].lastMessageDate)
      ) {
        alertGroups[alertId].lastMessageDate = message.createdAt;
      }
    });

    return Object.values(alertGroups)
      .map((group) => ({
        ...group,
        unreadCount: group.messages.length,
      }))
      .filter((alert) => alert.unreadCount > 0);
  };

  const getComputedProps = (notifications) => {
    const hasRegisteredRelatives = get("params", "hasRegisteredRelatives");
    const alertsWithUnreadMessages = getAlertsWithUnreadMessages();

    const notificationsList = addVirtualNotifications(notifications, {
      hasRegisteredRelatives,
      alertsWithUnreadMessages,
    });

    const newCount = countUnacknowledged(notificationsList);

    return {
      newCount,
      notificationsList,
    };
  };

  const actions = {
    reset,
    updateNotificationsList: (notifications) => {
      const computedProps = getComputedProps(notifications);
      merge(computedProps);
    },
    appendOlderNotifications: (olderNotifications, newCursor) => {
      const { notificationsList } = get();

      const updatedList = [...notificationsList, ...olderNotifications];

      const realNotifications = updatedList.filter(
        (notification) => !notification.isVirtual,
      );

      const computedProps = getComputedProps(realNotifications);

      merge({
        cursor: newCursor,
        ...computedProps,
      });
    },
    setHasMoreNotifications: (hasMore) => {
      merge({
        hasMoreNotifications: hasMore,
      });
    },
    setCursor: (cursor) => {
      merge({
        cursor,
      });
    },
    setLoading: (loading) => {
      merge({
        loading,
      });
    },
    setError: (error) => {
      merge({
        error,
      });
    },
    computeProps: () => {
      const notificationsList = get("notificationsList");
      const realNotifications = notificationsList.filter(
        (notification) => !notification.isVirtual,
      );

      const computedProps = getComputedProps(realNotifications);

      merge(computedProps);
    },
  };

  subscribe(
    "aggregatedMessages",
    (state) => state.unreadCount,
    (newValue) => {
      console.log("Subscription triggered with new value:", newValue);
      // Recompute derived properties when unread count changes
      actions.computeProps();
    },
  );

  return {
    default: {
      newCount: 0,
      notificationsList: [],
      hasMoreNotifications: false,
      cursor: null,
      loading: false,
      error: null,
    },
    actions,
  };
});
