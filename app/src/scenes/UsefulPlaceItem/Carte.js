import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Maplibre from "@maplibre/maplibre-react-native";
import polyline from "@mapbox/polyline";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Drawer from "react-native-drawer";

import MapView from "~/containers/Map/MapView";
import Camera from "~/containers/Map/Camera";
import LastKnownLocationMarker from "~/containers/Map/LastKnownLocationMarker";
import { BoundType } from "~/containers/Map/constants";
import StepZoomButtonGroup from "~/containers/Map/StepZoomButtonGroup";
import useMapInit from "~/containers/Map/useMapInit";
import TargetButton from "~/containers/Map/TargetButton";
import ToggleColorSchemeButton from "~/containers/Map/ToggleColorSchemeButton";
import MapLinksPopupIconButton from "~/containers/MapLinksPopup/IconButton";
import MapLinksPopup from "~/containers/MapLinksPopup";

import { useTranslation } from "react-i18next";

import Text from "~/components/Text";
import IconTouchTarget from "~/components/IconTouchTarget";
import { useTheme } from "~/theme";
import { useUsefulPlacesState, useNetworkState } from "~/stores";
import useLocation from "~/hooks/useLocation";
import {
  osmProfileUrl,
  profileDefaultModes,
} from "~/scenes/AlertCurMap/routing";
import { routeToInstructions } from "~/lib/geo/osrmTextInstructions";
import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";

import markerDae from "~/assets/img/marker-dae.png";
import markerPolice from "~/assets/img/marker-police.png";
import markerGendarmerie from "~/assets/img/marker-gendarmerie.png";
import markerUrgences from "~/assets/img/marker-urgence.png";
import markerHopital from "~/assets/img/marker-hopital.png";
import markerAngela from "~/assets/img/marker-angela.png";
import RoutingSteps from "~/scenes/AlertCurMap/RoutingSteps";
import MapHeadRouting from "~/scenes/AlertCurMap/MapHeadRouting";

