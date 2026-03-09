import * as Location from "expo-location";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const permissionLogger = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "location-foreground",
});

export default async () => {
  try {
    permissionLogger.info("Requesting foreground location permission");
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      permissionLogger.warn("Foreground location permission denied", {
        status,
      });
      return false;
    }

    permissionLogger.info("Foreground location permission granted");
    return true;
  } catch (error) {
    permissionLogger.error("Error requesting foreground location permission", {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};
