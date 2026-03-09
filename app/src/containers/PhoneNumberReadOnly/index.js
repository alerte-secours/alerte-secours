import React, { useState, useEffect } from "react";

import { View } from "react-native";

import Text from "~/components/Text";
import countryCodesList from "country-codes-list";

import { PhoneNumberUtil, PhoneNumberFormat } from "google-libphonenumber";

import { Flag } from "react-native-country-picker-modal";

import { useI18n } from "~/i18n/context";
import getContactName from "~/lib/contacts/get-contact-name";

import { removeLeadingZero } from "~/utils/phone";

const phoneUtil = PhoneNumberUtil.getInstance();

export default function PhoneNumberReadOnly({
  internationalPhoneNumber,
  phoneNumber,
  phoneCountry,
  useContactName = false,
  useCode = false,
}) {
  const { deviceCountryCode } = useI18n();

  if (internationalPhoneNumber) {
    let num;
    try {
      num = phoneUtil.parse(internationalPhoneNumber);
      if (num?.hasNationalNumber()) {
        const code = num.getCountryCodeOrDefault();
        phoneCountry = phoneUtil.getRegionCodeForCountryCode(code);
        phoneNumber = num.getNationalNumberOrDefault().toString();
      }
    } catch (err) {}
  }
  if (!phoneNumber) {
    phoneNumber = internationalPhoneNumber;
  }
  if (!phoneCountry) {
    phoneCountry = deviceCountryCode;
  }

  const code = countryCodesList.findOne(
    "countryCode",
    phoneCountry,
  )?.countryCallingCode;

  let displayNumber;
  try {
    const tel = phoneUtil.parse(phoneNumber, phoneCountry);
    displayNumber = phoneUtil.format(tel, PhoneNumberFormat.NATIONAL);
  } catch (_err) {
    displayNumber = phoneNumber;
  }

  displayNumber = removeLeadingZero(displayNumber);

  const [contactName, setContactName] = useState("");
  useEffect(() => {
    if (!phoneNumber && contactName) {
      setContactName("");
    }
    if (useContactName && phoneNumber) {
      (async () => {
        const fullName = await getContactName(phoneNumber, phoneCountry, {
          defaultCountryCode: deviceCountryCode,
        });
        setContactName(fullName);
      })();
    }
  }, [
    phoneNumber,
    deviceCountryCode,
    setContactName,
    useContactName,
    phoneCountry,
    contactName,
  ]);

  return (
    <View
      style={{
        flexDirection: "column",
        alignItems: "center",
        padding: 10,
      }}
    >
      {useContactName && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            {contactName}
          </Text>
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Flag
          countryCode={phoneCountry}
          flagSize={20}
          withFlagButton
          withEmoji
        />
        {useCode && (
          <Text style={{ fontSize: 18, paddingRight: 5 }}>+{code}</Text>
        )}
        <Text style={{ fontSize: 18 }}>
          {(useCode ? "" : "0") + displayNumber}
        </Text>
      </View>
    </View>
  );
}
