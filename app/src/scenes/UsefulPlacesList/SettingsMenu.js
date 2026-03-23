import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { Button, Modal, Portal, ProgressBar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { usefulPlacesActions, useUsefulPlacesState } from "~/stores";

const TYPE_KEYS = [
  { key: "urgences", labelKey: "placeTypeUrgences", icon: "hospital-box" },
  { key: "hopital", labelKey: "placeTypeHopital", icon: "hospital-building" },
  { key: "angela", labelKey: "placeTypeAngela", icon: "hand-heart" },
  { key: "gendarmerie", labelKey: "placeTypeGendarmerie", icon: "shield-star" },
  { key: "police", labelKey: "placeTypePolice", icon: "shield-account" },
  { key: "dae", labelKey: "placeTypeDae", icon: "heart-pulse" },
];

function UpdateSection() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const UPDATE_STATE_LABELS = useMemo(
    () => ({
      idle: null,
      checking: t("updateChecking"),
      downloading: t("updateDownloading"),
      installing: t("updateInstalling"),
      done: t("updateComplete"),
      "up-to-date": t("updateUpToDate"),
      error: t("updateError"),
    }),
    [t],
  );
  const { updateState, updateProgress, updateError, lastUpdatedAt } =
    useUsefulPlacesState([
      "updateState",
      "updateProgress",
      "updateError",
      "lastUpdatedAt",
    ]);

  useEffect(() => {
    usefulPlacesActions.loadLastUpdate();
  }, []);

  const isActive = updateState !== "idle";
  const isError = updateState === "error";
  const isDone = updateState === "done" || updateState === "up-to-date";
  const isDownloading = updateState === "downloading";
  const label = UPDATE_STATE_LABELS[updateState];

  const lastUpdateText = lastUpdatedAt
    ? `${t("lastUpdateLabel")}${new Date(lastUpdatedAt).toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      )}`
    : null;

  const statusColor = isError
    ? colors.error || "#F44336"
    : isDone
    ? "#4CAF50"
    : colors.onSurfaceVariant || colors.grey;

  const statusIcon = isError
    ? "alert-circle-outline"
    : isDone
    ? "check-circle-outline"
    : "cloud-sync-outline";

  return (
    <View style={styles.updateSection}>
      {isActive && (
        <View style={styles.updateStatusRow}>
          <MaterialCommunityIcons
            name={statusIcon}
            size={18}
            color={statusColor}
          />
          <Text style={[styles.updateStatusText, { color: statusColor }]}>
            {label}
          </Text>
          {isError && (
            <TouchableOpacity
              onPress={() => usefulPlacesActions.dismissUpdateError()}
              accessibilityRole="button"
              accessibilityLabel={t("closeButton")}
              accessibilityHint={t("closeButton")}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={statusColor}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      {isDownloading && (
        <ProgressBar
          progress={updateProgress}
          color={colors.primary}
          style={styles.progress}
        />
      )}
      {isError && updateError && (
        <Text style={[styles.updateErrorDetail, { color: statusColor }]}>
          {updateError}
        </Text>
      )}
      {!isActive && lastUpdateText && (
        <Text
          style={[
            styles.lastUpdateText,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          {lastUpdateText}
        </Text>
      )}
      {!isActive && (
        <Button
          mode="outlined"
          icon="cloud-download-outline"
          onPress={() => usefulPlacesActions.triggerUpdate()}
          style={styles.updateButton}
          compact
        >
          {t("checkUpdates")}
        </Button>
      )}
    </View>
  );
}

export default React.memo(function SettingsMenu({
  visibleTypes,
  onToggle,
  floating,
  showUpdateSection = true,
  hideUnavailableDae = false,
  onToggleHideUnavailableDae,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const TYPES = useMemo(
    () =>
      TYPE_KEYS.map(({ key, labelKey, icon }) => ({
        key,
        label: t(labelKey),
        icon,
      })),
    [t],
  );

  const activeCount = visibleTypes.length;
  const totalCount = TYPES.length;
  const hasInactiveFilters = activeCount < totalCount;

  const modalStyles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.surface,
        marginHorizontal: 24,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        maxHeight: "80%",
      },
    }),
    [colors],
  );

  const triggerButton = floating ? (
    <TouchableOpacity
      style={[styles.floatingButton, { backgroundColor: colors.surface }]}
      onPress={open}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t("filtersAndSettings")}
      accessibilityHint={t("openFiltersHint")}
    >
      <MaterialCommunityIcons
        name="tune-vertical"
        size={22}
        color={colors.onSurface}
      />
      {hasInactiveFilters && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={[
        styles.barButton,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.outlineVariant || colors.grey,
        },
      ]}
      onPress={open}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t("filtersAndSettings")}
      accessibilityHint={t("openFiltersHint")}
    >
      <MaterialCommunityIcons
        name="tune-vertical"
        size={20}
        color={colors.primary}
      />
      <Text style={[styles.barButtonText, { color: colors.onSurface }]}>
        {t("filtersLabel")}
      </Text>
      {hasInactiveFilters && (
        <View style={[styles.barBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.barBadgeText}>
            {activeCount}/{totalCount}
          </Text>
        </View>
      )}
      <MaterialCommunityIcons
        name="chevron-down"
        size={18}
        color={colors.onSurfaceVariant || colors.grey}
      />
    </TouchableOpacity>
  );

  return (
    <>
      {triggerButton}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={close}
          contentContainerStyle={modalStyles.container}
        >
          <Text style={styles.modalTitle}>{t("filtersLabel")}</Text>

          <View style={styles.chipsContainer}>
            {TYPES.map(({ key, label, icon }) => {
              const active = visibleTypes.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceVariant || "#E0E0E0",
                    },
                  ]}
                  onPress={() => onToggle(key)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                  accessibilityHint={t("filterToggleHint")}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={16}
                    color={
                      active ? "#FFFFFF" : colors.onSurfaceVariant || "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      {
                        color: active
                          ? "#FFFFFF"
                          : colors.onSurfaceVariant || "#666",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {visibleTypes.includes("dae") && onToggleHideUnavailableDae && (
            <>
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.outlineVariant || colors.grey },
                ]}
              />
              <View style={styles.availabilityToggleRow}>
                <View style={styles.availabilityToggleText}>
                  <Text style={styles.sectionTitle}>
                    {t("hideUnavailableDaeLabel")}
                  </Text>
                  <Text
                    style={[
                      styles.availabilityToggleHint,
                      { color: colors.onSurfaceVariant || colors.grey },
                    ]}
                  >
                    {t("hideUnavailableDaeHint")}
                  </Text>
                </View>
                <Switch
                  value={hideUnavailableDae}
                  onValueChange={onToggleHideUnavailableDae}
                  trackColor={{
                    false: colors.surfaceVariant || "#E0E0E0",
                    true: colors.primary + "80",
                  }}
                  thumbColor={hideUnavailableDae ? colors.primary : "#f4f3f4"}
                />
              </View>
            </>
          )}

          {showUpdateSection && (
            <>
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.outlineVariant || colors.grey },
                ]}
              />

              <Text style={styles.sectionTitle}>{t("dataUpdateSection")}</Text>
              <UpdateSection />
            </>
          )}

          <Button mode="text" onPress={close} style={styles.closeButton}>
            {t("closeButton")}
          </Button>
        </Modal>
      </Portal>
    </>
  );
});

const styles = StyleSheet.create({
  // Floating button (for map)
  floatingButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  // Bar button (for list)
  barButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barButtonText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  barBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  barBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  // Modal
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  availabilityToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  availabilityToggleText: {
    flex: 1,
  },
  availabilityToggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  updateSection: {
    gap: 8,
  },
  updateStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  updateStatusText: {
    fontSize: 13,
    flex: 1,
  },
  progress: {
    height: 3,
    borderRadius: 2,
  },
  updateErrorDetail: {
    fontSize: 12,
  },
  lastUpdateText: {
    fontSize: 13,
  },
  updateButton: {
    alignSelf: "flex-start",
  },
  closeButton: {
    marginTop: 16,
  },
});
