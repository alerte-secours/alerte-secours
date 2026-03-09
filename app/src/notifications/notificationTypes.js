import { VirtualNotificationTypes } from "./virtualNotifications";
import { getNotificationContent } from "./content";
import openSettings from "~/lib/native/openSettings";
import { navActions } from "~/stores";

export const getNotificationColor = (notification, theme) => {
  const { colors } = theme;
  return (
    theme.custom.appColors[
      notification.alertLevel || notification.data.level
    ] || colors.primary
  );
};

export const getNotificationTypeText = (notification) => {
  // Handle virtual notifications with a type-based mapping
  if (notification.isVirtual) {
    if (notification.type === VirtualNotificationTypes.REGISTER_RELATIVES) {
      return "Aucun contact d'urgence enregistré";
    }

    if (notification.type === VirtualNotificationTypes.UNREAD_ALERT_MESSAGES) {
      // No longer include code or subject in title
      return `Nouveaux messages`;
    }

    return notification.type;
  }

  if (!notification.data) {
    return notification.type;
  }

  try {
    const parsedData = JSON.parse(notification.data);
    return getNotificationContent(notification.type, parsedData).title;
  } catch (e) {
    console.error("Error parsing notification data:", e);
    return notification.type;
  }
};

export const getNotificationMessageText = (notification) => {
  // Simple cases first
  if (notification.isVirtual || notification.message) {
    return notification.message;
  }

  if (!notification.data) {
    return notification.type;
  }

  // Parse data for regular notifications
  try {
    const parsedData = JSON.parse(notification.data);
    return getNotificationContent(notification.type, parsedData).body;
  } catch (e) {
    console.error("Error parsing notification data:", e);
    return notification.type;
  }
};

export const createNotificationHandlers = (handlers) => {
  const { openAlert, openRelatives } = handlers;

  // Virtual notification handlers
  const virtualNotificationHandlers = {
    [VirtualNotificationTypes.REGISTER_RELATIVES]: async () =>
      await openRelatives({ data: {} }),
    [VirtualNotificationTypes.UNREAD_ALERT_MESSAGES]: async (notification) =>
      await openAlert({
        data: {
          alertId: notification.alertId,
        },
        tab: "AlertCurMessage",
      }),
  };

  // Regular notification handlers
  const regularNotificationHandlers = {
    alert: async (data) => await openAlert({ data }),
    alert_emergency_info: async (data) => await openAlert({ data }),
    suggest_close: async (data) => await openAlert({ data }),
    suggest_keep_open: async (data) => await openAlert({ data }),
    relative_invitation: async (data) => await openRelatives({ data }),
    relative_allow_ask: async (data) => await openRelatives({ data }),
    background_geolocation_lost: async (_data) => {
      navActions.setNextNavigation([
        {
          name: "Params",
          params: {
            anchor: "permissions",
          },
        },
      ]);
    },
  };

  return {
    virtualNotificationHandlers,
    regularNotificationHandlers,
  };
};
