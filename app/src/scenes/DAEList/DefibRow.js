import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { defibsActions } from "~/stores";
import { getDefibAvailability } from "~/utils/dae/getDefibAvailability";

function formatDistance(meters) {
  if (meters == null) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

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

function DefibRow({ defib }) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const { status, label } = getDefibAvailability(
    defib.horaires_std,
    defib.disponible_24h,
  );

  const statusColor = STATUS_COLORS[status];

  const onPress = useCallback(() => {
    defibsActions.setSelectedDefib(defib);
    navigation.navigate("DAEItem");
  }, [defib, navigation]);

  return (
    <TouchableRipple
      onPress={onPress}
      style={[
        styles.row,
        { borderBottomColor: colors.outlineVariant || colors.grey },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${defib.nom || "Défibrillateur"}, ${formatDistance(
        defib.distanceMeters,
      )}, ${label}`}
      accessibilityHint="Ouvrir le détail de ce défibrillateur"
    >
      <View style={styles.rowInner}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={STATUS_ICONS[status]}
            size={28}
            color={statusColor}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {defib.nom || "Défibrillateur"}
          </Text>
          <Text
            style={[
              styles.address,
              { color: colors.onSurfaceVariant || colors.grey },
            ]}
            numberOfLines={1}
          >
            {defib.adresse || "Adresse non renseignée"}
          </Text>
          <View style={styles.meta}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {label}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.distanceContainer}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={16}
            color={colors.onSurfaceVariant || colors.grey}
          />
          <Text
            style={[
              styles.distance,
              { color: colors.onSurfaceVariant || colors.grey },
            ]}
          >
            {formatDistance(defib.distanceMeters)}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  );
}

export default React.memo(DefibRow);

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  address: {
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  distanceContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  distance: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});
