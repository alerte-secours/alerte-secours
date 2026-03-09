import { useState } from "react";
import { getDistance } from "geolib";
import Supercluster from "supercluster";
import useShallowMemo from "~/hooks/useShallowMemo";
import useShallowEffect from "~/hooks/useShallowEffect";
import { deepEqual } from "fast-equals";
import { useDefibsState } from "~/stores";
import { getDefibAvailability } from "~/utils/dae/getDefibAvailability";

export default function useFeatures({
  clusterFeature,
  alertingList,
  userCoords,
  routeCoords,
  route,
  alertCoords,
}) {
  const { showDefibsOnAlertMap, corridorDefibs } = useDefibsState([
    "showDefibsOnAlertMap",
    "corridorDefibs",
  ]);

  // Check if we have valid coordinates
  const hasUserCoords =
    userCoords && userCoords.longitude !== null && userCoords.latitude !== null;

  const list = useShallowMemo(() => {
    const computedList = alertingList.map((row) => {
      const { oneAlert } = row;
      const { coordinates: alertCoords } = oneAlert.location;

      const [longitude, latitude] = alertCoords;
      let distance;
      if (longitude && latitude && hasUserCoords) {
        distance = getDistance(
          { longitude, latitude },
          {
            longitude: userCoords.longitude,
            latitude: userCoords.latitude,
          },
        );
      }
      return { ...row, alert: { ...oneAlert, distance } };
    });

    return computedList;
  }, [alertingList, userCoords, hasUserCoords]);

  const featureCollection = useShallowMemo(() => {
    const features = list.map((row) => {
      const { alert } = row;
      const { level, state } = alert;
      const [longitude, latitude] = alert.location.coordinates;
      const coordinates = [longitude, latitude];
      const id = `alert:${alert.id}`;
      const icon = state === "open" ? level : `${level}Disabled`;
      return {
        type: "Feature",
        id,
        properties: {
          id,
          level,
          icon,
          alert,
          coordinates,
        },
        geometry: {
          type: "Point",
          coordinates,
        },
      };
    });

    // Add initial location marker if locations are different
    list.forEach((row) => {
      const { alert } = row;
      if (
        alert.initialLocation &&
        alert.location &&
        !deepEqual(alert.initialLocation, alert.location)
      ) {
        const [longitude, latitude] = alert.initialLocation.coordinates;
        const coordinates = [longitude, latitude];
        const id = `alert:${alert.id}:initial`;

        features.push({
          type: "Feature",
          id,
          properties: {
            id,
            icon: "origin",
            level: alert.level,
            alert,
            coordinates,
            isInitialLocation: true,
          },
          geometry: {
            type: "Point",
            coordinates,
          },
        });
      }
    });

    // Add defibs (DAE) as separate, non-clustered features
    if (showDefibsOnAlertMap && Array.isArray(corridorDefibs)) {
      corridorDefibs.forEach((defib) => {
        const lon = defib.longitude;
        const lat = defib.latitude;
        if (
          lon === null ||
          lat === null ||
          lon === undefined ||
          lat === undefined
        ) {
          return;
        }
        const { status } = getDefibAvailability(
          defib.horaires_std,
          defib.disponible_24h,
        );
        // Only show available defibs on the alert navigation map
        if (status !== "open") {
          return;
        }
        const id = `defib:${defib.id}`;

        features.push({
          type: "Feature",
          id,
          properties: {
            id,
            defib,
            isDefib: true,
          },
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
        });
      });
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [list, showDefibsOnAlertMap, corridorDefibs]);

  const superCluster = useShallowMemo(() => {
    const cluster = new Supercluster({ radius: 40, maxZoom: 16 });
    // Do not cluster defibs in v1
    const clusterable = featureCollection.features.filter(
      (f) => !f?.properties?.isDefib,
    );
    cluster.load(clusterable);
    return cluster;
  }, [featureCollection.features]);
  // console.log({ superCluster: JSON.stringify(superCluster) });

  const [shape, setShape] = useState({
    type: "FeatureCollection",
    features: clusterFeature,
  });

  useShallowEffect(() => {
    // Early return if no user coordinates
    if (!hasUserCoords) {
      setShape({ type: "FeatureCollection", features: clusterFeature });
      return;
    }

    const userCoordinates = [userCoords.longitude, userCoords.latitude];
    const features = [...clusterFeature];

    // Ensure defibs are always present even if they are not part of the clustered set
    if (showDefibsOnAlertMap && Array.isArray(featureCollection.features)) {
      featureCollection.features.forEach((f) => {
        if (f?.properties?.isDefib) {
          features.push(f);
        }
      });
    }

    // Only add route line if we have valid route data
    const isRouteEnding = route?.distance !== 0 || routeCoords?.length === 0;
    const hasValidAlertCoords =
      Array.isArray(alertCoords) && alertCoords.length === 2;

    if (isRouteEnding) {
      const lineCoordinates = [userCoordinates];

      // Add route coordinates if available
      if (Array.isArray(routeCoords) && routeCoords.length > 0) {
        lineCoordinates.push(...routeCoords);
      }

      // Add alert coordinates if valid
      if (hasValidAlertCoords) {
        lineCoordinates.push(alertCoords);
      }

      const lineString = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: lineCoordinates,
        },
      };
      features.push(lineString);
    }

    // console.log("features", JSON.stringify(features));
    setShape({ type: "FeatureCollection", features });
  }, [
    setShape,
    clusterFeature,
    featureCollection.features,
    showDefibsOnAlertMap,
    userCoords,
    hasUserCoords,
    routeCoords,
    alertCoords,
    route?.distance,
  ]);

  return { superCluster, shape };
}
