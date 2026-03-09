import { secureStore } from "~/storage/memorySecureStore";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import uuidGenerator from "react-native-uuid";
import { createLogger } from "~/lib/logger";
import { FEATURE_SCOPES } from "~/lib/logger/scopes";

const deviceLogger = createLogger({
  module: FEATURE_SCOPES.AUTH,
  feature: "device-uuid",
});

// Mutex lock for atomic UUID generation
let uuidGenerationPromise = null;

async function getDeviceUuid() {
  // If a UUID generation is already in progress, wait for it
  if (uuidGenerationPromise) {
    deviceLogger.debug("UUID generation already in progress, waiting...");
    return await uuidGenerationPromise;
  }

  // Create a new promise for this generation attempt
  uuidGenerationPromise = (async () => {
    try {
      let deviceUuid = await secureStore.getItemAsync(STORAGE_KEYS.DEVICE_UUID);

      if (!deviceUuid) {
        deviceLogger.info("No device UUID found, generating new one");
        deviceUuid = uuidGenerator.v4();
        await secureStore.setItemAsync(STORAGE_KEYS.DEVICE_UUID, deviceUuid);
        deviceLogger.info("New device UUID generated and stored", {
          uuid: deviceUuid.substring(0, 8) + "...",
        });
      } else {
        deviceLogger.debug("Device UUID retrieved", {
          uuid: deviceUuid.substring(0, 8) + "...",
        });
      }

      return deviceUuid;
    } finally {
      // Clear the promise so future calls can proceed
      uuidGenerationPromise = null;
    }
  })();

  return await uuidGenerationPromise;
}

export { getDeviceUuid };
