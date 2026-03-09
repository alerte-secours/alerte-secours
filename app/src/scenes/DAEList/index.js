import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fontFamily, useTheme } from "~/theme";

import DAEListListe from "./Liste";
import DAEListCarte from "./Carte";
import DaeUpdateBanner from "./DaeUpdateBanner";

const Tab = createBottomTabNavigator();

export default React.memo(function DAEList() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <DaeUpdateBanner />
      <View style={styles.tabContainer}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.onSurfaceVariant || colors.grey,
            tabBarLabelStyle: {
              fontFamily,
              fontSize: 12,
            },
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.outlineVariant || colors.grey,
            },
          }}
        >
          <Tab.Screen
            name="DAEListListe"
            component={DAEListListe}
            options={{
              tabBarLabel: "Liste",
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  color={color}
                  size={size}
                />
              ),
            }}
          />
          <Tab.Screen
            name="DAEListCarte"
            component={DAEListCarte}
            options={{
              tabBarLabel: "Carte",
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  color={color}
                  size={size}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
  },
});
