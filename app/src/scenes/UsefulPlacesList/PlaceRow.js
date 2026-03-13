import React, { useCallback } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { usefulPlacesActions } from "~/stores";
import { getPlaceAvailability } from "~/utils/places/getPlaceAvailability";
import {
  TYPE_ICONS,
  STATUS_COLORS,
  TYPE_I18N_KEYS,
  formatDistance,
} from "~/utils/places/constants";

export default React.memo(function PlaceRow({ place }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { status, label: availLabel } = getPlaceAvailability(
    place.horaires_std,
    place.disponible_24h,
    place.type,
    undefined,
    t,
  );

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  const icon = TYPE_ICONS[place.type] || "map-marker";
  const typeLabel = TYPE_I18N_KEYS[place.type]
    ? t(TYPE_I18N_KEYS[place.type])
    : place.type;

  const onPress = useCallback(() => {
    usefulPlacesActions.setSelectedPlace(place);
    navigation.navigate("UsefulPlaceItem");
  }, [place, navigation]);

  const distStr = formatDistance(place.distanceMeters);
  const displayName = place.nom || typeLabel;
  const displayAddress = place.adresse || place.commune || "";

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: colors.outlineVariant || colors.grey },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${typeLabel}, ${distStr}, ${availLabel}`}
      accessibilityHint={t("placeDetailsHint")}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {distStr ? (
            <Text
              style={[
                styles.distance,
                { color: colors.onSurfaceVariant || colors.grey },
              ]}
            >
              {distStr}
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.address,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
          numberOfLines={1}
        >
          {displayAddress}
        </Text>
        <View style={styles.statusRow}>
          <Text
            style={[
              styles.typeTag,
              {
                color: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            {typeLabel}
          </Text>
          <View style={styles.statusRight}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {availLabel}
            </Text>
          </View>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.onSurfaceVariant || colors.grey}
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 13,
  },
  address: {
    fontSize: 13,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 6,
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
  },
  typeTag: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: "600",
  },
});
