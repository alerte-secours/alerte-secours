import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  AppState,
} from "react-native";

import { deepEqual } from "fast-equals";

import { useAlertState, usefulPlacesActions } from "~/stores";
import { storeLocation } from "~/location/storage";
import useLocation from "~/hooks/useLocation";

import withConnectivity from "~/hoc/withConnectivity";

import Maplibre from "@maplibre/maplibre-react-native";

import Camera from "~/containers/Map/Camera";
import MapView from "~/containers/Map/MapView";
import ShapePoints from "~/containers/Map/ShapePoints";
import FeatureImages from "~/containers/Map/FeatureImages";
import SelectedFeatureBubble from "~/containers/Map/SelectedFeatureBubble";
import LastKnownLocationMarker from "~/containers/Map/LastKnownLocationMarker";
import useMapInit from "~/containers/Map/useMapInit";
import { useTheme } from "~/theme";
import { useNavigation } from "@react-navigation/native";

import useNearbyPlaces from "~/scenes/UsefulPlacesList/useNearbyPlaces";
import useTypeFilter from "~/scenes/UsefulPlacesList/useTypeFilter";
import SettingsMenu from "~/scenes/UsefulPlacesList/SettingsMenu";

import ControlButtons from "./ControlButtons";
import useFeatures from "./useFeatures";
import useOnRegionDidChange from "./useOnRegionDidChange";
import useOnPress from "./useOnPress";
import { BoundType } from "~/containers/Map/constants";

const compassViewPosition = 1;
const compassViewMargin = { x: 10, y: 10 };

function placesToGeoJSON(places) {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: {
        type: "Point",
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        id: p.id,
        nom: p.nom || "",
        type: p.type,
      },
    })),
  };
}

