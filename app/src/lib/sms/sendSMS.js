// import SendSMS from "react-native-sms";

// import * as SMS from "expo-sms";

import { Linking, Alert } from "react-native";

export default async function sendSMS(addresses, message) {
  // if (addresses.length === 0) {
  //   // see https://github.com/tkporter/react-native-sms/issues/15
  //   addresses = undefined;
  // }
  // return SendSMS.send({
  //   body: message,
  //   recipients: addresses,
  //   successTypes: ["all"],
  //   allowAndroidSendWithoutReadPermission: true,
  // });
  // return SMS.sendSMSAsync(addresses, message);

  const phoneNumberString = addresses.join(",");
  const url = `sms:${phoneNumberString}?body=${encodeURIComponent(message)}`;
  return Linking.openURL(url);
}
