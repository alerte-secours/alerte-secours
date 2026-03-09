import { Platform, Linking, PermissionsAndroid } from "react-native";
import RNImmediatePhoneCall from "react-native-immediate-phone-call";

export async function phoneCallEmergency() {
  const emergencyNumber = "112";

  if (Platform.OS === "ios") {
    try {
      // Prefer telprompt on iOS for immediate prompt, fallback to tel
      await Linking.openURL(`telprompt:${emergencyNumber}`);
    } catch (err) {
      console.error("Error opening phone dialer (iOS telprompt):", err);
      try {
        await Linking.openURL(`tel:${emergencyNumber}`);
      } catch (err2) {
        console.error("Error opening phone dialer (iOS tel fallback):", err2);
      }
    }
    return;
  }

  // Android: request CALL_PHONE upfront and provide deterministic fallback
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      // Try immediate call, but arm a short fallback timer in case the OS/OEM ignores ACTION_CALL
      let fallbackTriggered = false;

      const triggerFallback = async () => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        try {
          await Linking.openURL(`tel:${emergencyNumber}`);
        } catch (e) {
          console.error("Fallback to dialer failed:", e);
        }
      };

      // Fire fallback after ~1.2s if nothing happens
      const timer = setTimeout(triggerFallback, 1200);

      try {
        RNImmediatePhoneCall.immediatePhoneCall(emergencyNumber);
      } catch (callErr) {
        // If native throws synchronously, cancel timer and fallback immediately
        clearTimeout(timer);
        await triggerFallback();
        return;
      }

      // Give a little extra time; if no fallback was needed, clear the timer
      setTimeout(() => {
        if (!fallbackTriggered) clearTimeout(timer);
      }, 3000);
    } else {
      // Permission denied or never-ask-again: open dialer prompt
      try {
        await Linking.openURL(`tel:${emergencyNumber}`);
      } catch (err) {
        console.error("Permission denied; dialer fallback failed:", err);
      }
    }
  } catch (err) {
    console.error("CALL_PHONE permission request failed:", err);
    // Last resort: open dialer
    try {
      await Linking.openURL(`tel:${emergencyNumber}`);
    } catch (err2) {
      console.error("Dialer fallback failed after permission error:", err2);
    }
  }
}
