import { AccessibilityInfo } from "react-native";

export async function announceForA11y(message) {
  if (!message) return;

  // RN uses platform-specific announcers internally.
  // We keep this wrapper to centralize behavior and allow future throttling.
  AccessibilityInfo.announceForAccessibility(String(message));
}

export async function announceForA11yIfScreenReaderEnabled(message) {
  if (!message) return;

  const enabled = await AccessibilityInfo.isScreenReaderEnabled();
  if (!enabled) return;

  AccessibilityInfo.announceForAccessibility(String(message));
}
