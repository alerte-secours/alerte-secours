import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ProgressBar, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { defibsActions, useDefibsState } from "~/stores";

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default React.memo(function DaeUpdateBanner() {
  const { colors } = useTheme();
  const {
    daeUpdateState,
    daeUpdateProgress,
    daeUpdateError,
    daeLastUpdatedAt,
  } = useDefibsState([
    "daeUpdateState",
    "daeUpdateProgress",
    "daeUpdateError",
    "daeLastUpdatedAt",
  ]);

  // Load persisted last-update date on mount
  useEffect(() => {
    defibsActions.loadLastDaeUpdate();
  }, []);

  const handleUpdate = useCallback(() => {
    defibsActions.triggerDaeUpdate();
  }, []);

  const handleDismissError = useCallback(() => {
    defibsActions.dismissDaeUpdateError();
  }, []);

  const isActive =
    daeUpdateState === "checking" ||
    daeUpdateState === "downloading" ||
    daeUpdateState === "installing";

  // Done state
  if (daeUpdateState === "done") {
    return (
      <View
        style={[
          styles.banner,
          { backgroundColor: (colors.primary || "#4CAF50") + "15" },
        ]}
      >
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={18}
          color={colors.primary || "#4CAF50"}
        />
        <Text
          style={[styles.statusText, { color: colors.primary || "#4CAF50" }]}
        >
          {"Base de donn\u00e9es mise \u00e0 jour !"}
        </Text>
      </View>
    );
  }

  // Already up-to-date
  if (daeUpdateState === "up-to-date") {
    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor:
              (colors.onSurfaceVariant || colors.grey || "#666") + "10",
          },
        ]}
      >
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={18}
          color={colors.onSurfaceVariant || colors.grey}
        />
        <Text
          style={[
            styles.statusText,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          {"Donn\u00e9es d\u00e9j\u00e0 \u00e0 jour"}
        </Text>
      </View>
    );
  }

  // Error state
  if (daeUpdateState === "error") {
    return (
      <View
        style={[
          styles.banner,
          { backgroundColor: (colors.error || "#F44336") + "15" },
        ]}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={18}
          color={colors.error || "#F44336"}
        />
        <Text
          style={[styles.errorText, { color: colors.error || "#F44336" }]}
          numberOfLines={2}
        >
          {daeUpdateError || "Erreur lors de la mise \u00e0 jour"}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleUpdate}
          style={styles.retryTouch}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={colors.error || "#F44336"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleDismissError}
          style={styles.dismissTouch}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={colors.error || "#F44336"}
          />
        </TouchableOpacity>
      </View>
    );
  }

  // Downloading state
  if (daeUpdateState === "downloading") {
    const pct = Math.round(daeUpdateProgress * 100);
    return (
      <View
        style={[
          styles.banner,
          styles.progressBanner,
          { backgroundColor: (colors.primary || "#2196F3") + "10" },
        ]}
      >
        <View style={styles.progressHeader}>
          <ActivityIndicator size={14} color={colors.primary} />
          <Text
            style={[styles.statusText, { color: colors.primary || "#2196F3" }]}
          >
            {`T\u00e9l\u00e9chargement\u2026 ${pct}%`}
          </Text>
        </View>
        <ProgressBar
          progress={daeUpdateProgress}
          color={colors.primary}
          style={styles.progressBar}
        />
      </View>
    );
  }

  // Checking / Installing state
  if (isActive) {
    const label =
      daeUpdateState === "checking"
        ? "V\u00e9rification\u2026"
        : "Installation\u2026";
    return (
      <View
        style={[
          styles.banner,
          { backgroundColor: (colors.primary || "#2196F3") + "10" },
        ]}
      >
        <ActivityIndicator size={14} color={colors.primary} />
        <Text
          style={[styles.statusText, { color: colors.primary || "#2196F3" }]}
        >
          {label}
        </Text>
      </View>
    );
  }

  // Idle state
  const formattedDate = formatDate(daeLastUpdatedAt);

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor:
            (colors.onSurfaceVariant || colors.grey || "#666") + "08",
          borderBottomColor: colors.outlineVariant || colors.grey,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="database-sync-outline"
        size={18}
        color={colors.onSurfaceVariant || colors.grey}
      />
      <View style={styles.idleTextContainer}>
        <Text
          style={[
            styles.dateText,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          {formattedDate
            ? `Derni\u00e8re mise \u00e0 jour : ${formattedDate}`
            : "Donn\u00e9es int\u00e9gr\u00e9es \u00e0 l'application"}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={handleUpdate}
        style={[
          styles.updateButton,
          { backgroundColor: colors.primary || "#2196F3" },
        ]}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="download" size={14} color="#fff" />
        <Text style={styles.updateButtonText}>{"Mettre \u00e0 jour"}</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  progressBanner: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  retryTouch: {
    padding: 4,
  },
  dismissTouch: {
    padding: 4,
  },
  idleTextContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
