import React, { useState, useRef, useEffect, useCallback } from "react";

import { View, StyleSheet, TextInput } from "react-native";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";
import { useTheme } from "~/theme";

import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Text from "~/components/Text";
import { useMutation } from "@apollo/client";

import { Button } from "react-native-paper";

import { DENY_FROM_NUMBER_MUTATION } from "./gql";

export default function FromContactAwaitingRow({ oneRelativeAsTo }) {
  const { colors, custom } = useTheme();

  const {
    oneViewRelativePhoneNumber: {
      onePhoneNumber: { country: phoneCountry, number: phoneNumber },
    },
    oneRelativeAllow: { id: relativeAllowId },
  } = oneRelativeAsTo;

  // const [errorMessage, setErrorMessage] = useState(null);

  const [denyFromNumberMutation] = useMutation(DENY_FROM_NUMBER_MUTATION, {
    variables: { relativeAllowId },
  });

  const denyFromNumber = useCallback(async () => {
    await denyFromNumberMutation();
  }, [denyFromNumberMutation]);

  return (
    <View
      style={{
        alignItems: "center",
        borderBottomColor: "rgba(0, 0, 0, 0.12)",
        borderBottomWidth: 0.2,
        paddingBottom: 10,
        justifyContent: "space-evenly",
        flexDirection: "row",
      }}
    >
      <View>
        <PhoneNumberReadOnly
          phoneNumber={phoneNumber}
          phoneCountry={phoneCountry}
          useContactName
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Button
          key="deny"
          mode="contained"
          style={{ backgroundColor: colors.no, marginHorizontal: 3 }}
          icon={() => (
            <MaterialCommunityIcons
              name="close-circle"
              size={22}
              color={colors.onPrimary}
            />
          )}
          onPress={denyFromNumber}
        >
          Révoquer
        </Button>
      </View>
      {/* {errorMessage && (
        <View>
          <Text style={{ fontSize: 16, color: colors.error }}>
            {errorMessage}
          </Text>
        </View>
      )} */}
    </View>
  );
}
