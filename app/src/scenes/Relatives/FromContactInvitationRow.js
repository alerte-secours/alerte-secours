import React, { useState, useRef, useEffect, useCallback } from "react";

import { View, StyleSheet, TextInput } from "react-native";

import PhoneNumberReadOnly from "~/containers/PhoneNumberReadOnly";
import { useTheme } from "~/theme";

import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Text from "~/components/Text";
import { useMutation } from "@apollo/client";

import { Button } from "react-native-paper";

import { DELETE_INVITATION_MUTATION } from "./gql";

export default function FromContactInvitationRow({
  phoneNumber,
  phoneCountry,
  id: relativeInvitationId,
}) {
  const { colors, custom } = useTheme();

  const [deleteInvitationMutation] = useMutation(DELETE_INVITATION_MUTATION, {
    variables: { relativeInvitationId },
  });

  const deleteInvitation = useCallback(async () => {
    await deleteInvitationMutation();
  }, [deleteInvitationMutation]);

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "space-evenly",
        borderBottomColor: "rgba(0, 0, 0, 0.12)",
        borderBottomWidth: 0.2,
        paddingBottom: 10,
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
          onPress={deleteInvitation}
        >
          Annuler
        </Button>
      </View>
    </View>
  );
}
