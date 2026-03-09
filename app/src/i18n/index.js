import * as Localization from "expo-localization";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as locales from "./locales";

import moment from "moment";
import frLocale from "moment/locale/fr";

import DeviceCountry from "react-native-device-country";

import env from "~/env";

// see https://ilyagru.github.io/steps-for-localizing-react-native-app
// and https://docs.expo.dev/versions/latest/sdk/localization/#localizationlocale

const fallbacklanguage = "fr";

export const userLanguage =
  Localization.getLocales()[0]?.languageCode || fallbacklanguage;

moment.updateLocale("fr", [frLocale]);

i18n.use(initReactI18next).init({
  resources: locales,
  fallbackLng: fallbacklanguage,
  lng: userLanguage,
  ns: Object.keys(locales.fr),
  defaultNS: "common",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
  react: {
    // wait: true,
    // useSuspense: false, //this line
  },
  compatibilityJSON: "v3",
});

export default i18n;

let deviceCountryCode = env.LOCAL_DEV ? "FR" : undefined;
export const getDeviceCountryCode = async () => {
  if (!deviceCountryCode) {
    deviceCountryCode = await DeviceCountry.getCountryCode();
  }
  return deviceCountryCode.code?.toUpperCase() || "FR";
};

export const SUPPORTED_LOCALES = {
  en: "English",
  fr: "Français",
};
