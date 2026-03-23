import React, { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import Text from "~/components/Text";
import { useTheme } from "~/theme";

import { filterUnavailableDae } from "~/utils/places/filterUnavailableDae";

import useNearbyPlaces from "./useNearbyPlaces";
import useTypeFilter from "./useTypeFilter";
import useAvailabilityFilter from "./useAvailabilityFilter";
import SettingsMenu from "./SettingsMenu";
import PlaceRow from "./PlaceRow";
import { LoadingView, EmptyNoLocation } from "./EmptyStates";

function EmptyError({ onRetry }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={56}
        color={colors.error || "#F44336"}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>{t("loadError")}</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        {t("loadErrorMessage")}
      </Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
          {t("retryButton")}
        </Button>
      )}
    </View>
  );
}

function EmptyNoResults() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="map-marker-off"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>{t("noPlacesFound")}</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        {t("noPlacesFoundMessage")}
      </Text>
    </View>
  );
}

const keyExtractor = (item) => item.id;

export default React.memo(function UsefulPlacesListe() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { visibleTypes, toggle } = useTypeFilter();
  const { hideUnavailableDae, toggleHideUnavailableDae } =
    useAvailabilityFilter();
  const {
    places: allPlaces,
    loading,
    error,
    noLocation,
    hasLocation,
    reload,
  } = useNearbyPlaces();

  const places = useMemo(() => {
    let filtered = allPlaces.filter((p) => visibleTypes.includes(p.type));
    if (hideUnavailableDae) {
      filtered = filterUnavailableDae(filtered);
    }
    return filtered;
  }, [allPlaces, visibleTypes, hideUnavailableDae]);

  const renderItem = useCallback(({ item }) => <PlaceRow place={item} />, []);

  if (noLocation && !hasLocation) {
    return <EmptyNoLocation />;
  }

  if (!hasLocation && allPlaces.length === 0) {
    return <LoadingView message={t("searchingLocation")} />;
  }

  if (loading && allPlaces.length === 0) {
    return <LoadingView message={t("loadingNearbyPlaces")} />;
  }

  if (error && allPlaces.length === 0) {
    return <EmptyError onRetry={reload} />;
  }

  if (!loading && allPlaces.length === 0 && hasLocation) {
    return <EmptyNoResults />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsMenu
        visibleTypes={visibleTypes}
        onToggle={toggle}
        hideUnavailableDae={hideUnavailableDae}
        onToggleHideUnavailableDae={toggleHideUnavailableDae}
      />
      {error && allPlaces.length > 0 && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: (colors.error || "#F44336") + "15" },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={16}
            color={colors.error || "#F44336"}
          />
          <Text
            style={[
              styles.errorBannerText,
              { color: colors.error || "#F44336" },
            ]}
          >
            {t("updateErrorBanner")}
          </Text>
        </View>
      )}
      <FlatList
        data={places}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
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
  retryButton: {
    marginTop: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    flex: 1,
  },
});
