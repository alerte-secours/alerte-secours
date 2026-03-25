import { Platform } from "react-native";
import requestPermissionLocationBackground from "./requestPermissionLocationBackground";
import { showDisclosure } from "./backgroundLocationDisclosureManager";

export default async function requestPermissionLocationBackgroundWithDisclosure() {
  if (Platform.OS !== "android") {
    return requestPermissionLocationBackground();
  }

  const accepted = await showDisclosure();
  if (!accepted) {
    return false;
  }

  return requestPermissionLocationBackground();
}
