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
 * Ensure photo library / media images read permission.
 * On Android:
 *  - API >= 33: READ_MEDIA_IMAGES
 *  - API < 33: READ_EXTERNAL_STORAGE
 * On iOS: PHOTO_LIBRARY (LIMITED is accepted).
 */
export const ensurePhotoPermission = async () => {
  if (Platform.OS === "android") {
    // Coerce API level to number to avoid misclassification on some devices
    const apiLevel = Number(Platform.Version);
    const isApi33Plus = !Number.isNaN(apiLevel) && apiLevel >= 33;

    const primary = isApi33Plus
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    const secondary = isApi33Plus
      ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
      : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;

    // Try primary permission first
    const primaryGranted = await ensurePermission(primary, "à vos photos");
    if (primaryGranted) return true;

    // If primary failed and secondary is not explicitly blocked, try secondary as a fallback
    try {
      const statusSecondary = await check(secondary);
      if (statusSecondary !== RESULTS.BLOCKED) {
        const secondaryGranted = await ensurePermission(
          secondary,
          "à vos photos",
        );
        if (secondaryGranted) return true;
      }
    } catch (e) {
      // ignore and fall through
    }

    return false;
  }

  return ensurePermission(PERMISSIONS.IOS.PHOTO_LIBRARY, "à vos photos");
};

export default {
  ensureCameraPermission,
  ensurePhotoPermission,
};
