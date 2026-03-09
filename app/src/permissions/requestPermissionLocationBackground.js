import * as Location from "expo-location";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const permissionLogger = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "location-background",
});

export default async () => {
  try {
    permissionLogger.info("Requesting background location permission");
    const { status } = await Location.requestBackgroundPermissionsAsync();

    if (status !== "granted") {
      permissionLogger.warn("Background location permission denied", {
        status,
      });
      return false;
    }

    permissionLogger.info("Background location permission granted");
    return true;
  } catch (error) {
    permissionLogger.error("Error requesting background location permission", {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};
