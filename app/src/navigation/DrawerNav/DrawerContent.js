import React from "react";

import { StyleSheet } from "react-native";

import { DrawerContentScrollView } from "@react-navigation/drawer";

import { useTheme, fontFamily } from "~/theme";

import DrawerItemList from "./DrawerItemList";

export default function DrawerContent(props) {
  const { colors, custom } = useTheme();
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ paddingTop: 0 }}
    >
      <DrawerItemList
        {...props}
        itemStyle={{
          marginHorizontal: 2,
          marginVertical: 1,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: colors.outlineVariant,
          borderRadius: 0,
        }}
        labelStyle={{
          fontFamily,
        }}
        activeTintColor={colors.onBackground}
        inactiveTintColor={colors.primary}
        activeBackgroundColor={colors.surfaceVariant}
        inactiveBackgroundColor={colors.surfaceSecondary}
      />
    </DrawerContentScrollView>
  );
}
