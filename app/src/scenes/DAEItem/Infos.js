import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getApps, showLocation } from "react-native-map-link";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { useDefibsState } from "~/stores";
import { getDefibAvailability } from "~/utils/dae/getDefibAvailability";

const STATUS_COLORS = {
  open: "#4CAF50",
  closed: "#F44336",
  unknown: "#9E9E9E",
};

const STATUS_ICONS = {
  open: "check-circle",
  closed: "close-circle",
  unknown: "help-circle",
};

const DAY_LABELS = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

function formatDistance(meters) {
  if (meters == null) return "Distance inconnue";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function InfoRow({ icon, label, value, valueStyle }) {
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
        size={20}
        color={colors.primary}
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
        <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
      </View>
    </View>
  );
}

function ScheduleSection({ defib }) {
  const { colors } = useTheme();
  const h = defib.horaires_std;

  // If we have structured schedule info, render it
  if (h && typeof h === "object") {
    const parts = [];

    if (h.is24h) {
      parts.push(
        <Text key="24h" style={styles.scheduleItem}>
          Ouvert 24h/24
        </Text>,
      );
    }

    if (h.businessHours) {
      parts.push(
        <Text key="bh" style={styles.scheduleItem}>
          Heures ouvrables (Lun-Ven 08h-18h)
        </Text>,
      );
    }

    if (h.nightHours) {
      parts.push(
        <Text key="nh" style={styles.scheduleItem}>
          Heures de nuit (20h-08h)
        </Text>,
      );
    }

    if (h.events) {
      parts.push(
        <Text key="ev" style={styles.scheduleItem}>
          Selon événements
        </Text>,
      );
    }

    if (Array.isArray(h.days) && h.days.length > 0) {
      const dayStr = h.days
        .sort((a, b) => a - b)
        .map((d) => DAY_LABELS[d] || `Jour ${d}`)
        .join(", ");
      parts.push(
        <Text key="days" style={styles.scheduleItem}>
          Jours : {dayStr}
        </Text>,
      );
    }

    if (Array.isArray(h.slots) && h.slots.length > 0) {
      const slotsStr = h.slots
        .map((s) => `${s.open || "?"} – ${s.close || "?"}`)
        .join(", ");
      parts.push(
        <Text key="slots" style={styles.scheduleItem}>
          Créneaux : {slotsStr}
        </Text>,
      );
    }

    if (h.notes) {
      parts.push(
        <Text
          key="notes"
          style={[
            styles.scheduleItem,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          {h.notes}
        </Text>,
      );
    }

    if (parts.length > 0) {
      return (
        <View style={styles.scheduleContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={colors.primary}
              style={styles.infoIcon}
            />
            <Text style={styles.sectionTitle}>Horaires détaillés</Text>
          </View>
          <View style={styles.scheduleParts}>{parts}</View>
        </View>
      );
    }
  }

  // Fallback to raw horaires string
  if (defib.horaires) {
    return (
      <View style={styles.scheduleContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.sectionTitle}>Horaires</Text>
        </View>
        <Text
          style={[
            styles.scheduleRaw,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          {defib.horaires}
        </Text>
      </View>
    );
  }

  return null;
}

export default React.memo(function DAEItemInfos() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { selectedDefib: defib } = useDefibsState(["selectedDefib"]);
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [availableApps, setAvailableApps] = useState([]);

  useEffect(() => {
    (async () => {
      const result = await getApps({ alwaysIncludeGoogle: true });
      setAvailableApps(result);
    })();
  }, []);

  const { status, label: availabilityLabel } = getDefibAvailability(
    defib?.horaires_std,
    defib?.disponible_24h,
  );

  const statusColor = STATUS_COLORS[status];

  const openNavModal = useCallback(() => {
    setNavModalVisible(true);
  }, []);

  const closeNavModal = useCallback(() => {
    setNavModalVisible(false);
  }, []);

  const goToCarte = useCallback(() => {
    closeNavModal();
    navigation.navigate("DAEItemCarte");
  }, [navigation, closeNavModal]);

  const openExternalApp = useCallback(
    (app) => {
      closeNavModal();
      if (defib?.latitude && defib?.longitude) {
        showLocation({
          latitude: defib.latitude,
          longitude: defib.longitude,
          app: app.id,
          naverCallerName:
            Platform.OS === "ios"
              ? "com.alertesecours.alertesecours"
              : "com.alertesecours",
        });
      }
    },
    [defib, closeNavModal],
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

  if (!defib) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header with availability */}
      <View
        style={[
          styles.availabilityCard,
          { backgroundColor: statusColor + "12" },
        ]}
      >
        <MaterialCommunityIcons
          name={STATUS_ICONS[status]}
          size={36}
          color={statusColor}
        />
        <View style={styles.availabilityInfo}>
          <Text style={[styles.availabilityStatus, { color: statusColor }]}>
            {status === "open"
              ? "Disponible"
              : status === "closed"
              ? "Indisponible"
              : "Disponibilité inconnue"}
          </Text>
          <Text
            style={[
              styles.availabilityLabel,
              { color: colors.onSurfaceVariant || colors.grey },
            ]}
          >
            {availabilityLabel}
          </Text>
        </View>
      </View>

      {/* Basic info */}
      <InfoRow icon="heart-pulse" label="Nom" value={defib.nom} />
      <InfoRow icon="map-marker" label="Adresse" value={defib.adresse} />
      <InfoRow icon="door-open" label="Accès" value={defib.acces} />
      <InfoRow
        icon="map-marker-distance"
        label="Distance"
        value={formatDistance(defib.distanceMeters)}
      />

      {/* Schedule section */}
      <ScheduleSection defib={defib} />

      {/* Itinéraire button */}
      <View style={styles.itineraireContainer}>
        <Button
          mode="contained"
          onPress={openNavModal}
          icon={({ size, color }) => (
            <MaterialCommunityIcons
              name="navigation-variant"
              size={size}
              color={color}
            />
          )}
          style={styles.itineraireButton}
          contentStyle={styles.itineraireButtonContent}
        >
          Itinéraire
        </Button>
      </View>

      {/* Back to list */}
      <View style={styles.backContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("DAEList")}
          icon="arrow-left"
          style={styles.backButton}
        >
          Retour à la liste
        </Button>
      </View>

      {/* Navigation app chooser modal */}
      <Portal>
        <Modal
          visible={navModalVisible}
          onDismiss={closeNavModal}
          contentContainerStyle={modalStyles.container}
        >
          <Text style={modalStyles.title}>Itinéraire</Text>
          <Text style={modalStyles.subtitle}>
            Quelle application souhaitez-vous utiliser ?
          </Text>

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
            <Text style={modalStyles.optionText}>
              Naviguer dans l'application
            </Text>
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
            Annuler
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  availabilityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  availabilityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  availabilityStatus: {
    fontSize: 18,
    fontWeight: "700",
  },
  availabilityLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
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
  scheduleContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleParts: {
    paddingLeft: 32,
    gap: 4,
  },
  scheduleItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleRaw: {
    paddingLeft: 32,
    fontSize: 14,
    lineHeight: 20,
  },
  itineraireContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  itineraireButton: {
    minWidth: 200,
    borderRadius: 24,
  },
  itineraireButtonContent: {
    paddingVertical: 6,
  },
  backContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  backButton: {
    minWidth: 200,
  },
});
