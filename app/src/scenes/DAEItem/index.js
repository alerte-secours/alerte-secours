import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";

import { fontFamily, useTheme } from "~/theme";
import { useDefibsState } from "~/stores";
import Text from "~/components/Text";

import DAEItemInfos from "./Infos";
import DAEItemCarte from "./Carte";

const Tab = createBottomTabNavigator();

function EmptyState() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="heart-off"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Aucun défibrillateur sélectionné</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        Sélectionnez un défibrillateur depuis la liste pour voir ses détails.
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate("DAEList")}
        style={styles.backButton}
        icon="arrow-left"
      >
        Retour à la liste
      </Button>
    </View>
  );
}

export default React.memo(function DAEItem() {
  const { colors } = useTheme();
  const { selectedDefib } = useDefibsState(["selectedDefib"]);

  if (!selectedDefib) {
    return <EmptyState />;
  }

  return (
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
        name="DAEItemInfos"
        component={DAEItemInfos}
        options={{
          tabBarLabel: "Infos",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="information-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DAEItemCarte"
        component={DAEItemCarte}
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
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 8,
  },
});
