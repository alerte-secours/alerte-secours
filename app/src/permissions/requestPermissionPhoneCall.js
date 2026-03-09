import { Platform } from "react-native";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const permissionLogger = createLogger({
  module: FEATURE_SCOPES.PERMISSIONS,
  feature: "phone-call",
});

export default async () => {
  try {
    if (Platform.OS === "android") {
      permissionLogger.info("Requesting phone call permission (Android)");
      const status = await request(PERMISSIONS.ANDROID.CALL_PHONE);
      const granted = status === RESULTS.GRANTED;

      permissionLogger.info("Phone call permission request result", {
        status,
        granted,
      });

      if (!granted) {
        permissionLogger.warn("Phone call permission denied", { status });
        return false;
      }
      return true;
    }

    permissionLogger.debug("Phone call permission not required (iOS)");
    return true;
  } catch (error) {
    permissionLogger.error("Failed to request phone call permission", {
      error: error.message,
      stack: error.stack,
      platform: Platform.OS,
    });
    return false;
  }
};