import {
  STATE_CALCULATING_INIT,
  STATE_CALCULATING_LOADED,
  STATE_CALCULATING_LOADING,
} from "~/utils/routing/constants";
export default React.memo(function UsefulPlaceItemCarte() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { selectedPlace: place } = useUsefulPlacesState(["selectedPlace"]);
  const { hasInternetConnection } = useNetworkState(["hasInternetConnection"]);
  const { coords, isLastKnown, lastKnownTimestamp } = useLocation();

  const hasUserCoords =
    coords && coords.latitude !== null && coords.longitude !== null;
  const hasPlaceCoords =
    place && place.latitude != null && place.longitude != null;

  const userLat = coords?.latitude ?? null;
  const userLon = coords?.longitude ?? null;
  const placeLat = place?.latitude ?? null;
  const placeLon = place?.longitude ?? null;

  const userCoords = useMemo(
    () => (hasUserCoords ? { latitude: userLat, longitude: userLon } : null),
    [hasUserCoords, userLat, userLon],
  );

  const {
    mapRef,
    cameraRef,
    setDetached,
    followUserLocation,
    followUserMode,
    followPitch,
    zoomLevel,
    boundType,
    setBoundType,
    setZoomLevel,
    detached,
    cameraKey,
    setCameraKey,
    refreshCamera,
  } = useMapInit({
    initialBoundType: BoundType.NAVIGATION,
    userCoords,
  });

  const abortControllerRef = useRef(null);
  const routeTimerRef = useRef(null);
  const lastRouteCoordsRef = useRef(null);

  // Minimum distance (meters) the user must move before re-fetching the route
  const ROUTE_REFETCH_THRESHOLD_M = 50;

  const onRegionDidChange = useCallback(
    (event) => {
      const { isUserInteraction } = event.properties;
      if (isUserInteraction) {
        setDetached(true);
      }
    },
    [setDetached],
  );

  const [externalGeoIsVisible, setExternalGeoIsVisible] = useState(false);

  const [routeCoords, setRouteCoords] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [route, setRoute] = useState(null);
  const [calculating, setCalculating] = useState(STATE_CALCULATING_INIT);
  const [routeRetry, setRouteRetry] = useState(0);
  const prevRouteRetryRef = useRef(routeRetry);

  const defaultProfile = "foot";
  const [profile, setProfile] = useState(defaultProfile);

  // Reset route state when place changes to avoid showing stale route
  useEffect(() => {
    setRouteCoords(null);
    setRoute(null);
    setRouteError(null);
    setCalculating(STATE_CALCULATING_INIT);
    lastRouteCoordsRef.current = null;
  }, [placeLat, placeLon]);

  // Compute route (debounced, with distance threshold)
  useEffect(() => {
    if (!hasUserCoords || !hasPlaceCoords || !hasInternetConnection) {
      return;
    }

    // On explicit retry, bypass the distance threshold
    const isRetry = routeRetry !== prevRouteRetryRef.current;
    prevRouteRetryRef.current = routeRetry;

    // Skip re-fetch if user hasn't moved significantly (unless explicit retry)
    if (!isRetry && lastRouteCoordsRef.current) {
      const [prevLat, prevLon] = lastRouteCoordsRef.current;
      const dlat = (userLat - prevLat) * 111_320;
      const dlon =
        (userLon - prevLon) * 111_320 * Math.cos((userLat * Math.PI) / 180);
      const moved = Math.sqrt(dlat * dlat + dlon * dlon);
      if (moved < ROUTE_REFETCH_THRESHOLD_M) return;
    }

    // Debounce: wait 2s after last coordinate change
    if (routeTimerRef.current) clearTimeout(routeTimerRef.current);

    let cancelled = false;

    routeTimerRef.current = setTimeout(() => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const fetchRoute = async () => {
        setLoadingRoute(true);
        setCalculating(STATE_CALCULATING_LOADING);
        setRouteError(null);
        try {
          const origin = `${userLon},${userLat}`;
          const target = `${placeLon},${placeLat}`;
          const osrmUrl = osmProfileUrl[profile] || osmProfileUrl.foot;
          const url = `${osrmUrl}/route/v1/${profile}/${origin};${target}?overview=full&steps=true`;

          const res = await fetch(url, { signal: controller.signal });
          const result = await res.json();

          if (!cancelled && result.routes && result.routes.length > 0) {
            const fetchedRoute = result.routes[0];
            const decoded = polyline
              .decode(fetchedRoute.geometry)
              .map(([lat, lng]) => [lng, lat]);
            setRouteCoords(decoded);
            setRoute(fetchedRoute);
            setCalculating(STATE_CALCULATING_LOADED);
            // Only update last coords after a successful fetch
            lastRouteCoordsRef.current = [userLat, userLon];
          }
        } catch (err) {
          if (!cancelled && err.name !== "AbortError") {
            console.warn("Route calculation failed:", err.message);
            setRouteError(err);
          }
        } finally {
          if (!cancelled) setLoadingRoute(false);
        }
      };

      fetchRoute();
    }, 2000); // debounce delay

    return () => {
      cancelled = true;
      if (routeTimerRef.current) clearTimeout(routeTimerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [
    hasUserCoords,
    hasPlaceCoords,
    hasInternetConnection,
    userLat,
    userLon,
    placeLat,
    placeLon,
    profile,
    routeRetry,
  ]);

  // Compute instructions from route steps
  const allSteps = useMemo(() => {
    if (!route) return [];
    return route.legs.flatMap((leg) => leg.steps);
  }, [route]);

  const instructions = useMemo(() => {
    if (allSteps.length === 0) return [];
    return routeToInstructions(allSteps);
  }, [allSteps]);

  const distance = useMemo(
    () => allSteps.reduce((acc, step) => acc + (step?.distance || 0), 0),
    [allSteps],
  );
  const duration = useMemo(
    () => allSteps.reduce((acc, step) => acc + (step?.duration || 0), 0),
    [allSteps],
  );

  const destinationName = useMemo(() => {
    if (!route) return place?.nom || "";
    const { legs } = route;
    const lastLeg = legs[legs.length - 1];
    if (!lastLeg) return place?.nom || "";
    const { steps } = lastLeg;
    const lastStep = steps[steps.length - 1];
    return lastStep?.name || place?.nom || "";
  }, [route, place]);

  // Stepper drawer state
  const [stepperIsOpened, setStepperIsOpened] = useState(false);
  const routingSheetTitleA11yRef = useRef(null);
  const a11yStepsEntryRef = useRef(null);
  const mapHeadOpenRef = useRef(null);
  const mapHeadSeeAllRef = useRef(null);
  const lastStepsTriggerRef = useRef(null);

  const openStepper = useCallback((triggerRef) => {
    if (triggerRef) {
      lastStepsTriggerRef.current = triggerRef;
    }
    setStepperIsOpened(true);
  }, []);

  const closeStepper = useCallback(() => {
    setStepperIsOpened(false);
    setA11yFocusAfterInteractions(lastStepsTriggerRef);
  }, []);

  const stepperOnOpen = useCallback(() => {
    setStepperIsOpened(true);
    setA11yFocusAfterInteractions(routingSheetTitleA11yRef);
    announceForA11yIfScreenReaderEnabled(t("routeStepsListOpened"));
  }, [t]);

  const stepperOnClose = useCallback(() => {
    setStepperIsOpened(false);
    announceForA11yIfScreenReaderEnabled(t("routeStepsListClosed"));
    setA11yFocusAfterInteractions(lastStepsTriggerRef);
  }, [t]);

  // Place marker GeoJSON
  const placeId = place?.id;
  const placeNom = place?.nom || "";
  const placeType = place?.type;
  const placeGeoJSON = useMemo(() => {
    if (!hasPlaceCoords) return null;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [placeLon, placeLat],
          },
          properties: {
            id: placeId,
            nom: placeNom,
            type: placeType,
          },
        },
      ],
    };
  }, [hasPlaceCoords, placeLat, placeLon, placeId, placeNom, placeType]);

  // Route line GeoJSON
  const routeGeoJSON = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return null;
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoords,
      },
    };
  }, [routeCoords]);

  const profileDefaultMode = profileDefaultModes[profile];

  if (!place) return null;

  return (
    <View style={styles.container}>
      {/* Offline banner */}
      {!hasInternetConnection && (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: (colors.error || "#F44336") + "15" },
          ]}
        >
          <MaterialCommunityIcons
            name="wifi-off"
            size={18}
            color={colors.error || "#F44336"}
          />
          <Text
            style={[
              styles.offlineBannerText,
              { color: colors.error || "#F44336" },
            ]}
          >
            {t("offlineRouteUnavailable")}
          </Text>
        </View>
      )}

      <Drawer
        type="overlay"
        tweenHandler={(ratio) => ({
          main: { opacity: (2 - ratio) / 2 },
        })}
        tweenDuration={250}
        openDrawerOffset={40}
        open={stepperIsOpened}
        onOpen={stepperOnOpen}
        onClose={stepperOnClose}
        tapToClose
        negotiatePan
        content={
          <RoutingSteps
            setProfile={setProfile}
            profile={profile}
            closeStepper={closeStepper}
            destinationName={destinationName}
            distance={distance}
            duration={duration}
            instructions={instructions}
            calculatingState={calculating}
            titleA11yRef={routingSheetTitleA11yRef}
          />
        }
      >
        <View style={styles.flex1}>
          {/* A11y entry point for routing steps */}
          <IconTouchTarget
            ref={a11yStepsEntryRef}
            accessibilityLabel={t("openRouteStepsLabel")}
            accessibilityHint={t("routeStepsA11yHint")}
            onPress={() => openStepper(a11yStepsEntryRef)}
            style={({ pressed }) => ({
              position: "absolute",
              top: 4,
              left: 4,
              zIndex: 10,
              backgroundColor: colors.surface,
              borderRadius: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={24}
              color={colors.onSurface}
            />
          </IconTouchTarget>

          <MapView
            mapRef={mapRef}
            onRegionDidChange={onRegionDidChange}
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
              followPitch={followPitch}
              zoomLevel={zoomLevel}
              detached={detached}
            />

            {/* Route line */}
            {routeGeoJSON && (
              <Maplibre.ShapeSource id="routeSource" shape={routeGeoJSON}>
                <Maplibre.LineLayer
                  id="routeLineLayer"
                  style={{
                    lineColor: "rgba(49, 76, 205, 0.84)",
                    lineWidth: 4,
                    lineCap: "round",
                    lineJoin: "round",
                    lineOpacity: 0.84,
                  }}
                />
              </Maplibre.ShapeSource>
            )}

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

            {/* Place marker */}
            {placeGeoJSON && (
              <Maplibre.ShapeSource id="placeItemSource" shape={placeGeoJSON}>
                <Maplibre.SymbolLayer
                  id="placeItemSymbol"
                  style={{
                    iconImage: ["get", "type"],
                    iconSize: 0.65,
                    iconAllowOverlap: true,
                    textField: ["get", "nom"],
                    textSize: 12,
                    textOffset: [0, 1.8],
                    textAnchor: "top",
                    textMaxWidth: 14,
                    textColor: colors.onSurface,
                    textHaloColor: colors.surface,
                    textHaloWidth: 1,
                  }}
                />
              </Maplibre.ShapeSource>
            )}

            {/* User location */}
            {isLastKnown && hasUserCoords ? (
              <LastKnownLocationMarker
                coordinates={coords}
                timestamp={lastKnownTimestamp}
                id="lastKnownLocation_usefulPlaceItem"
              />
            ) : (
              <Maplibre.UserLocation visible showsUserHeadingIndicator />
            )}
          </MapView>

          {/* Head routing step overlay */}
          {instructions.length > 0 && (
            <MapHeadRouting
              instructions={instructions}
              distance={distance}
              profileDefaultMode={profileDefaultMode}
              openStepper={openStepper}
              openStepperTriggerRef={mapHeadOpenRef}
              seeAllStepsTriggerRef={mapHeadSeeAllRef}
              calculatingState={calculating}
            />
          )}
        </View>
      </Drawer>

      <View style={styles.mapLinksContainer}>
        <MapLinksPopupIconButton setIsVisible={setExternalGeoIsVisible} />
      </View>
      {(detached || boundType !== BoundType.NAVIGATION) && (
        <TargetButton
          userCoords={userCoords}
          cameraRef={cameraRef}
          boundType={boundType}
          setBoundType={setBoundType}
          refreshCamera={refreshCamera}
        />
      )}
      <ToggleColorSchemeButton containerStyle={{ left: 4, bottom: 75 }} />
      <StepZoomButtonGroup
        mapRef={mapRef}
        cameraRef={cameraRef}
        setZoomLevel={setZoomLevel}
      />
      <MapLinksPopup
        isVisible={externalGeoIsVisible}
        setIsVisible={setExternalGeoIsVisible}
        options={{
          longitude: place?.longitude,
          latitude: place?.latitude,
        }}
      />

      {/* Route error */}
      {routeError && !loadingRoute && (
        <View style={styles.routeErrorOverlay}>
          <Text
            style={[
              styles.routeErrorText,
              { color: colors.onSurfaceVariant || colors.grey },
            ]}
          >
            {t("routeCalculationFailed")}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setRouteRetry((n) => n + 1)}
            style={[
              styles.routeRetryButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.routeRetryText,
                { color: colors.onPrimary || "#fff" },
              ]}
            >
              {t("retryButton")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  mapLinksContainer: {
    position: "absolute",
    bottom: 38,
    left: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 13,
    flex: 1,
  },
  routeErrorOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  routeErrorText: {
    fontSize: 13,
    textAlign: "center",
  },
  routeRetryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  routeRetryText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
