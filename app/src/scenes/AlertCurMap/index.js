import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { StyleSheet, View, AppState } from "react-native";
import cloneDeep from "lodash.clonedeep";
import Maplibre from "@maplibre/maplibre-react-native";
import polyline from "@mapbox/polyline";
import { getDistance } from "geolib";
import { routeToInstructions } from "~/lib/geo/osrmTextInstructions";
import getRouteState from "~/lib/geo/getRouteState";
import shallowCompare from "~/utils/array/shallowCompare";
import { storeLocation } from "~/location/storage";
import useLocation from "~/hooks/useLocation";

import withConnectivity from "~/hoc/withConnectivity";
import useShallowMemo from "~/hooks/useShallowMemo";
import useShallowEffect from "~/hooks/useShallowEffect";
import Drawer from "react-native-drawer";

import { point, lineString } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import lineSlice from "@turf/line-slice";
import length from "@turf/length";

import { useAlertState } from "~/stores";

import Camera from "~/containers/Map/Camera";
import MapView from "~/containers/Map/MapView";
import FeatureImages from "~/containers/Map/FeatureImages";
import ShapePoints from "~/containers/Map/ShapePoints";
import SelectedFeatureBubble from "~/containers/Map/SelectedFeatureBubble";
import LastKnownLocationMarker from "~/containers/Map/LastKnownLocationMarker";
import MapLinksPopup from "~/containers/MapLinksPopup";

import ControlButtons from "./ControlButtons";
import MapHeadRouting from "./MapHeadRouting.js";

import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";
import IconTouchTarget from "~/components/IconTouchTarget";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "~/theme";

import useFeatures from "./useFeatures";

import useOnRegionDidChange from "./useOnRegionDidChange";
import useOnPress from "./useOnPress";
import getDestinationName from "./getDestinationName.js";

import { osmProfileUrl } from "./routing";

import RoutingSteps from "./RoutingSteps";

import {
  STATE_CALCULATING_INIT,
  STATE_CALCULATING_LOADED,
  STATE_CALCULATING_LOADING,
  STATE_CALCULATING_RELOADING,
} from "./constants";

import { BoundType } from "~/containers/Map/constants";
import useMapInit from "~/containers/Map/useMapInit";
import { deepEqual } from "fast-equals";

const compassViewPosition = 2; // 0: TopLeft, 1: TopRight, 2: BottomLeft, 3: BottomRight
const compassViewMargin = { x: 2, y: 100 };