function AlertAggMap() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const userCoordRef = useRef();

  const { alertingList } = useAlertState(["alertingList"]);
  const [userCoords, setUserCoords] = useState({
    latitude: null,
    longitude: null,
  });
  // Use location hook for last known state and reload
  const { isLastKnown, lastKnownTimestamp, reload, coords } = useLocation();

  const [isUsingLastKnown, setIsUsingLastKnown] = useState(false);

  // Sync with useLocation's isLastKnown
  useEffect(() => {
    if (isUsingLastKnown && !isLastKnown) {
      // If we're using last known location but useLocation indicates current location is available
      setIsUsingLastKnown(false);
    } else if (!isUsingLastKnown && isLastKnown) {
      // If useLocation indicates we should use last known location
      setIsUsingLastKnown(true);
      setUserCoords(coords);
    }
  }, [isUsingLastKnown, isLastKnown, coords]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        reload(); // Use reload from useLocation when app comes to foreground
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reload]);

  const onUserLocationUpdate = useCallback(
    (location) => {
      const { coords, timestamp } = location;
      if (!(coords.latitude && coords.longitude)) {
        return;
      }
      const newUserCoords = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      if (
        !userCoordRef.current ||
        !deepEqual(userCoordRef.current, newUserCoords)
      ) {
        userCoordRef.current = newUserCoords;
        setUserCoords(newUserCoords);
        setIsUsingLastKnown(false); // We have current location now
        // Store location for last known location feature
        storeLocation(coords, timestamp);
      }
    },
    [setUserCoords],
  );

  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState(null);

  const initialBoundType = useMemo(
    () =>
      alertingList.length > 0
        ? BoundType.TRACK_ALERTING
        : BoundType.TRACK_ALERT_RADIUS_ALL,
    [alertingList.length],
  );

  const {
    clusterFeature,
    setClusterFeature,
    mapRef,
    setDetached,
    cameraRef,
    followUserLocation,
    followUserMode,
    followPitch,
    bounds,
    zoomLevel,
    contentInset,
    boundType,
    setBoundType,
    setZoomLevel,
    detached,
    cameraKey,
    setCameraKey,
    refreshCamera,
  } = useMapInit({
    initialBoundType,
    isMapReady,
    userCoords,
  });

  const { superCluster, shape } = useFeatures({
    clusterFeature,
    alertingList,
    userCoords,
  });

  const onRegionDidChange = useOnRegionDidChange({
    mapRef,
    superCluster,
    setClusterFeature,
    userCoords,
    setDetached,
  });

  // ── Useful places ──────────────────────────────────────────────────
  const { visibleTypes, toggle } = useTypeFilter("alertAgg");
  const { places: allPlaces } = useNearbyPlaces();

  const filteredPlaces = useMemo(
    () => allPlaces.filter((p) => visibleTypes.includes(p.type)),
    [allPlaces, visibleTypes],
  );

  const placesGeoJSON = useMemo(
    () => placesToGeoJSON(filteredPlaces),
    [filteredPlaces],
  );

  const onPlacePress = useCallback(
    (e) => {
      const feature = e?.features?.[0];
      if (!feature) return;
      const placeId = feature.properties?.id;
      const place = filteredPlaces.find((p) => p.id === placeId);
      if (place) {
        usefulPlacesActions.setSelectedPlace(place);
        navigation.navigate("UsefulPlaceItem");
      }
    },
    [filteredPlaces, navigation],
  );

  const [selectedFeature, setSelectedFeature] = useState(null);
  const closeSelected = useCallback(() => {
    setSelectedFeature(null);
  }, []);

  const onPress = useOnPress({
    superCluster,
    cameraRef,
    setSelectedFeature,
  });

  const onMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  const onMapError = useCallback((err) => {
    console.error("Map error:", err);
    setError("An error occurred while loading the map.");
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isMapReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      <MapView
        mapRef={mapRef}
        onRegionDidChange={onRegionDidChange}
        contentInset={contentInset}
        compassViewPosition={compassViewPosition}
        compassViewMargin={compassViewMargin}
        onMapReady={onMapReady}
        onError={onMapError}
      >
        <Camera
          cameraKey={cameraKey}
          setCameraKey={setCameraKey}
          refreshCamera={refreshCamera}
          cameraRef={cameraRef}
          followUserLocation={followUserLocation}
          followUserMode={followUserMode}
          followPitch={followPitch}
          zoomLevel={zoomLevel}
          bounds={bounds}
          detached={detached}
          compassViewPosition={compassViewPosition}
        />
        <FeatureImages />
        <ShapePoints shape={shape} onPress={onPress} />

        {/* Useful places markers */}
        {placesGeoJSON.features.length > 0 && (
          <Maplibre.ShapeSource
            id="alertAggPlacesSource"
            shape={placesGeoJSON}
            onPress={onPlacePress}
          >
            <Maplibre.SymbolLayer
              id="alertAggPlacesDaeLayer"
              filter={["==", ["get", "type"], "dae"]}
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
            <Maplibre.SymbolLayer
              id="alertAggPlacesIconLayer"
              filter={["!=", ["get", "type"], "dae"]}
              style={{
                iconImage: ["get", "type"],
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

        {selectedFeature && (
          <SelectedFeatureBubble
            feature={selectedFeature}
            close={closeSelected}
          />
        )}
        {isUsingLastKnown && userCoords.latitude && userCoords.longitude ? (
          <LastKnownLocationMarker
            coordinates={userCoords}
            timestamp={lastKnownTimestamp}
            id="lastKnownLocation_agg"
          />
        ) : (
          <Maplibre.UserLocation
            visible
            showsUserHeadingIndicator
            onUpdate={onUserLocationUpdate}
          />
        )}
      </MapView>
      <SettingsMenu
        visibleTypes={visibleTypes}
        onToggle={toggle}
        floating
        showUpdateSection={false}
      />
      <ControlButtons
        mapRef={mapRef}
        cameraRef={cameraRef}
        refreshCamera={refreshCamera}
        boundType={boundType}
        setBoundType={setBoundType}
        userCoords={userCoords}
        setZoomLevel={setZoomLevel}
        detached={detached}
      />
    </View>
  );
}

export default withConnectivity(AlertAggMap, {
  keepVisible: true,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});
