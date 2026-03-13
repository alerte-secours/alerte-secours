import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Linking,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getApps, showLocation } from "react-native-map-link";
import { useTranslation } from "react-i18next";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { useUsefulPlacesState } from "~/stores";
import { getPlaceAvailability } from "~/utils/places/getPlaceAvailability";
import {
  TYPE_ICONS,
  TYPE_I18N_KEYS,
  STATUS_COLORS,
  formatDistance,
} from "~/utils/places/constants";

function InfoRow({ icon, label, value, valueColor }) {
  const { colors } = useTheme();
  if (!value) return null;
  return (
    <View
      style={[
        styles.infoRow,
        { borderBottomColor: colors.outlineVariant || colors.grey },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.infoIcon}
      />
      <View style={styles.infoContent}>
        <Text
          style={[
            styles.infoLabel,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[styles.infoValue, valueColor ? { color: valueColor } : null]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default React.memo(function UsefulPlaceItemInfos() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { selectedPlace: place } = useUsefulPlacesState(["selectedPlace"]);
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [availableApps, setAvailableApps] = useState([]);

  const typeLabel = (type) =>
    TYPE_I18N_KEYS[type] ? t(TYPE_I18N_KEYS[type]) : type;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getApps({ alwaysIncludeGoogle: true });
        if (!cancelled) setAvailableApps(result);
      } catch (err) {
        if (__DEV__) {
          console.warn("[UsefulPlaceItem] getApps failed:", err.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openNavModal = useCallback(() => {
    setNavModalVisible(true);
  }, []);

  const closeNavModal = useCallback(() => {
    setNavModalVisible(false);
  }, []);

  const goToCarte = useCallback(() => {
    closeNavModal();
    navigation.navigate("UsefulPlaceItemCarte");
  }, [navigation, closeNavModal]);

  const openExternalApp = useCallback(
    (app) => {
      closeNavModal();
      if (place?.latitude && place?.longitude) {
        showLocation({
          latitude: place.latitude,
          longitude: place.longitude,
          app: app.id,
          naverCallerName:
            Platform.OS === "ios"
              ? "com.alertesecours.alertesecours"
              : "com.alertesecours",
        });
      }
    },
    [place, closeNavModal],
  );

  const modalStyles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.surface,
        marginHorizontal: 24,
        borderRadius: 16,
        paddingVertical: 16,
      },
      title: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
      },
      subtitle: {
        fontSize: 14,
        color: colors.onSurfaceVariant || colors.grey,
        textAlign: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
      },
      option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
      },
      optionText: {
        fontSize: 16,
        marginLeft: 16,
        flex: 1,
      },
      separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.outlineVariant || colors.grey,
        marginHorizontal: 16,
      },
      cancelButton: {
        marginTop: 8,
        marginHorizontal: 16,
      },
    }),
    [colors],
  );

  const handleCall = useCallback(() => {
    if (place?.telephone) {
      // Sanitize phone: keep only digits, +, and #
      const sanitized = place.telephone.replace(/[^\d+#]/g, "");
      if (sanitized) {
        Linking.openURL(`tel:${sanitized}`);
      }
    }
  }, [place?.telephone]);

  const handleOpenUrl = useCallback(() => {
    if (place?.url) {
      // Only allow http/https schemes
      const url = place.url.trim();
      if (/^https?:\/\//i.test(url)) {
        Linking.openURL(url);
      }
    }
  }, [place?.url]);

  if (!place) return null;

  const typeLabelText = typeLabel(place.type);
  const typeIcon = TYPE_ICONS[place.type] || "map-marker";
  const { status, label: availLabel } = getPlaceAvailability(
    place.horaires_std,
    place.disponible_24h,
    place.type,
    undefined,
    t,
  );
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  const distStr = formatDistance(place.distanceMeters);
  const address = [place.adresse, place.code_postal, place.commune]
    .filter(Boolean)
    .join(", ");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={typeIcon}
          size={32}
          color={colors.primary}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{place.nom || typeLabelText}</Text>
          <Text
            style={[
              styles.typeTag,
              { color: colors.primary, borderColor: colors.primary },
            ]}
          >
            {typeLabelText}
          </Text>
        </View>
      </View>

      {/* Availability */}
      <View
        style={[
          styles.availBadge,
          { backgroundColor: statusColor + "15", borderColor: statusColor },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.availText, { color: statusColor }]}>
          {availLabel}
        </Text>
      </View>

      {/* Info rows */}
      <View style={styles.infoSection}>
        <InfoRow
          icon="map-marker"
          label={t("addressLabel")}
          value={address || null}
        />
        {distStr && (
          <InfoRow
            icon="map-marker-distance"
            label={t("distanceLabel")}
            value={distStr}
          />
        )}
        <InfoRow icon="phone" label={t("phoneLabel")} value={place.telephone} />
        {place.horaires_raw && (
          <InfoRow
            icon="clock-outline"
            label={t("hoursLabel")}
            value={place.horaires_raw}
          />
        )}
        {place.acces && (
          <InfoRow
            icon={
              place.type === "hopital"
                ? "wheelchair-accessibility"
                : "door-open"
            }
            label={
              place.type === "angela"
                ? t("categoryActivityLabel")
                : place.type === "hopital"
                ? t("accessibilityInfoLabel")
                : t("accessLabel")
            }
            value={place.acces}
          />
        )}
        {place.type === "dae" && typeof place.disponible_24h === "number" && (
          <InfoRow
            icon="clock-check-outline"
            label={t("availability24hLabel")}
            value={place.disponible_24h ? t("yes") : t("no")}
          />
        )}
        {place.departement && (
          <InfoRow
            icon="map"
            label={t("departmentLabel")}
            value={place.departement}
          />
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon={({ size, color }) => (
            <MaterialCommunityIcons
              name="navigation-variant"
              size={size}
              color={color}
            />
          )}
          onPress={openNavModal}
          style={styles.actionBtn}
          contentStyle={styles.itineraireButtonContent}
          accessibilityLabel={t("routeButton")}
          accessibilityHint={t("placeDetailsHint")}
        >
          {t("routeButton")}
        </Button>

        {place.telephone && (
          <Button
            mode="outlined"
            icon="phone"
            onPress={handleCall}
            style={styles.actionBtn}
            accessibilityLabel={t("callA11yLabel", { phone: place.telephone })}
            accessibilityHint={t("callA11yHint")}
          >
            {t("callButton")}
          </Button>
        )}

        {place.url && (
          <Button
            mode="outlined"
            icon="web"
            onPress={handleOpenUrl}
            style={styles.actionBtn}
            accessibilityLabel={t("openWebsiteA11yLabel")}
            accessibilityHint={t("openWebsiteA11yHint")}
          >
            {t("websiteButton")}
          </Button>
        )}
      </View>

      <Button
        mode="text"
        icon="arrow-left"
        onPress={() => navigation.navigate("UsefulPlacesList")}
        style={styles.backBtn}
      >
        {t("backToList")}
      </Button>

      {/* Navigation app chooser modal */}
      <Portal>
        <Modal
          visible={navModalVisible}
          onDismiss={closeNavModal}
          contentContainerStyle={modalStyles.container}
        >
          <Text style={modalStyles.title}>{t("navigationTitle")}</Text>
          <Text style={modalStyles.subtitle}>{t("navigationAppChoice")}</Text>

          {/* In-app navigation option */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={goToCarte}
            style={modalStyles.option}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name="navigation-variant"
              size={24}
              color={colors.primary}
            />
            <Text style={modalStyles.optionText}>{t("inAppNavigation")}</Text>
          </TouchableOpacity>

          {/* External navigation apps */}
          {availableApps.map((app) => (
            <React.Fragment key={app.id}>
              <View style={modalStyles.separator} />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => openExternalApp(app)}
                style={modalStyles.option}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons
                  name="open-in-new"
                  size={24}
                  color={colors.onSurface}
                />
                <Text style={modalStyles.optionText}>{app.name}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}

          <Button
            mode="text"
            onPress={closeNavModal}
            style={modalStyles.cancelButton}
          >
            {t("cancelButton")}
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  typeTag: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {},
  itineraireButtonContent: {
    paddingVertical: 6,
  },
  backBtn: {
    marginTop: 8,
  },
});
