import React from "react";

import { StyleSheet, View } from "react-native";

import CheckBox from "./CheckboxAndroid";
import { TouchableRipple, Text } from "react-native-paper";
import { useTheme } from "~/theme";

function CheckboxItem(props) {
  const {
    style,
    status,
    icon: IconComponent,
    label,
    onPress,
    labelStyle,
    ...checkboxProps
  } = props;

  const { colors, custom } = useTheme();

  return (
    <TouchableRipple onPress={onPress}>
      <View style={[styles.container, style]} pointerEvents="none">
        {IconComponent && <IconComponent />}
        <Text style={[styles.label, labelStyle, { color: colors.primary }]}>
          {label}
        </Text>
        <CheckBox status={status} {...checkboxProps}></CheckBox>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
  },
});

export default CheckboxItem;
