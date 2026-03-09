import React, { useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Button, Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";
import Loader from "~/components/Loader";
import { useTheme } from "~/theme";
import { defibsActions } from "~/stores";

import useNearbyDefibs from "./useNearbyDefibs";
import DefibRow from "./DefibRow";

function LoadingView({ message }) {
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

function EmptyNoLocation() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="crosshairs-off"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Localisation indisponible</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        Activez la géolocalisation pour trouver les défibrillateurs à proximité.
        Vérifiez les paramètres de localisation de votre appareil.
      </Text>
    </View>
  );
}

function EmptyError({ error, onRetry }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={56}
        color={colors.error || "#F44336"}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Erreur de chargement</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        Impossible de charger les défibrillateurs.{"\n"}
        Veuillez réessayer ultérieurement.
      </Text>
      {onRetry && (
        <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
          Réessayer
        </Button>
      )}
    </View>
  );
}

function EmptyNoResults() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="heart-pulse"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Aucun défibrillateur</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        Aucun défibrillateur trouvé dans un rayon de 10 km autour de votre
        position.
      </Text>
    </View>
  );
}

const keyExtractor = (item) => item.id;

function EmptyNoAvailable({ showUnavailable }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="heart-pulse"
        size={56}
        color={colors.onSurfaceVariant || colors.grey}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Aucun défibrillateur disponible</Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.onSurfaceVariant || colors.grey },
        ]}
      >
        Aucun défibrillateur actuellement ouvert dans un rayon de 10 km. Activez
        l'option « Afficher les indisponibles » pour voir tous les
        défibrillateurs.
      </Text>
    </View>
  );
}

function AvailabilityToggle({ showUnavailable, allCount, filteredCount }) {
  const { colors } = useTheme();
  const onToggle = useCallback(() => {
    defibsActions.setShowUnavailable(!showUnavailable);
  }, [showUnavailable]);

  const countLabel =
    !showUnavailable && allCount > filteredCount
      ? ` (${allCount - filteredCount} masqués)`
      : "";

  return (
    <View
      style={[
        styles.toggleRow,
        { borderBottomColor: colors.outlineVariant || colors.grey },
      ]}
    >
      <View style={styles.toggleLabelContainer}>
        <MaterialCommunityIcons
          name="eye-off-outline"
          size={18}
          color={colors.onSurfaceVariant || colors.grey}
        />
        <Text
          style={[
            styles.toggleLabel,
            { color: colors.onSurfaceVariant || colors.grey },
          ]}
        >
          Afficher les indisponibles{countLabel}
        </Text>
      </View>
      <Switch value={showUnavailable} onValueChange={onToggle} />
    </View>
  );
}

export default React.memo(function DAEListListe() {
  const { colors } = useTheme();
  const {
    defibs,
    allDefibs,
    loading,
    error,
    noLocation,
    hasLocation,
    reload,
    showUnavailable,
  } = useNearbyDefibs();

  const renderItem = useCallback(({ item }) => <DefibRow defib={item} />, []);

  // No location available
  if (noLocation && !hasLocation) {
    return <EmptyNoLocation />;
  }

  // Waiting for location
  if (!hasLocation && allDefibs.length === 0) {
    return <LoadingView message="Recherche de votre position…" />;
  }

  // Loading defibs from database
  if (loading && allDefibs.length === 0) {
    return (
      <LoadingView message="Chargement des défibrillateurs à proximité…" />
    );
  }

  // Error state (non-blocking if we have stale data)
  if (error && allDefibs.length === 0) {
    return <EmptyError error={error} onRetry={reload} />;
  }

  // No results at all
  if (!loading && allDefibs.length === 0 && hasLocation) {
    return <EmptyNoResults />;
  }

  // Has defibs but none available (filtered to empty)
  const showEmptyAvailable =
    !loading && defibs.length === 0 && allDefibs.length > 0 && !showUnavailable;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error && allDefibs.length > 0 && (
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
            Erreur de mise à jour — données potentiellement obsolètes
          </Text>
        </View>
      )}
      <AvailabilityToggle
        showUnavailable={showUnavailable}
        allCount={allDefibs.length}
        filteredCount={defibs.length}
      />
      {showEmptyAvailable ? (
        <EmptyNoAvailable />
      ) : (
        <FlatList
          data={defibs}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
});

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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 13,
  },
});
