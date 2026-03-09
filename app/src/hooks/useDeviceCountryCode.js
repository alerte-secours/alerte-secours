import { useI18n } from "~/i18n/context";
export default function useDeviceCountryCode() {
  const { deviceCountryCode } = useI18n();
  return deviceCountryCode;
}
