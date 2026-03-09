import { Platform } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import * as Sentry from "@sentry/react-native";
import kebabCase from "lodash.kebabcase";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import actionOpenAlert from "./actions/actionOpenAlert";
import actionCloseAlert from "./actions/actionCloseAlert";
import actionKeepOpenAlert from "./actions/actionKeepOpenAlert";

import actionOpenRelatives from "./actions/actionOpenRelatives";
import actionRelativeAllowAccept from "./actions/actionRelativeAllowAccept";
import actionRelativeAllowReject from "./actions/actionRelativeAllowReject";
import actionRelativeInvitationAccept from "./actions/actionRelativeInvitationAccept";
import actionRelativeInvitationReject from "./actions/actionRelativeInvitationReject";
import actionOpenSettings from "./actions/actionOpenSettings";
import actionOpenBackgroundGeolocationSettings from "./actions/actionOpenBackgroundGeolocationSettings";

import { navActions } from "~/stores";

export const onForegroundEvent = async (event) => {
  const { detail } = event;
  const { notification, pressAction } = detail;
  const { type } = event;

  eventLogger.info("Received foreground event", {
    type,
    notificationId: notification?.id,
    notificationData: notification?.data,
    pressAction,
    eventDetail: detail,
  });

  await onEvent({ notification, pressAction, type });
};

export const onBackgroundEvent = async (event) => {
  const { detail } = event;
  const { notification, pressAction } = detail;
  const { type } = event;

  eventLogger.info("Received background event", {
    type,
    notificationId: notification?.id,
    notificationData: notification?.data,
    pressAction,
    eventDetail: detail,
  });

  await onEvent({ notification, pressAction, type });
};

export const onBoostrapEvent = async (event) => {
  const { notification, pressAction, input: type } = event;

  eventLogger.info("Received bootstrap event", {
    type,
    notificationId: notification?.id,
    notificationData: notification?.data,
    pressAction,
    event,
  });

  await onEvent({ notification, pressAction, type });
};

const eventLogger = createLogger({
  module: BACKGROUND_SCOPES.NOTIFICATIONS,
  feature: "events",
});

const getPressActionIdFromAndroidClickAction = (clickAction) => {
  clickAction = clickAction.replace("com.alertesecours.", "");
  clickAction = kebabCase(clickAction);
  return clickAction;
};

const getPressActionId = (remoteMessage) => {
  let actionId;
  if (
    Platform.OS === "android" &&
    remoteMessage.notification?.android?.clickAction
  ) {
    actionId = getPressActionIdFromAndroidClickAction(
      remoteMessage.notification.android.clickAction,
    );
  }
  if (!actionId) {
    actionId = remoteMessage.data?.actionId;
  }
  return actionId;
};

export const onNotificationOpenedAppEvent = async (remoteMessage) => {
  // if (Platform.OS === "ios") {
  //   // deprecated in favor of foreground event
  //   return;
  // }
  try {
    eventLogger.debug("Processing background notification tap", {
      messageId: remoteMessage?.messageId,
      data: remoteMessage?.data,
      notification: remoteMessage?.notification,
      clickAction: remoteMessage?.notification?.android?.clickAction,
      notificationType: remoteMessage?.data?.type || "unknown",
    });

    if (!remoteMessage?.notification) {
      eventLogger.warn("No notification data in message");
      return;
    }

    const event = {
      notification: {
        id: remoteMessage.messageId,
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data || { json: "{}" },
      },
      pressAction: {
        id: getPressActionId(remoteMessage),
      },
      type: EventType.PRESS,
    };

    eventLogger.debug("Created event from remote message", { event });

    await onEvent(event);
    eventLogger.info("Background notification tap processed", {
      messageId: remoteMessage.messageId,
      event,
    });
  } catch (error) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      messageId: remoteMessage?.messageId,
      remoteMessage,
    };
    eventLogger.error(
      "Failed to process background notification tap",
      errorData,
    );

    Sentry.withScope((scope) => {
      scope.setExtra("messageData", remoteMessage);
      scope.setExtra("errorDetails", errorData);
      Sentry.captureException(
        new Error("Failed to process background notification tap"),
      );
    });
  }
};

export const onEvent = async ({ type, notification, pressAction }) => {
  eventLogger.debug("Starting event processing", {
    type,
    notificationId: notification?.id,
    notificationData: notification?.data,
    pressAction,
  });

  if (
    type === EventType.DISMISSED ||
    type === EventType.PRESS ||
    type === EventType.ACTION_PRESS
  ) {
    await notifee.cancelNotification(notification.id);
    if (Platform.OS === "ios") {
      if ((await notifee.getBadgeCount()) > 0) {
        await notifee.decrementBadgeCount();
      }
    }
  }

  if (type === EventType.DISMISSED) {
    eventLogger.info("User dismissed notification", {
      notificationId: notification.id,
      notificationData: notification.data,
    });
    return;
  }

  if (!(type === EventType.PRESS || type === EventType.ACTION_PRESS)) {
    eventLogger.debug("Ignoring event type", { type });
    return;
  }

  eventLogger.debug("Processing notification press", {
    type,
    notificationId: notification.id,
    notificationData: notification.data,
    pressAction,
  });

  let data;
  try {
    data = JSON.parse(notification.data.json);
    eventLogger.debug("Parsed notification data", { data });
  } catch (error) {
    eventLogger.error("Failed to parse notification data", {
      error: error.message,
      notificationData: notification.data,
    });
    return;
  }

  const actionId = pressAction.id;
  eventLogger.info("User pressed notification", {
    actionId,
    data,
    type,
    notificationId: notification.id,
  });

  if (data.expires && data.expires < Math.round(new Date() / 1000)) {
    if (pressAction.launchActivity === "default") {
      navActions.setNextNavigation([
        {
          name: "Expired",
        },
      ]);
    } else {
      await notifee.displayNotification({
        ...notification,
        title: "Expirée",
        body: notification.title + " expirée",
        android: {
          ...notification.android,
          actions: [
            {
              id: "noop",
              title: "Fermer",
            },
          ],
        },
      });
    }
    return;
  }

  switch (actionId) {
    case "noop": {
      break;
    }
    case "open-alert": {
      await actionOpenAlert({ data });
      break;
    }
    case "close-alert": {
      await actionCloseAlert({ data });
      break;
    }
    case "keep-open-alert": {
      await actionKeepOpenAlert({ data });
      break;
    }
    case "open-relatives": {
      await actionOpenRelatives({ data });
      break;
    }
    case "relative-allow-accept": {
      await actionRelativeAllowAccept({ data });
      break;
    }
    case "relative-allow-reject": {
      await actionRelativeAllowReject({ data });
      break;
    }
    case "relative-invitation-accept": {
      await actionRelativeInvitationAccept({ data });
      break;
    }
    case "relative-invitation-reject": {
      await actionRelativeInvitationReject({ data });
      break;
    }
    case "open-settings": {
      eventLogger.debug("Processing open-settings action", {
        data,
        actionId,
        notificationId: notification?.id,
        launchActivity: pressAction?.launchActivity,
      });
      await actionOpenSettings({ data });
      break;
    }
    case "open-background-geolocation-settings": {
      eventLogger.debug(
        "Processing open-background-geolocation-settings action",
        {
          data,
          actionId,
          notificationId: notification?.id,
          launchActivity: pressAction?.launchActivity,
        },
      );
      await actionOpenBackgroundGeolocationSettings({ data });
      break;
    }
  }
};
