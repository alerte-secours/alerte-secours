import {
  requestNotifications,
  request,
  PERMISSIONS,
  RESULTS,
} from "react-native-permissions";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const { AuthorizationStatus } = messaging;

const permissionLogger = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "notifications",
});

export default async () => {
  try {
    permissionLogger.info("Requesting FCM permissions", {
      platform: Platform.OS,
      osVersion: Platform.Version,
    });

    // Handle iOS permissions
    if (Platform.OS === "ios") {
      permissionLogger.debug("Registering for remote notifications (iOS)");
      await messaging().registerDeviceForRemoteMessages();

      // Request permission from iOS
      permissionLogger.debug("Requesting iOS notification permission");
      const authStatus = await messaging().requestPermission();
      const isGranted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      permissionLogger.info("iOS notification permission result", {
        status: authStatus,
        granted: isGranted,
        provisional: authStatus === AuthorizationStatus.PROVISIONAL,
      });

      return isGranted;
    }

    // Handle Android permissions
    permissionLogger.debug("Requesting Android notification permissions");
    const { status } = await requestNotifications(["alert", "sound", "badge"]);

    let postNotifications = RESULTS.UNAVAILABLE;
    if (Platform.Version >= 33) {
      permissionLogger.debug(
        "Requesting POST_NOTIFICATIONS permission (Android 13+)",
      );
      postNotifications = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    }

    // Determine grant state:
    // - Android 13+ requires POST_NOTIFICATIONS granted
    // - Below 13, POST_NOTIFICATIONS is unavailable; use requestNotifications result
    const isGranted =
      (Platform.Version >= 33 && postNotifications === RESULTS.GRANTED) ||
      (Platform.Version < 33 && status === RESULTS.GRANTED);

    permissionLogger.info("Android notification permission result", {
      notificationStatus: status,
      postNotificationsStatus: postNotifications,
      osVersion: Platform.Version,
      granted: isGranted,
    });

    return isGranted;
  } catch (error) {
    permissionLogger.error("Error requesting notification permissions", {
      error: error.message,
      stack: error.stack,
      platform: Platform.OS,
    });
    return false;
  }
};

// https://github.com/invertase/react-native-firebase/issues/6283
/*
from https://rnfirebase.io/messaging/usage :
The permissions API for iOS provides much more fine-grain control over permissions and how they're handled within your application. To learn more, view the advanced iOS Permissions documentation.
On Android, you do not need to request user permission. This method can still be called on Android devices; however, and will always resolve successfully.
*/
