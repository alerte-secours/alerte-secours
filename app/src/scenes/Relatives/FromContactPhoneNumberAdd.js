import React, { useCallback, useState, useEffect } from "react";

import { View, StyleSheet } from "react-native";

import { Button } from "react-native-paper";

import { useFormContext } from "react-hook-form";

import { useMutation } from "@apollo/client";

import Text from "~/components/Text";

import ControlledPhoneNumber from "~/containers/ControlledPhoneNumber";
import ErrorMessageComponents from "./ErrorMessageComponents";

import { UPSERT_ONE_RELATIVE_INVITATION_MUTATION } from "./gql";
import { normalizeNumber } from "~/utils/phone";

import useCheckPhoneNumberRegistered from "~/hooks/queries/useCheckPhoneNumberRegistered";
import getPhoneNumberId from "~/data/getPhoneNumberId";

export default function FromContactPhoneNumberAdd({ data }) {
  const { manyRelativeInvitation } = data.selectOneUser;

  const {
    handleSubmit,
    resetField,
    formState: { isDirty, isValid },
  } = useFormContext();

  const { checkNumberState } = useCheckPhoneNumberRegistered();

  const [formSubmittedData, setFormSubmittedData] = useState(null);

  const [upsertOneRelativeInvitationMutation] = useMutation(
    UPSERT_ONE_RELATIVE_INVITATION_MUTATION,
  );

  useEffect(() => {
    (async () => {
      if (!formSubmittedData) {
        // cancelled
        setFormSubmittedData(null);
        return;
      }

      const { fromContactsAdd } = formSubmittedData;

      const phoneNumber = normalizeNumber(fromContactsAdd.phoneNumber);
      const { phoneCountry } = fromContactsAdd;
      const phoneNumberId = await getPhoneNumberId([phoneCountry, phoneNumber]);

      await upsertOneRelativeInvitationMutation({
        variables: {
          phoneNumberId,
        },
      });
      setFormSubmittedData(null);
    })();
  }, [formSubmittedData, upsertOneRelativeInvitationMutation]);

  const fieldKey = "fromContactsAdd";
  const phoneNumberKey = `${fieldKey}.phoneNumber`;

  const onSubmit = (data) => {
    // console.log("onSubmit", data);
    setFormSubmittedData(data);
    resetField(phoneNumberKey);
  };

  const validate = useCallback(
    async (value, values) => {
      if (!value) {
        return false;
      }
      for (let i = 0; i < manyRelativeInvitation.length; i++) {
        const invitationRow = manyRelativeInvitation[i];
        const {
          oneUserPhoneNumberRelativeAsTo: { onePhoneNumber },
        } = invitationRow;
        if (
          onePhoneNumber.number === value &&
          onePhoneNumber.country === values.fromContactsAdd.phoneCountry
        ) {
          return "Il y a déjà une invitation pour ce numéro de téléphone";
        }
      }
      const numberState = await checkNumberState(
        value,
        values.fromContactsAdd.phoneCountry,
      );
      const isRegistered = value && numberState.isRegistered;
      if (!isRegistered) {
        return "notRegistered";
      }
      const existsAsRelative = value && numberState.existsAsRelative;
      if (!existsAsRelative) {
        return "notRelative";
      }
      return true;
    },
    [checkNumberState, manyRelativeInvitation],
  );

  const controlledPhoneNumberProps = {
    fieldKey,
    validate,
    phoneInputProps: {
      placeholder: "Numéro de téléphone",
    },
  };

  const handledSubmit = handleSubmit(onSubmit);

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 16, paddingBottom: 10 }}>
        Proposez à un proche d'être son contact en cas d'urgence
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <ControlledPhoneNumber
            ErrorMessageComponents={ErrorMessageComponents}
            useContactName
            textInputProps={{
              returnKeyType: "done",
              onSubmitEditing: handledSubmit,
            }}
            {...controlledPhoneNumberProps}
          />
          <Button
            mode="contained"
            onPress={handledSubmit}
            disabled={!(isDirty && isValid)}
            style={{
              marginTop: 15,
              alignSelf: "center",
              justifyContent: "center",
            }}
          >
            Envoyer
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
