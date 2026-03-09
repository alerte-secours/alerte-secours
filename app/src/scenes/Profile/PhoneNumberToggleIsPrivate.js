import React from "react";

import { View } from "react-native";

import { IconButton } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

import { useTheme } from "~/theme";

export default function PhoneNumberToggleIsPrivate({ field, action }) {
  const { colors, custom } = useTheme();
  return (
    <View>
      <IconButton
        size={14}
        style={{
          backgroundColor: colors.primary,
          // marginHorizontal: 3,
        }}
        icon={() => (
          <MaterialIcons
            name={field.isPrivate ? "visibility-off" : "visibility"}
            size={22}
            color={colors.onPrimary}
          />
        )}
        onPress={action}
      />
    </View>
  );
}
