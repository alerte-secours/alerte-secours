import { useMemo, useState, useEffect } from "react";
import { getDistance } from "geolib";
import Supercluster from "supercluster";

export default function useFeatures({
  clusterFeature,
  alertingList,
  userCoords,
}) {
  // Check if we have valid coordinates
  const hasUserCoords =
    userCoords && userCoords.longitude !== null && userCoords.latitude !== null;

  const list = useMemo(() => {
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

  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: list.map((row) => {
        const { oneAlert: alert } = row;
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
      }),
    }),
    [list],
  );

  const superCluster = useMemo(() => {
    const cluster = new Supercluster({ radius: 40, maxZoom: 16 });
    cluster.load(featureCollection.features);
    return cluster;
  }, [featureCollection.features]);
  // console.log({ superCluster: JSON.stringify(superCluster) });

  const [shape, setShape] = useState({
    type: "FeatureCollection",
    features: clusterFeature,
  });

  useEffect(() => {
    // Only add user location feature if we have valid coordinates
    const features = [...clusterFeature];
    if (hasUserCoords) {
      const userLocationFeature = {
        type: "Feature",
        properties: {
          isUserLocation: true,
        },
        geometry: {
          type: "Point",
          coordinates: [userCoords.longitude, userCoords.latitude],
        },
      };
      features.push(userLocationFeature);
    }
    setShape({ type: "FeatureCollection", features });
  }, [setShape, clusterFeature, userCoords, hasUserCoords]);

  return { superCluster, shape };
}
