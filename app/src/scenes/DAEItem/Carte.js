import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
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

import Text from "~/components/Text";
import IconTouchTarget from "~/components/IconTouchTarget";
import { useTheme } from "~/theme";
import { useDefibsState, useNetworkState } from "~/stores";
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
import RoutingSteps from "~/scenes/AlertCurMap/RoutingSteps";
import MapHeadRouting from "~/scenes/AlertCurMap/MapHeadRouting";

import {
  STATE_CALCULATING_INIT,
  STATE_CALCULATING_LOADED,
  STATE_CALCULATING_LOADING,
} from "~/scenes/AlertCurMap/constants";


export default React.memo(function DAEItemCarte() {
  const { colors } = useTheme();
  const { selectedDefib: defib } = useDefibsState(["selectedDefib"]);
  const { hasInternetConnection } = useNetworkState(["hasInternetConnection"]);
  const { coords, isLastKnown, lastKnownTimestamp } = useLocation();

  const hasUserCoords =
    coords && coords.latitude !== null && coords.longitude !== null;
  const hasDefibCoords = defib && defib.latitude && defib.longitude;

  const userCoords = useMemo(
    () =>
      hasUserCoords
        ? { latitude: coords.latitude, longitude: coords.longitude }
        : null,
    [hasUserCoords, coords],
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

  const defaultProfile = "foot";
  const [profile, setProfile] = useState(defaultProfile);

  // Compute route
  useEffect(() => {
    if (!hasUserCoords || !hasDefibCoords || !hasInternetConnection) {
      return;
    }

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
        const origin = `${coords.longitude},${coords.latitude}`;
        const target = `${defib.longitude},${defib.latitude}`;
        const osrmUrl = osmProfileUrl[profile] || osmProfileUrl.foot;
        const url = `${osrmUrl}/route/v1/${profile}/${origin};${target}?overview=full&steps=true`;

        const res = await fetch(url, { signal: controller.signal });
        const result = await res.json();

        if (result.routes && result.routes.length > 0) {
          const fetchedRoute = result.routes[0];
          const decoded = polyline
            .decode(fetchedRoute.geometry)
            .map((p) => p.reverse());
          setRouteCoords(decoded);
          setRoute(fetchedRoute);
          setCalculating(STATE_CALCULATING_LOADED);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Route calculation failed:", err.message);
          setRouteError(err);
        }
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();

    return () => {
      controller.abort();
    };
  }, [
    hasUserCoords,
    hasDefibCoords,
    hasInternetConnection,
    coords,
    defib,
    profile,
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
    if (!route) return defib?.nom || "";
    const { legs } = route;
    const lastLeg = legs[legs.length - 1];
    if (!lastLeg) return defib?.nom || "";
    const { steps } = lastLeg;
    const lastStep = steps[steps.length - 1];
    return lastStep?.name || defib?.nom || "";
  }, [route, defib]);

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
    if (!stepperIsOpened) {
      setStepperIsOpened(true);
    }
    setA11yFocusAfterInteractions(routingSheetTitleA11yRef);
    announceForA11yIfScreenReaderEnabled("Liste des étapes ouverte");
  }, [stepperIsOpened]);

  const stepperOnClose = useCallback(() => {
    if (stepperIsOpened) {
      setStepperIsOpened(false);
    }
    announceForA11yIfScreenReaderEnabled("Liste des étapes fermée");
    setA11yFocusAfterInteractions(lastStepsTriggerRef);
  }, [stepperIsOpened]);

  // Defib marker GeoJSON
  const defibGeoJSON = useMemo(() => {
    if (!hasDefibCoords) return null;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [defib.longitude, defib.latitude],
          },
          properties: {
            id: defib.id,
            nom: defib.nom || "Défibrillateur",
          },
        },
      ],
    };
  }, [defib, hasDefibCoords]);

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

  if (!defib) return null;

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
            Hors ligne — l'itinéraire n'est pas disponible
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
        <View style={{ flex: 1 }}>
          {/* A11y entry point for routing steps */}
          <IconTouchTarget
            ref={a11yStepsEntryRef}
            accessibilityLabel="Ouvrir la liste des étapes de l'itinéraire"
            accessibilityHint="Affiche la destination, la distance, la durée et toutes les étapes sans utiliser la carte."
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

            <Maplibre.Images images={{ dae: markerDae }} />

            {/* Defib marker */}
            {defibGeoJSON && (
              <Maplibre.ShapeSource id="defibItemSource" shape={defibGeoJSON}>
                <Maplibre.SymbolLayer
                  id="defibItemSymbol"
                  style={{
                    iconImage: "dae",
                    iconSize: 0.5,
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
                id="lastKnownLocation_daeItem"
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

      <View
        style={{
          position: "absolute",
          bottom: 38,
          left: 4,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
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
          longitude: defib?.longitude,
          latitude: defib?.latitude,
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
            Impossible de calculer l'itinéraire
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
