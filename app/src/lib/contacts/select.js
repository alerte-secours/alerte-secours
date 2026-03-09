import { Platform } from "react-native";

import { request, PERMISSIONS, RESULTS } from "react-native-permissions";

import { pickContact } from "react-native-contact-pick";

export default async function contactsSelect() {
  const response =
    Platform.OS === "ios"
      ? await request(PERMISSIONS.IOS.CONTACTS)
      : await request(PERMISSIONS.ANDROID.READ_CONTACTS);
  if (response !== RESULTS.GRANTED) {
    return false;
  }

  let contact;
  try {
    contact = await pickContact();
  } catch (error) {
    // cancelled by user
  }
  if (!contact) {
    return null;
  }
  return contact;
}
