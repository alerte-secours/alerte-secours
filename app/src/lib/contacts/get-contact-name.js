import * as Contacts from "expo-contacts";

import countryCodesList from "country-codes-list";

import { normalizeNumber } from "~/utils/phone";

export default async function getContactName(
  phoneNumber,
  phoneCountry,
  { defaultCountryCallingCode, defaultCountryCode } = {},
) {
  if (defaultCountryCode) {
    defaultCountryCallingCode = countryCodesList.findOne(
      "countryCode",
      phoneCountry,
    )?.countryCallingCode;
  }

  // ensure you have necessary permissions
  const { status } = await Contacts.requestPermissionsAsync();

  if (status !== "granted") {
    return null;
  }

  const normalizedPhoneNumber = normalizeNumber(phoneNumber, phoneCountry, {
    defaultCountryCallingCode,
  });

  const { data } = await Contacts.getContactsAsync({
    fields: [
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.FirstName,
      Contacts.Fields.LastName,
    ],
  });

  for (let contact of data) {
    if (contact && contact.phoneNumbers) {
      for (let numberDetail of contact.phoneNumbers) {
        const normalizedContactPhoneNumber = normalizeNumber(
          numberDetail.number,
          null,
          {
            defaultCountryCallingCode,
          },
        );
        // console.log({ normalizedContactPhoneNumber, normalizedPhoneNumber });
        if (normalizedContactPhoneNumber === normalizedPhoneNumber) {
          return `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
        }
      }
    }
  }
  return null;
}
