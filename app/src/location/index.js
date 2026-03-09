import { Alert } from "react-native";
import * as Location from "expo-location";

import { getLocationState } from "~/stores";

import openSettings from "~/lib/native/openSettings";

import setLocationState from "./setLocationState";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function getCurrentLocation() {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // UI-only location must NOT depend on BGGeo.
      // Policy: pre-auth, BGGeo remains completely unused.

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Services de localisation désactivés",
          "Veuillez activer les services de localisation pour utiliser cette fonctionnalité.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Ouvrir les paramètres", onPress: openSettings },
          ],
        );
        return null;
      }

      const perm = await Location.getForegroundPermissionsAsync();
      let status = perm?.status;

      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req?.status;
      }

      if (status !== "granted") {
        Alert.alert(
          "Autorisation de localisation requise",
          "Veuillez accorder l'autorisation de localisation pour utiliser cette fonctionnalité.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Ouvrir les paramètres", onPress: openSettings },
          ],
        );
        return null;
      }

      // Add a lightweight timeout wrapper to avoid hanging UI.
      const TIMEOUT_MS = 30000;
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Location timeout")), TIMEOUT_MS),
      );

      const loc = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: false,
        }),
        timeout,
      ]);

      const coords = loc?.coords;
      if (coords) {
        setLocationState(coords);
        return coords;
      }

      return null;
    } catch (error) {
      console.log(
        `Erreur lors de l'obtention de la position actuelle (tentative ${
          retries + 1
        }/${MAX_RETRIES}):`,
        error,
      );
      retries++;
      if (retries < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  console.log(
    "Nombre maximal de tentatives atteint. Utilisation de la dernière position connue",
  );
  return getLocationState().coords || {};
}
