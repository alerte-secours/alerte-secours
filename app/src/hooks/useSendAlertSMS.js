import { useCallback } from "react";
import sendSMS from "~/lib/sms/sendSMS";

import { getCurrentLocation } from "~/location";

export default function useSendAlertSMS() {
  return useCallback(async ({ alert, recipients }) => {
    let [longitude, latitude] = alert?.location?.coordinates || [];
    if (!(longitude && latitude)) {
      const coords = await getCurrentLocation();
      ({ latitude, longitude } = coords);
    }
    // we need to keep message < 153 characters
    // even uri encoded, the ampersand char break/truncate body links on some devices
    const bodyParts = [];
    bodyParts.push(`J'ai besoin d'aide.`);
    if (alert.code) {
      const deepLink = `https://app.alertesecours.fr/code/${encodeURIComponent(
        alert.code,
      )}?q=c:${alert.accessCode}~l:${latitude},${longitude}`;
      bodyParts.push(deepLink);
    }

    const body = bodyParts.join("\n");
    // if (body.length > 153) {
    //   console.warn("SMS body exceeds 153 characters and may be truncated");
    // }

    return sendSMS(recipients, body);
  }, []);
}

// eg: J'ai besoin d'aide https://app.alertesecours.fr/code/Jet.Yang.Fun.Dés.Yang?q=c:lqaNNYz18Ma_u5dVPGNj~l:48.86958,2.3315333
