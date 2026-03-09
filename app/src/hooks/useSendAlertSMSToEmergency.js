import { useCallback } from "react";
import useSendAlertSMS from "./useSendAlertSMS";

export default function useSendAlertSMSToEmergency() {
  const sendAlertSMS = useSendAlertSMS();
  return useCallback(
    async ({ alert }) => {
      const recipients = ["114"];
      return sendAlertSMS({ recipients, alert });
    },
    [sendAlertSMS],
  );
}
