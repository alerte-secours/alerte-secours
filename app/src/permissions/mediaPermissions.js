import { Alert, Platform } from "react-native";
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from "react-native-permissions";

/**
 * Show an alert inviting the user to open the OS settings when permission is blocked.
 */
const promptOpenSettings = (title, message) =>
  new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
      {
        text: "Ouvrir les réglages",
        onPress: () => {
          openSettings().catch(() => {});
          resolve(false);
        },
      },
    ]);
  });

/**
 * Generic helper to check/request a single permission and handle blocked state.
 */
const ensurePermission = async (permission, niceName) => {
  try {
    const status = await check(permission);

    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true;
    }

    if (status === RESULTS.BLOCKED) {
      await promptOpenSettings(
        `Permission ${niceName} requise`,
        `Veuillez autoriser l'accès ${niceName} dans les réglages de l'application.`,
      );
      return false;
    }

    const req = await request(permission);

    if (req === RESULTS.BLOCKED) {
      await promptOpenSettings(
        `Permission ${niceName} requise`,
        `Veuillez autoriser l'accès ${niceName} dans les réglages de l'application.`,
      );
      return false;
    }

    return req === RESULTS.GRANTED || req === RESULTS.LIMITED;
  } catch (e) {
    console.warn(`Failed to request ${niceName} permission`, e);
    return false;
  }
};

/**
 * Ensure camera permission.
 */
export const ensureCameraPermission = async () => {
  const perm =
    Platform.OS === "android"
      ? PERMISSIONS.ANDROID.CAMERA
      : PERMISSIONS.IOS.CAMERA;

  return ensurePermission(perm, "à la caméra");
};

/**
 * Ensure photo library access.
 * On Android: no permission needed — the gallery is opened through the system
 * picker (ACTION_GET_CONTENT), which grants access to the selected file only
 * (Play policy forbids READ_MEDIA_IMAGES when the system picker suffices).
 * On iOS: PHOTO_LIBRARY (LIMITED is accepted).
 */
export const ensurePhotoPermission = async () => {
  if (Platform.OS === "android") {
    return true;
  }

  return ensurePermission(PERMISSIONS.IOS.PHOTO_LIBRARY, "à vos photos");
};

export default {
  ensureCameraPermission,
  ensurePhotoPermission,
};
