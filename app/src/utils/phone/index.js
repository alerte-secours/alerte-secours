import { PhoneNumberUtil } from "google-libphonenumber";
import DeviceCountry from "react-native-device-country";
import countryCodesList from "country-codes-list";

const phoneUtil = PhoneNumberUtil.getInstance();

export const tryMethodPhone = (
  method,
  phoneNumber,
  args = [],
  defaultValue = "",
) => {
  try {
    const num = phoneUtil.parse(phoneNumber);
    return num[method](...args);
  } catch (_err) {
    console.debug("phone number parse err", _err, { method, args });
    return defaultValue;
  }
};

export const getRegionCodeForNumber = (phoneNumber, defaultValue) => {
  return tryMethodPhone(
    "getRegionCodeForNumber",
    phoneNumber,
    [],
    defaultValue,
  );
};
export const getCountryCode = (phoneNumber, defaultValue) => {
  return tryMethodPhone("getCountryCode", phoneNumber, [], defaultValue);
};
export const getNationalNumber = (phoneNumber, defaultValue) => {
  return tryMethodPhone("getNationalNumber", phoneNumber, [], defaultValue);
};

export const isValidNumber = (phoneNumber, countryCode) => {
  try {
    const parsedNumber = phoneUtil.parse(phoneNumber, countryCode);
    return phoneUtil.isValidNumber(parsedNumber);
  } catch (_err) {
    // console.log({ phoneNumber, countryCode }, _err);
    return false;
  }
};

export const parseInternationalNumber = (n) => {
  let num;
  try {
    num = phoneUtil.parse(n);
  } catch (err) {
    return;
  }
  if (!num.hasNationalNumber()) {
    return;
  }
  let nationalNumber = num.getNationalNumberOrDefault().toString();
  const code = num.getCountryCodeOrDefault();
  const countryCode = phoneUtil.getRegionCodeForCountryCode(code);
  return {
    countryCode: countryCode,
    code: code.toString(),
    nationalNumber,
  };
};

export const removeLeadingZero = (number) => {
  return number?.replace(/^0+/, "");
};

export const normalizeNumber = (
  number,
  country,
  { defaultCountryCallingCode = false } = {},
) => {
  let code;
  if (country) {
    code = countryCodesList.findOne("countryCode", country)?.countryCallingCode;
    number = removeLeadingZero(number);
    number = `${code}${number}`;
  } else {
    let num;
    try {
      num = phoneUtil.parse(number);
    } catch (err) {}
    number = removeLeadingZero(number);
    if (!num?.hasNationalNumber() && defaultCountryCallingCode) {
      number = `${defaultCountryCallingCode}${number}`;
    }
  }

  return number.replace(/\D/g, "");
};
