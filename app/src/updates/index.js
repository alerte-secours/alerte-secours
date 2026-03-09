import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Updates from "expo-updates";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import useNow from "~/hooks/useNow";
import * as Sentry from "@sentry/react-native";

import env from "~/env";
import { treeActions } from "~/stores";
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

const applyUpdate = async () => {
  treeActions.suspendTree();
  try {
    await Updates.fetchUpdateAsync();
    // await Updates.reloadAsync();
  } catch (error) {
    Sentry.captureException(error);
    console.log("Error applying update:", error);
    // await Updates.reloadAsync(); // https://github.com/expo/expo/issues/14359#issuecomment-1159558604
  }
};

const checkForUpdate = async () => {
  if (env.LOCAL_DEV) {
    return;
  }
  try {
    const lastCheckString = await AsyncStorage.getItem(
      STORAGE_KEYS.LAST_UPDATE_CHECK_TIME,
    );
    const lastCheck = lastCheckString ? new Date(lastCheckString) : null;
    const nowDate = new Date();

    if (!lastCheck || nowDate - lastCheck > UPDATE_CHECK_INTERVAL) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_UPDATE_CHECK_TIME,
        nowDate.toISOString(),
      );

      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        return false;
      }
      const remoteUpdate = update.manifest;
      const remoteCreatedAt = new Date(remoteUpdate.createdAt).getTime();
      // const currentCreatedAt = Updates.manifest.commitTime; // buggy commitTime
      const currentCreatedAt = env.BUILD_TIME;
      // console.log(
      //   "DEBUG_AS remoteUpdate",
      //   `${remoteCreatedAt} > ${currentCreatedAt}`,
      //   remoteCreatedAt > currentCreatedAt,
      // );
      // console.log("DEBUG_AS Updates.manifest", Updates.manifest);

      if (remoteCreatedAt > currentCreatedAt) {
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.log("Error checking for updates:", error);
  }
};

export function useUpdatesCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const now = useNow();

  useEffect(() => {
    const updateAvailability = async () => {
      const isAvailable = await checkForUpdate();
      setUpdateAvailable(isAvailable);
    };
    updateAvailability();
  }, [now]); // trigger every minute

  return { updateAvailable, setUpdateAvailable };
}

export function useUpdates() {
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      // Update has successfully downloaded; apply it now
      (async () => {
        await Updates.reloadAsync();
        treeActions.triggerReload();
      })();
    }
  }, [isUpdatePending]);

  const { updateAvailable, setUpdateAvailable } = useUpdatesCheck();

  const showAlert = useCallback(() => {
    Alert.alert(
      "Mise à jour disponible",
      "Une nouvelle mise à jour est disponible. Souhaitez vous l'appliquer ?",
      [
        {
          text: "Me rappeler plus tard",
          onPress: () => setUpdateAvailable(false),
        },
        { text: "Mettre à jour maintenant", onPress: applyUpdate },
      ],
    );
  }, [setUpdateAvailable]);

  useEffect(() => {
    if (updateAvailable) {
      showAlert();
    }
  }, [showAlert, updateAvailable]);
}

// export async function installUpdateIfAvailable() {
//   if (await checkForUpdate()) {
//     await applyUpdate();
//   }
// }
