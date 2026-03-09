import React from "react";
import { View } from "react-native";

import FromContactPhoneNumberList from "./FromContactPhoneNumberList";
import useDeviceCountryCode from "~/hooks/useDeviceCountryCode";
import FromContactPhoneNumberAdd from "./FromContactPhoneNumberAdd";
import { useForm, FormProvider } from "react-hook-form";

export default function FromContacts({ data }) {
  const defaultCountryCode = useDeviceCountryCode();
  const methods = useForm({
    // mode: "onChange",
    // reValidateMode: "onChange",
    defaultValues: {
      fromContactsAdd: { phoneCountry: defaultCountryCode, phoneNumber: "" },
    },
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 0, paddingVertical: 10 }}>
      <FromContactPhoneNumberList data={data} />
      <FormProvider {...methods}>
        <View style={{ paddingTop: 30 }}>
          <FromContactPhoneNumberAdd data={data} />
        </View>
      </FormProvider>
    </View>
  );
}
