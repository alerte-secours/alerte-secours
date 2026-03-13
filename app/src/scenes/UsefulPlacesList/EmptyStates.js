import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Text from "~/components/Text";
import Loader from "~/components/Loader";
import { useTheme } from "~/theme";

export function LoadingView({ message }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loadingContainer}>
      <Loader containerProps={{ style: styles.loaderInner }} />
      <Text
        style={[
          styles.loadingText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

export function EmptyNoLocation({ messageKey }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="crosshairs-off"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>{t("locationUnavailable")}</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        {t(messageKey || "locationEnableList")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loaderInner: {
    flex: 0,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
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
  },
});
