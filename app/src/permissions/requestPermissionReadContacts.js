import * as Contacts from "expo-contacts";

export default async () => {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
};
