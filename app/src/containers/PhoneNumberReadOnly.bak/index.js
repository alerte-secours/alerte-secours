import React from "react";

import PhoneInput from "react-native-phone-number-input";

export default function PhoneNumberReadOnly({ phoneNumber, phoneCountry }) {
  return (
    <PhoneInput
      defaultValue={phoneNumber}
      defaultCode={phoneCountry}
      layout="first"
      disabled
      countryPickerProps={{
        disableNativeModal: false, // see https://github.com/garganurag893/react-native-phone-number-input/issues/117
        containerButtonStyle: {
          marginRight: 0,
          backgroundColor: "green",
        },
      }}
      withDarkTheme
      containerStyle={{
        width: "auto",
        backgroundColor: "transparent",
        // width: 220,
      }}
      textContainerStyle={{
        // width: "auto",
        flex: 1,
        backgroundColor: "transparent",
      }}
      textInputStyle={{}}
      codeTextStyle={{
        marginRight: 4,
      }}
      countryPickerButtonStyle={{
        width: "auto",
        // marginRight: -20,
      }}
      disableArrowIcon
    />
  );
}
