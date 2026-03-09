import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { View, StyleSheet } from "react-native";
import Maplibre from "@maplibre/maplibre-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import MapView from "~/containers/Map/MapView";
import Camera from "~/containers/Map/Camera";
import LastKnownLocationMarker from "~/containers/Map/LastKnownLocationMarker";
import { BoundType, DEFAULT_ZOOM_LEVEL } from "~/containers/Map/constants";
import StepZoomButtonGroup from "~/containers/Map/StepZoomButtonGroup";

import Text from "~/components/Text";
import Loader from "~/components/Loader";
import { useTheme } from "~/theme";
import { defibsActions } from "~/stores";

import markerDae from "~/assets/img/marker-dae.png";

import useNearbyDefibs from "./useNearbyDefibs";

function defibsToGeoJSON(defibs) {
  return {
    type: "FeatureCollection",
    features: defibs.map((d) => {
      return {
        type: "Feature",
        id: d.id,
        geometry: {
          type: "Point",
          coordinates: [d.longitude, d.latitude],
        },
        properties: {
          id: d.id,
          nom: d.nom || "Défibrillateur",
        },
      };
    }),
  };
}

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
        Activez la géolocalisation pour afficher les défibrillateurs sur la
        carte.
      </Text>
    </View>
  );
}

export default React.memo(function DAEListCarte() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const {
    defibs,
    loading,
    noLocation,
    hasLocation,
    isLastKnown,
    lastKnownTimestamp,
    coords,
  } = useNearbyDefibs();

  const mapRef = useRef();
  const cameraRef = useRef();
  const [cameraKey, setCameraKey] = useState(1);

  const refreshCamera = useCallback(() => {
    setCameraKey(`${Date.now()}`);
  }, []);

  const hasCoords =
    coords && coords.latitude !== null && coords.longitude !== null;

  // Camera state — simple follow user
  const [followUserLocation] = useState(true);
  const [followUserMode] = useState(Maplibre.UserTrackingMode.Follow);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);

  const geoJSON = useMemo(() => defibsToGeoJSON(defibs), [defibs]);

  const onMarkerPress = useCallback(
    (e) => {
      const feature = e?.features?.[0];
      if (!feature) return;

      const defibId = feature.properties?.id;
      const defib = defibs.find((d) => d.id === defibId);
      if (defib) {
        defibsActions.setSelectedDefib(defib);
        navigation.navigate("DAEItem");
      }
    },
    [defibs, navigation],
  );

  if (noLocation && !hasLocation) {
    return <EmptyNoLocation />;
  }

  // Waiting for location
  if (!hasLocation && defibs.length === 0 && !hasCoords) {
    return <LoadingView message="Recherche de votre position…" />;
  }

  // Loading defibs from database
  if (loading && defibs.length === 0 && !hasCoords) {
    return (
      <LoadingView message="Chargement des défibrillateurs à proximité…" />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        mapRef={mapRef}
        compassViewPosition={1}
        compassViewMargin={{ x: 10, y: 10 }}
      >
        <Camera
          cameraKey={cameraKey}
          setCameraKey={setCameraKey}
          refreshCamera={refreshCamera}
          cameraRef={cameraRef}
          followUserLocation={followUserLocation}
          followUserMode={followUserMode}
          followPitch={0}
          zoomLevel={zoomLevel}
          bounds={null}
          detached={false}
        />

        <Maplibre.Images images={{ dae: markerDae }} />

        {geoJSON.features.length > 0 && (
          <Maplibre.ShapeSource
            id="defibSource"
            shape={geoJSON}
            onPress={onMarkerPress}
          >
            <Maplibre.SymbolLayer
              id="defibSymbolLayer"
              style={{
                iconImage: "dae",
                iconSize: 0.5,
                iconAllowOverlap: true,
                textField: ["get", "nom"],
                textSize: 11,
                textOffset: [0, 1.5],
                textAnchor: "top",
                textMaxWidth: 12,
                textColor: colors.onSurface,
                textHaloColor: colors.surface,
                textHaloWidth: 1,
                textOptional: true,
              }}
            />
          </Maplibre.ShapeSource>
        )}

        {isLastKnown && hasCoords ? (
          <LastKnownLocationMarker
            coordinates={coords}
            timestamp={lastKnownTimestamp}
            id="lastKnownLocation_daeList"
          />
        ) : (
          <Maplibre.UserLocation visible showsUserHeadingIndicator />
        )}
      </MapView>
      <StepZoomButtonGroup mapRef={mapRef} setZoomLevel={setZoomLevel} />
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
