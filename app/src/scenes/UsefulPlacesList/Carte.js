import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
import Maplibre from "@maplibre/maplibre-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import MapView from "~/containers/Map/MapView";
import Camera from "~/containers/Map/Camera";
import LastKnownLocationMarker from "~/containers/Map/LastKnownLocationMarker";
import { DEFAULT_ZOOM_LEVEL } from "~/containers/Map/constants";
import StepZoomButtonGroup from "~/containers/Map/StepZoomButtonGroup";

import Text from "~/components/Text";
import { useTheme } from "~/theme";
import { usefulPlacesActions } from "~/stores";

import useRadarData from "~/hooks/useRadarData";

import markerDae from "~/assets/img/marker-dae.png";
import markerPolice from "~/assets/img/marker-police.png";
import markerGendarmerie from "~/assets/img/marker-gendarmerie.png";
import markerUrgences from "~/assets/img/marker-urgence.png";
import markerHopital from "~/assets/img/marker-hopital.png";
import markerAngela from "~/assets/img/marker-angela.png";

import useNearbyPlaces from "./useNearbyPlaces";
import useTypeFilter from "./useTypeFilter";
import SettingsMenu from "./SettingsMenu";
import { LoadingView, EmptyNoLocation } from "./EmptyStates";

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

function RadarBanner() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data: radarData, isLoading, error, fetchRadarData } = useRadarData();

  useEffect(() => {
    fetchRadarData();
  }, [fetchRadarData]);

  const count = radarData?.count;

  let content;
  if (isLoading) {
    content = (
      <Text style={[styles.radarText, { color: colors.onSurfaceVariant }]}>
        {t("radarBannerLoading")}
      </Text>
    );
  } else if (error) {
    content = (
      <Text style={[styles.radarText, { color: colors.error || "#F44336" }]}>
        {t("radarBannerError")}
      </Text>
    );
  } else if (typeof count === "number") {
    const label =
      count === 0
        ? t("radarZeroUsers")
        : count === 1
        ? t("radarOneUser")
        : t("radarMultipleUsers", { count });
    content = (
      <Text style={[styles.radarText, { color: colors.onSurface }]}>
        {label}
      </Text>
    );
  } else {
    return null;
  }

  return (
    <View
      style={[styles.radarBanner, { backgroundColor: colors.surfaceVariant }]}
    >
      <MaterialCommunityIcons name="radar" size={18} color={colors.primary} />
      {content}
    </View>
  );
}

export default React.memo(function UsefulPlacesCarte() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { visibleTypes, toggle } = useTypeFilter("map");
  const {
    places: allPlaces,
    loading,
    noLocation,
    hasLocation,
    isLastKnown,
    lastKnownTimestamp,
    coords,
  } = useNearbyPlaces();

  const places = useMemo(
    () => allPlaces.filter((p) => visibleTypes.includes(p.type)),
    [allPlaces, visibleTypes],
  );

  const mapRef = useRef();
  const cameraRef = useRef();
  const [cameraKey, setCameraKey] = useState(Date.now());

  const refreshCamera = useCallback(() => {
    setCameraKey(Date.now());
  }, []);

  const hasCoords =
    coords && coords.latitude !== null && coords.longitude !== null;

  const followUserLocation = true;
  const followUserMode = Maplibre.UserTrackingMode.Follow;
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);

  const geoJSON = useMemo(() => placesToGeoJSON(places), [places]);

  const onMarkerPress = useCallback(
    (e) => {
      const feature = e?.features?.[0];
      if (!feature) return;

      const placeId = feature.properties?.id;
      const place = places.find((p) => p.id === placeId);
      if (place) {
        usefulPlacesActions.setSelectedPlace(place);
        navigation.navigate("UsefulPlaceItem");
      }
    },
    [places, navigation],
  );

  if (noLocation && !hasLocation) {
    return <EmptyNoLocation messageKey="locationEnableMap" />;
  }

  if (!hasLocation && allPlaces.length === 0 && !hasCoords) {
    return <LoadingView message={t("searchingLocation")} />;
  }

  if (loading && allPlaces.length === 0 && !hasCoords) {
    return <LoadingView message={t("loadingNearbyPlaces")} />;
  }

  return (
    <View style={styles.container}>
      <RadarBanner />
      <View style={styles.mapContainer}>
        <SettingsMenu visibleTypes={visibleTypes} onToggle={toggle} floating />
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

          <Maplibre.Images
            images={{
              dae: markerDae,
              police: markerPolice,
              gendarmerie: markerGendarmerie,
              urgences: markerUrgences,
              hopital: markerHopital,
              angela: markerAngela,
            }}
          />

          {geoJSON.features.length > 0 && (
            <Maplibre.ShapeSource
              id="placesSource"
              shape={geoJSON}
              onPress={onMarkerPress}
            >
              {/* DAE places: marker icon */}
              <Maplibre.SymbolLayer
                id="placesDaeLayer"
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
              {/* Other place types: marker icons */}
              <Maplibre.SymbolLayer
                id="placesIconLayer"
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

          {isLastKnown && hasCoords ? (
            <LastKnownLocationMarker
              coordinates={coords}
              timestamp={lastKnownTimestamp}
              id="lastKnownLocation_usefulPlaces"
            />
          ) : (
            <Maplibre.UserLocation visible showsUserHeadingIndicator />
          )}
        </MapView>
        <StepZoomButtonGroup mapRef={mapRef} setZoomLevel={setZoomLevel} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  radarBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  radarText: {
    fontSize: 13,
    flex: 1,
  },
});
