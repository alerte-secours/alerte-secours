import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Updates from "expo-updates";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import useNow from "~/hooks/useNow";
import * as Sentry from "@sentry/react-native";

import env from "~/env";
import { treeActions } from "~/stores";
import { checkStoreVersion, openStorePage } from "./storeVersionCheck";

const version = require("../../package.json").version;

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

const checkForStoreUpdate = async () => {
  if (env.LOCAL_DEV) {
    return { storeUpdateAvailable: false, storeVersion: null };
  }
  try {
    const lastCheckString = await AsyncStorage.getItem(
      STORAGE_KEYS.LAST_STORE_VERSION_CHECK_TIME,
    );
    const lastCheck = lastCheckString ? new Date(lastCheckString) : null;
    const nowDate = new Date();

    if (!lastCheck || nowDate - lastCheck > UPDATE_CHECK_INTERVAL) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_STORE_VERSION_CHECK_TIME,
        nowDate.toISOString(),
      );
      return await checkStoreVersion(version);
    }
    return { storeUpdateAvailable: false, storeVersion: null };
  } catch (_error) {
    return { storeUpdateAvailable: false, storeVersion: null };
  }
};

export async function checkStoreVersionManual() {
  return await checkStoreVersion(version);
}

export { openStorePage } from "./storeVersionCheck";

export function useUpdatesCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [storeUpdateAvailable, setStoreUpdateAvailable] = useState(false);
  const [storeVersion, setStoreVersion] = useState(null);
  const now = useNow();

  useEffect(() => {
    const updateAvailability = async () => {
      // Check store version first (higher priority)
      const storeResult = await checkForStoreUpdate();
      if (storeResult.storeUpdateAvailable) {
        setStoreUpdateAvailable(true);
        setStoreVersion(storeResult.storeVersion);
        return;
      }
      setStoreUpdateAvailable(false);
      setStoreVersion(null);

      // Then check OTA
      const isAvailable = await checkForUpdate();
      setUpdateAvailable(isAvailable);
    };
    updateAvailability();
  }, [now]); // trigger every minute

  return {
    updateAvailable,
    setUpdateAvailable,
    storeUpdateAvailable,
    setStoreUpdateAvailable,
    storeVersion,
  };
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

  const {
    updateAvailable,
    setUpdateAvailable,
    storeUpdateAvailable,
    setStoreUpdateAvailable,
  } = useUpdatesCheck();

  const showStoreAlert = useCallback(() => {
    Alert.alert(
      "Nouvelle version disponible",
      "Une nouvelle version de Alerte Secours est disponible sur le store. Veuillez mettre à jour l'application.",
      [
        {
          text: "Plus tard",
          onPress: () => setStoreUpdateAvailable(false),
        },
        { text: "Mettre à jour", onPress: () => openStorePage() },
      ],
    );
  }, [setStoreUpdateAvailable]);

  const showOtaAlert = useCallback(() => {
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
    // Store update takes priority over OTA
    if (storeUpdateAvailable) {
      showStoreAlert();
    } else if (updateAvailable) {
      showOtaAlert();
    }
  }, [showStoreAlert, showOtaAlert, storeUpdateAvailable, updateAvailable]);
}
