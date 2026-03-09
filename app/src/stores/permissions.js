import { createAtom } from "~/lib/atomic-zustand";

export default createAtom(({ merge }) => {
  const setFcm = (fcm) => {
    merge({ fcm });
  };

  const setLocationForeground = (locationForeground) => {
    merge({ locationForeground });
  };

  const setLocationBackground = (locationBackground) => {
    merge({ locationBackground });
  };

  const setReadContacts = (readContacts) => {
    merge({ readContacts });
  };

  const setPhoneCall = (phoneCall) => {
    merge({ phoneCall });
  };

  const setMotion = (motion) => {
    merge({ motion });
  };

  const setBatteryOptimizationDisabled = (batteryOptimizationDisabled) => {
    merge({ batteryOptimizationDisabled });
  };

  return {
    default: {
      fcm: false,
      locationForeground: false,
      locationBackground: false,
      readContacts: false,
      phoneCall: false,
      motion: false,
      batteryOptimizationDisabled: false,
    },
    actions: {
      setFcm,
      setLocationForeground,
      setLocationBackground,
      setReadContacts,
      setPhoneCall,
      setMotion,
      setBatteryOptimizationDisabled,
    },
  };
});
