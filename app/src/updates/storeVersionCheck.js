import { Platform, Linking } from "react-native";
import AppLink from "react-native-app-link";

const APP_STORE_BUNDLE_ID = "com.alertesecours.alertesecours";
const PLAY_STORE_ID = "com.alertesecours";
const APP_NAME = "alerte-secours";
const APP_STORE_LOCALE = "fr";
const FETCH_TIMEOUT = 8000;

let cachedAppStoreId = null;

export function compareVersions(current, store) {
  const currentParts = current.split(".").map(Number);
  const storeParts = store.split(".").map(Number);
  const len = Math.max(currentParts.length, storeParts.length);
  for (let i = 0; i < len; i++) {
    const c = currentParts[i] || 0;
    const s = storeParts[i] || 0;
    if (s > c) return true;
    if (s < c) return false;
  }
  return false;
}

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function checkIosVersion(currentVersion) {
  const url = `https://itunes.apple.com/lookup?bundleId=${APP_STORE_BUNDLE_ID}&country=${APP_STORE_LOCALE}`;
  const response = await fetchWithTimeout(url);
  const data = await response.json();
  if (data.resultCount > 0) {
    const result = data.results[0];
    const storeVersion = result.version;
    cachedAppStoreId = String(result.trackId);
    return {
      storeUpdateAvailable: compareVersions(currentVersion, storeVersion),
      storeVersion,
    };
  }
  return { storeUpdateAvailable: false, storeVersion: null };
}

async function checkAndroidVersion(currentVersion) {
  const url = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}&hl=${APP_STORE_LOCALE}`;
  const response = await fetchWithTimeout(url);
  const html = await response.text();

  // Try multiple regex patterns to extract version from Play Store HTML
  const patterns = [
    /\[\[\["(\d+\.\d+\.?\d*)"\]\]/,
    /Current Version.*?>([\d.]+)</,
    /versionName.*?>([\d.]+)</,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const storeVersion = match[1];
      return {
        storeUpdateAvailable: compareVersions(currentVersion, storeVersion),
        storeVersion,
      };
    }
  }

  return { storeUpdateAvailable: false, storeVersion: null };
}

export async function checkStoreVersion(currentVersion) {
  try {
    if (Platform.OS === "ios") {
      return await checkIosVersion(currentVersion);
    }
    if (Platform.OS === "android") {
      return await checkAndroidVersion(currentVersion);
    }
    return { storeUpdateAvailable: false, storeVersion: null };
  } catch (_error) {
    return { storeUpdateAvailable: false, storeVersion: null };
  }
}

export async function openStorePage() {
  try {
    await AppLink.openInStore({
      appName: APP_NAME,
      appStoreId: cachedAppStoreId || "",
      appStoreLocale: APP_STORE_LOCALE,
      playStoreId: PLAY_STORE_ID,
    });
  } catch (_error) {
    // Fallback to direct URL
    const url =
      Platform.OS === "ios"
        ? `https://apps.apple.com/${APP_STORE_LOCALE}/app/id${cachedAppStoreId}`
        : `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
    await Linking.openURL(url);
  }
}
