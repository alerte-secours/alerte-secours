import { useState, useEffect } from "react";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { Platform } from "react-native";

export const useEULA = () => {
  const [eulaAccepted, setEulaAccepted] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      setLoading(false);
      return;
    }

    const checkEULA = async () => {
      try {
        const accepted = await AsyncStorage.getItem(STORAGE_KEYS.EULA_ACCEPTED);
        setEulaAccepted(!!accepted);
      } catch (error) {
        console.error("Error checking EULA status:", error);
        setEulaAccepted(false);
      } finally {
        setLoading(false);
      }
    };

    checkEULA();
  }, []);

  const acceptEULA = () => {
    setEulaAccepted(true);
  };

  return {
    eulaAccepted,
    loading,
    acceptEULA,
  };
};