function AlertCurMap() {
  const { colors } = useTheme();
  const [userCoords, setUserCoords] = useState({
    latitude: null,
    longitude: null,
  });
  const [isUsingLastKnown, setIsUsingLastKnown] = useState(false);

  // Use location hook for last known state and reload
  const { isLastKnown, lastKnownTimestamp, reload, coords } = useLocation();

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

  const userCoordRef = useRef();
  const onUserLocationUpdate = useCallback((location) => {
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
  }, []);

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
    initialBoundType: BoundType.NAVIGATION,
    userCoords,
  });

  const { navAlertCur } = useAlertState(["navAlertCur"]);
  const { coordinates: alertCoords } = navAlertCur.alert.location;

  const [calculating, setCalculating] = useState(STATE_CALCULATING_INIT);
  const abortControllerRef = useRef(null);
  const calculationTimeoutRef = useRef(null);

  const { alertingList } = useAlertState(["alertingList"]);

  const [driving, setDriving] = useState({});

  const defaultProfile = "car";
  const [profile, setProfile] = useState(defaultProfile);

  const fetchRoute = useCallback(
    async ({ origin, target, signal }) => {
      console.log("Calculating route ...");
      const points = [];

      points.push(origin);
      points.push(target);

      const coordinates = points.map((point) => point.join(",")).join(";");
      const osrmUrl = osmProfileUrl[profile];
      const url = `${osrmUrl}/route/v1/${profile}/${coordinates}?overview=full&steps=true`;
      const res = await fetch(url, { signal });
      const result = await res.json();

      const { routes } = result;
      const [route] = routes;
      const { geometry } = route;
      const routeCoords = polyline.decode(geometry).map((p) => p.reverse());
      return {
        route,
        routeCoords,
      };
    },
    [profile],
  );

  const calculateRoute = useCallback(
    async (origin, signal) => {
      const target = alertCoords;
      const result = await fetchRoute({ origin, target, signal });
      const { route, routeCoords } = result;
      setDriving({
        route,
        routeCoords,
        origin,
        target,
        profile,
      });
    },
    [fetchRoute, alertCoords, profile],
  );

  const prevValuesRef = useRef({
    userCoordArr: null,
    profile: null,
    alertCoords: null,
  });

  const debounceCalculation = useCallback((callback, delay) => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    calculationTimeoutRef.current = setTimeout(callback, delay);
  }, []);

  useShallowEffect(() => {
    if (
      !(
        userCoords &&
        userCoords.longitude !== null &&
        userCoords.latitude !== null
      )
    ) {
      return;
    }

    const userCoordArr = [userCoords.longitude, userCoords.latitude];
    if (
      shallowCompare(prevValuesRef.current?.userCoordArr, userCoordArr) &&
      prevValuesRef.current?.profile === profile &&
      shallowCompare(prevValuesRef.current?.alertCoords, alertCoords)
    ) {
      return; // Skip if values haven't changed
    }
    prevValuesRef.current = {
      userCoordArr,
      profile,
      alertCoords,
    };

    // Debounce the route calculation
    debounceCalculation(() => {
      // Abort any ongoing fetch operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController for this effect execution
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      const calculateRouteIfNeeded = async () => {
        if (!driving.origin || driving.profile !== profile) {
          setCalculating(STATE_CALCULATING_LOADING);
          await calculateRoute(userCoordArr, signal);
          setCalculating(STATE_CALCULATING_LOADED);
          return;
        }

        const { routeCoords } = driving;
        if (!routeCoords) {
          return;
        }

        const { origin, target } = driving;

        const routePoints = [origin, ...routeCoords, target];

        // Adjust the route to exclude passed points
        // const adjustedRoutePoints = routePoints.slice(currentIndexRef.current);

        const { isOffRoute, distanceToLine, nextIndex, snappedPoint } =
          getRouteState(userCoordArr, routePoints);
        console.log({ isOffRoute, distanceToLine });

        const hasNewTarget = !shallowCompare(alertCoords, target);
        const needRouteRecalculation = isOffRoute || hasNewTarget;

        if (needRouteRecalculation) {
          console.log("Recalculating ....");
          setCalculating(STATE_CALCULATING_RELOADING);
          await calculateRoute(userCoordArr, signal);
          setCalculating(STATE_CALCULATING_LOADED);
        } else {
          const snappedCoords = snappedPoint.geometry.coordinates;
          const remainingRoute = routePoints.slice(nextIndex + 1);

          // TODO optimize routeCoords by stripping out the points that are off route, keeping one segment previous

          setDriving({
            route: driving.route,
            routeCoords,
            remainingRoute,
            snappedCoords,
            origin: userCoordArr,
            target,
            profile,
          });
        }
      };

      calculateRouteIfNeeded().catch((error) => {
        if (error.name === "AbortError") {
          console.log("Route calculation aborted");
        } else {
          console.error("Error calculating route:", error);
          setCalculating(STATE_CALCULATING_LOADED); // Set state to loaded even on error
        }
      });
    }, 500); // 500ms debounce

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [
    userCoords,
    driving,
    calculateRoute,
    profile,
    alertCoords,
    debounceCalculation,
  ]);

  // const adaptRouteToCoords = useCallback(
  //   (route, remainingRouteWithSnapped, userCoords) => {
  //     console.log("route", route);
  //     console.log("remainingRouteWithSnapped", remainingRouteWithSnapped);
  //     console.log("userCoords", userCoords);
  //     return route.legs.flatMap((leg) => leg.steps);
  //   },
  //   [],
  // );
  const adaptRouteToCoords = useCallback(
    (route, remainingRouteWithSnapped, userCoords) => {
      // Convert remainingRouteWithSnapped to a Set for efficient lookup
      const remainingCoordsSet = new Set(
        remainingRouteWithSnapped.map(
          ([lng, lat]) => `${lat.toFixed(6)},${lng.toFixed(6)}`,
        ),
      );

      // Filter the steps based on the remaining coordinates
      const filteredSteps = route.legs.flatMap((leg) =>
        leg.steps.filter((step) => {
          // Decode the step's geometry to get its coordinates
          const stepCoords = polyline.decode(step.geometry);

          // Check if any of the step's coordinates are in remainingCoordsSet
          return stepCoords.some(([lat, lng]) => {
            const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
            return remainingCoordsSet.has(coordKey);
          });
        }),
      );

      return filteredSteps;
    },
    [],
  );

  const { snappedCoords, routeCoords, remainingRoute, route } = driving;

  const remainingRouteWithSnapped = useMemo(
    () => [
      ...(snappedCoords ? [snappedCoords] : []),
      ...(remainingRoute || routeCoords || []),
    ],
    [snappedCoords, remainingRoute, routeCoords],
  );

  const filteredRoute = useShallowMemo(() => {
    if (
      !(
        route &&
        userCoords &&
        userCoords.latitude !== null &&
        userCoords.longitude !== null
      )
    ) {
      return [];
    }
    return adaptRouteToCoords(route, remainingRouteWithSnapped, userCoords);

    // debug byPass
    // const allSteps = [];
    // for (const leg of route?.legs || []) {
    //   for (const step of leg.steps) {
    //     allSteps.push(step);
    //   }
    // }
    // return allSteps;
  }, [adaptRouteToCoords, route, remainingRouteWithSnapped, userCoords]);

  const preparedRoute = useShallowMemo(() => {
    const steps = cloneDeep(filteredRoute);
    const step = steps[0];

    if (step) {
      // Check if the step has geometry
      if (step.geometry) {
        // Decode the geometry to get the step's coordinates
        const stepCoords = polyline.decode(step.geometry).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));

        // Find the closest point on the step to the user's current location
        let closestDistance = Infinity;
        let closestIndex = 0;

        stepCoords.forEach((coord, index) => {
          const distance = getDistance(userCoords, coord);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        // Calculate the remaining distance along the step from the closest point
        let remainingDistance = 0;
        for (let i = closestIndex; i < stepCoords.length - 1; i++) {
          remainingDistance += getDistance(stepCoords[i], stepCoords[i + 1]);
        }

        // Update the step's distance
        step.distance = remainingDistance;
      } else {
        // If no geometry is available, default to the original distance
        console.warn("Step geometry is missing.");
      }
    }

    return steps;
  }, [filteredRoute, userCoords]);

  const distance = preparedRoute.reduce(
    (acc, step) => acc + (step?.distance || 0),
    0,
  );
  const duration = preparedRoute.reduce(
    (acc, step) => acc + (step?.duration || 0),
    0,
  );

  const instructions = useMemo(() => {
    return routeToInstructions(preparedRoute);
  }, [preparedRoute]);

  const { superCluster, shape } = useFeatures({
    clusterFeature,
    alertingList,
    userCoords,
    routeCoords: remainingRouteWithSnapped,
    route,
    alertCoords,
  });

  const onRegionDidChange = useOnRegionDidChange({
    mapRef,
    superCluster,
    setClusterFeature,
    userCoords,
    setDetached,
  });

  const [selectedFeature, setSelectedFeature] = useState(null);
  const closeSelected = useCallback(() => {
    setSelectedFeature(null);
  }, [setSelectedFeature]);

  const onPress = useOnPress({
    superCluster,
    cameraRef,
    setSelectedFeature,
  });

  const [stepperIsOpened, setStepperIsOpened] = useState(false);

  const routingSheetTitleA11yRef = useRef(null);
  const a11yStepsEntryRef = useRef(null);
  const mapHeadOpenRef = useRef(null);
  const mapHeadSeeAllRef = useRef(null);
  const lastStepsTriggerRef = useRef(null);

  const openStepper = useCallback(
    (triggerRef) => {
      if (triggerRef) {
        lastStepsTriggerRef.current = triggerRef;
      }
      setStepperIsOpened(true);
    },
    [setStepperIsOpened],
  );

  const closeStepper = useCallback(() => {
    setStepperIsOpened(false);
    // Pass the ref object (not `.current`) so `findNodeHandle` can safely
    // resolve the native host view.
    setA11yFocusAfterInteractions(lastStepsTriggerRef);
  }, [setStepperIsOpened]);

  const stepperOnOpen = useCallback(() => {
    if (!stepperIsOpened) {
      setStepperIsOpened(true);
    }
    setA11yFocusAfterInteractions(routingSheetTitleA11yRef);
    announceForA11yIfScreenReaderEnabled("Liste des étapes ouverte");
  }, [stepperIsOpened, setStepperIsOpened]);

  const stepperOnClose = useCallback(() => {
    if (stepperIsOpened) {
      setStepperIsOpened(false);
    }
    announceForA11yIfScreenReaderEnabled("Liste des étapes fermée");
    setA11yFocusAfterInteractions(lastStepsTriggerRef);
  }, [stepperIsOpened, setStepperIsOpened]);

  const [externalGeoIsVisible, setExternalGeoIsVisible] = useState(false);

  const destinationName = getDestinationName(driving.route);

  return (
    <View style={styles.container}>
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
        <View
          style={{
            flex: 1,
            alignItems: "stretch",
          }}
        >
          {/* A11y-first entry point to routing information (before the map in focus order) */}
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
            contentInset={contentInset}
            compassViewPosition={compassViewPosition}
            compassViewMargin={compassViewMargin}
            // onUserLocationUpdate={onUserLocationUpdate} // didn't work
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
            <ShapePoints shape={shape} onPress={onPress}>
              <Maplibre.LineLayer
                id="lineLayer"
                key="lineLayer"
                belowLayerID="points-green"
                style={layerStyles.route}
              />
            </ShapePoints>

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
                id="lastKnownLocation_cur"
              />
            ) : (
              <Maplibre.UserLocation
                visible
                showsUserHeadingIndicator
                onUpdate={onUserLocationUpdate}
              />
            )}
          </MapView>
          <MapHeadRouting
            instructions={instructions}
            distance={distance}
            openStepper={openStepper}
            openStepperTriggerRef={mapHeadOpenRef}
            seeAllStepsTriggerRef={mapHeadSeeAllRef}
            calculatingState={calculating}
          />
        </View>
        <ControlButtons
          mapRef={mapRef}
          cameraRef={cameraRef}
          refreshCamera={refreshCamera}
          boundType={boundType}
          setBoundType={setBoundType}
          userCoords={userCoords}
          setZoomLevel={setZoomLevel}
          detached={detached}
          setExternalGeoIsVisible={setExternalGeoIsVisible}
        />
      </Drawer>
      <MapLinksPopup
        isVisible={externalGeoIsVisible}
        setIsVisible={setExternalGeoIsVisible}
        options={{
          longitude: alertCoords[0],
          latitude: alertCoords[1],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  error: {
    marginHorizontal: 10,
  },
  errorText: {
    marginVertical: 10,
    fontSize: 16,
  },
  errorButton: {
    marginVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
  },
  errorButtonIcon: {},
});

const layerStyles = {
  origin: {
    circleRadius: 5,
    circleColor: "white",
  },
  destination: {
    circleRadius: 5,
    circleColor: "white",
  },
  route: {
    lineColor: "rgba(49, 76, 205, 0.84)",
    lineCap: Maplibre.LineJoin.Round,
    lineWidth: 3,
    lineOpacity: 0.84,
  },
  progress: {
    lineColor: "#314ccd",
    lineWidth: 3,
  },
};

// AlertCurMap.whyDidYouRender = true;

export default withConnectivity(AlertCurMap, {
  keepVisible: true,
});
