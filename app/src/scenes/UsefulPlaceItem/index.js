import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";
import ErrorBoundary from "react-native-error-boundary";

import { fontFamily, useTheme } from "~/theme";
import { useUsefulPlacesState } from "~/stores";
import Text from "~/components/Text";

import UsefulPlaceItemInfos from "./Infos";
import UsefulPlaceItemCarte from "./Carte";

const Tab = createBottomTabNavigator();

function EmptyState() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="map-marker-off"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>{t("noPlaceSelected")}</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        {t("selectPlaceMessage")}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate("UsefulPlacesList")}
        style={styles.backButton}
        icon="arrow-left"
      >
        {t("backToList")}
      </Button>
    </View>
  );
}

function FallbackScreen({ error, resetError }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.fallback}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color={colors.error || "#B00020"}
      />
      <Text style={styles.fallbackText}>{t("sectionError")}</Text>
      {__DEV__ && error?.message ? (
        <Text style={styles.fallbackText}>{error.message}</Text>
      ) : null}
      <Text
        style={[styles.fallbackAction, { color: colors.primary }]}
        onPress={resetError}
      >
        {t("sectionRetry")}
      </Text>
    </View>
  );
}

export default React.memo(function UsefulPlaceItem() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { selectedPlace } = useUsefulPlacesState(["selectedPlace"]);

  if (!selectedPlace) {
    return <EmptyState />;
  }

  return (
    <ErrorBoundary FallbackComponent={FallbackScreen}>
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
          name="UsefulPlaceItemInfos"
          component={UsefulPlaceItemInfos}
          options={{
            tabBarLabel: t("infosTab"),
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
          name="UsefulPlaceItemCarte"
          component={UsefulPlaceItemCarte}
          options={{
            tabBarLabel: t("mapTab"),
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
    </ErrorBoundary>
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
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  fallbackAction: {
    fontSize: 16,
    fontWeight: "600",
  },
});
