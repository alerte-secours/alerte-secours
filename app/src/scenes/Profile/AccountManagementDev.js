import React, { useMemo } from "react";

import { View } from "react-native";

import { Button } from "react-native-paper";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useParamsState, useSessionState } from "~/stores";
import { useTheme } from "~/theme";

export default function AccountManagementDev({ openModal }) {
  const { colors, custom } = useTheme();
  const { devModeEnabled } = useParamsState(["devModeEnabled"]);
  const { allowedRoles } = useSessionState(["allowedRoles"]);
  if (!(devModeEnabled && allowedRoles.includes("dev"))) {
    return null;
  }
  return (
    <Button
      mode="contained"
      style={{ marginVertical: 5 }}
      icon={() => (
        <MaterialCommunityIcons
          name="account-tie"
          size={28}
          color={colors.onPrimary}
        />
      )}
      labelStyle={{
        flex: 1,
      }}
      onPress={() =>
        openModal({
          component: "impersonate",
        })
      }
    >
      Impersonate
    </Button>
  );
}
