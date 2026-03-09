import { Platform } from "react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const permissionLogger = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "motion",
});

// Get the correct permission based on platform
const getPermissionType = () => {
  if (Platform.OS === "android") {
    return PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION;
  }
  // iOS doesn't require explicit motion/activity permission for background geolocation
  permissionLogger.debug("No explicit motion permission needed on iOS");
  return null;
};

// Check current permission status
const checkPermission = async () => {
  try {
    const permissionType = getPermissionType();
    if (!permissionType) {
      permissionLogger.debug("Motion permission check skipped (iOS)");
      return true;
    }

    permissionLogger.debug("Checking motion permission status", {
      permissionType,
      platform: Platform.OS,
    });

    const status = await check(permissionType);
    permissionLogger.info("Motion permission status", {
      status,
      granted: status === RESULTS.GRANTED,
    });

    return status === RESULTS.GRANTED;
  } catch (error) {
    permissionLogger.error("Failed to check motion permission", {
      error: error.message,
      stack: error.stack,
      platform: Platform.OS,
    });
    return false;
  }
};

// Request permission if not already granted
const requestPermission = async () => {
  try {
    const permissionType = getPermissionType();
    if (!permissionType) {
      permissionLogger.debug("Motion permission request skipped (iOS)");
      return true;
    }

    permissionLogger.info("Requesting motion permission", {
      permissionType,
      platform: Platform.OS,
    });

    const status = await request(permissionType);
    const granted = status === RESULTS.GRANTED;

    permissionLogger.info("Motion permission request result", {
      status,
      granted,
      platform: Platform.OS,
    });

    if (!granted) {
      permissionLogger.warn("Motion permission denied", { status });
    }

    return granted;
  } catch (error) {
    permissionLogger.error("Failed to request motion permission", {
      error: error.message,
      stack: error.stack,
      platform: Platform.OS,
    });
    return false;
  }
};

// Export as an object with named functions to prevent undefined function errors
const motionPermissions = {
  checkPermission,
  requestPermission,
};

export default motionPermissions;
