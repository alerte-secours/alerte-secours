import React, { useMemo, useCallback, useEffect } from "react";

import { View, StyleSheet } from "react-native";
import { useMutation, useLazyQuery } from "@apollo/client";

import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "~/theme";

import Text from "~/components/Text";

import Loader from "~/components/Loader";

import ToContactPhoneNumberRow from "./ToContactPhoneNumberRow";
import ToContactPhoneNumberAdd from "./ToContactPhoneNumberAdd";

import { useFormContext } from "react-hook-form";

import { removeLeadingZero } from "~/utils/phone";

import {
  UPSERT_ONE_RELATIVE_BY_PHONE_NUMBER_ID_MUTATION,
  INSERT_ONE_RELATIVE_UNREGISTERED_MUTATION,
} from "./gql";
import getPhoneNumberId from "~/data/getPhoneNumberId";

export default function ToContactPhoneNumberList({
  data,
  deleteRelativeModal,
}) {
  const { colors, custom } = useTheme();

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isValid },
  } = useFormContext();

  const [
    upsertOneRelativeByPhoneNumberIdMutation,
    { loadingRegistered, errorRegistered },
  ] = useMutation(UPSERT_ONE_RELATIVE_BY_PHONE_NUMBER_ID_MUTATION);

  const [
    insertOneRelativeUnregisteredMutation,
    { loadingUnregistered, errorUnregistered },
  ] = useMutation(INSERT_ONE_RELATIVE_UNREGISTERED_MUTATION);

  if (errorRegistered) {
    console.log("error", errorRegistered); // TODO handle error, create a component to handle apollo errors
  }
  if (errorUnregistered) {
    console.log("error", errorUnregistered); // TODO handle error, create a component to handle apollo errors
  }

  const newInput = watch("new");

  const onSubmit = useCallback(
    async (formData) => {
      const { phoneCountry, phoneNumber: inputPhoneNumber } = formData.new;
      const phoneNumber = inputPhoneNumber
        ? removeLeadingZero(inputPhoneNumber)
        : null;
      if (!(phoneCountry && phoneNumber)) {
        return;
      }
      const inputPhoneNumberId = await getPhoneNumberId([
        phoneCountry,
        phoneNumber,
      ]);
      if (inputPhoneNumberId) {
        await upsertOneRelativeByPhoneNumberIdMutation({
          variables: {
            inputPhoneNumberId,
          },
        });
      } else {
        await insertOneRelativeUnregisteredMutation({
          variables: {
            phoneCountry,
            phoneNumber,
          },
        });
      }
      reset();
    },
    [
      insertOneRelativeUnregisteredMutation,
      reset,
      upsertOneRelativeByPhoneNumberIdMutation,
    ],
  );

  const relatives = [];
  relatives.push(
    ...data.selectOneUser.manyRelative.map((relativeRow) => {
      const { oneViewRelativePhoneNumber } = relativeRow;
      const { onePhoneNumberAsTo } = oneViewRelativePhoneNumber;
      return {
        country: onePhoneNumberAsTo.country,
        number: onePhoneNumberAsTo.number,
        id: relativeRow.id,
        type: "registered",
      };
    }),
  );
  relatives.push(
    ...data.selectOneUser.manyRelativeUnregistered.map(
      (relativeUnregisteredRow) => {
        return {
          country: relativeUnregisteredRow.phoneCountry,
          number: relativeUnregisteredRow.phoneNumber,
          id: relativeUnregisteredRow.id,
          type: "unregistered",
        };
      },
    ),
  );

  const addEnabled = relatives.length < 5;

  const handledSubmit = handleSubmit(onSubmit);

  return (
    <View style={styles.container}>
      <View>
        <View style={{ flexDirection: "row" }}>
          <MaterialCommunityIcons
            name="shield-account"
            size={24}
            style={{ paddingRight: 10, color: colors.primary }}
          />
          <Text style={{ fontSize: 18, color: colors.primary, flex: 1 }}>
            Personnes à contacter en cas d'urgence
          </Text>
        </View>
        <View
          style={{
            paddingTop: 10,
          }}
        >
          {relatives.map((relative) => (
            <ToContactPhoneNumberRow
              key={relative.type + relative.id}
              data={data}
              relative={relative}
              deleteRelativeModal={deleteRelativeModal}
            />
          ))}
          {addEnabled && (
            <ToContactPhoneNumberAdd
              data={data}
              onSubmitEditing={handledSubmit}
            />
          )}
        </View>
      </View>
      {(loadingRegistered || loadingUnregistered) && <Loader />}
      {addEnabled && (
        <Button
          mode="contained"
          disabled={!(isValid && newInput.phoneCountry && newInput.phoneNumber)}
          onPress={handledSubmit}
          style={{
            width: "auto",
            alignSelf: "center",
            marginTop: 15,
          }}
        >
          Ajouter
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
    marginBottom: 15,
  },
});
