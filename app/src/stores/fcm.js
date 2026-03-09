import { createAtom } from "~/lib/atomic-zustand";
import { secureStore } from "~/storage/memorySecureStore";
import { STORAGE_KEYS } from "~/storage/storageKeys";

export default createAtom(({ merge, reset }) => {
  const setFcmToken = (token) => {
    merge({
      fcmToken: token,
    });
  };

  const setFcmTokenStored = ({ fcmToken, deviceId }) => {
    secureStore.setItemAsync(STORAGE_KEYS.FCM_TOKEN_STORED, fcmToken);
    secureStore.setItemAsync(
      STORAGE_KEYS.FCM_TOKEN_STORED_DEVICE_ID,
      deviceId.toString(),
    );
    merge({
      fcmTokenStored: fcmToken,
      deviceId,
    });
  };

  const init = async () => {
    const fcmTokenStored = await secureStore.getItemAsync(
      STORAGE_KEYS.FCM_TOKEN_STORED,
    );
    const fcmTokenStoredDeviceId = await secureStore.getItemAsync(
      STORAGE_KEYS.FCM_TOKEN_STORED_DEVICE_ID,
    );
    const deviceId = fcmTokenStoredDeviceId
      ? parseInt(fcmTokenStoredDeviceId, 10)
      : null;
    merge({
      fcmTokenStored: fcmTokenStored || false,
      deviceId,
    });
  };

  return {
    default: {
      fcmToken: null,
      fcmTokenStored: null,
      deviceId: null,
    },
    actions: {
      init,
      reset,
      setFcmToken,
      setFcmTokenStored,
    },
  };
});
