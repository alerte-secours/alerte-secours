import React, { useState, useRef, useEffect, useMemo } from "react";

import { View } from "react-native";

import { Divider } from "react-native-paper";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "~/theme";

import Text from "~/components/Text";

import FromContactInvitationList from "./FromContactInvitationList";
import FromContactAwaitingList from "./FromContactAwaitingList";
import FromContactActiveList from "./FromContactActiveList";
import FromContactDeniedList from "./FromContactDeniedList";

export default function FromContactPhoneNumberList({ data }) {
  const { colors, custom } = useTheme();

  const { manyRelativeAsTo, manyRelativeInvitationAsTo } = data.selectOneUser;

  const isEmpty =
    manyRelativeInvitationAsTo.length === 0 && manyRelativeAsTo.length === 0;

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <MaterialCommunityIcons
          name="shield-sun"
          size={24}
          color={colors.primary}
          style={{ paddingRight: 10, color: colors.primary }}
        />
        <Text style={{ fontSize: 18, color: colors.primary, flex: 1 }}>
          Personnes dont vous êtes le contact en cas d'urgence
        </Text>
      </View>
      <View>
        {isEmpty && (
          <Text style={{ paddingTop: 10, fontSize: 16, textAlign: "center" }}>
            Aucun utilisateur ne vous a encore enregistré comme contact
            d'urgence
          </Text>
        )}
        <FromContactAwaitingList data={data} />
        <FromContactActiveList data={data} />
        <FromContactDeniedList data={data} />
        <FromContactInvitationList data={data} />
      </View>
    </View>
  );
}
