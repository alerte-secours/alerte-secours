import { useRef, useState, useEffect, useCallback } from "react";
import Maplibre from "@maplibre/maplibre-react-native";
import { getBounds } from "geolib";
import { useSessionState, getAlertState } from "~/stores";

import {
  BoundType,
  Alignments,
  FOLLOW_PITCH,
  DEFAULT_ZOOM_LEVEL,
} from "./constants";

import {
  calculateZoomLevelFromRadius,
  calculateZoomLevelFromBounds,
} from "./utils";
import useShallowEffect from "~/hooks/useShallowEffect";

export default function useMapInit({
  initialBoundType = BoundType.TRACK_ALERTING,
  userCoords = null,
} = {}) {
  const mapRef = useRef();
  const cameraRef = useRef();

  const [boundType, setBoundType] = useState(initialBoundType);
  const [clusterFeature, setClusterFeature] = useState([]);

  const [contentInset, setContentInset] = useState(Alignments.center);
  const [followUserLocation, setFollowUserLocation] = useState(false);
  const [detached, setDetached] = useState(false);
  const [followUserMode, setFollowUserMode] = useState(
    Maplibre.UserTrackingMode.FollowWithCourse,
  );

  const { radiusAll, radiusReach } = useSessionState([
    "radiusAll",
    "radiusReach",
  ]);

  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
  const [followPitch, setFollowPitch] = useState(60);
  const [bounds, setBounds] = useState(null);

  // Check if we have any user coordinates
  const hasUserCoords =
    userCoords && userCoords.latitude !== null && userCoords.longitude !== null;

  useShallowEffect(() => {
    // If we have no coordinates at all, disable following and reset camera
    if (!hasUserCoords) {
      setFollowUserLocation(false);
      setFollowUserMode(Maplibre.UserTrackingMode.None);
      setFollowPitch(0);
      setZoomLevel(DEFAULT_ZOOM_LEVEL);
      setBounds(null);
      return;
    }

    switch (boundType) {
      case BoundType.TRACK_ALERT_RADIUS_REACH:
      case BoundType.TRACK_ALERT_RADIUS_ALL: {
        let radius;
        if (boundType === BoundType.TRACK_ALERT_RADIUS_REACH) {
          radius = radiusReach;
        } else {
          radius = radiusAll;
        }
        const latlon = {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        };
        const newZoomLevel = calculateZoomLevelFromRadius(latlon, radius);

        setFollowUserMode(Maplibre.UserTrackingMode.Follow);
        setZoomLevel(newZoomLevel);
        setFollowUserLocation(true); // Let Camera handle permission check
        setFollowPitch(0);
        setContentInset(Alignments.Center);
        setBounds(null);
        break;
      }
      case BoundType.TRACK_ALERTING: {
        const { alertingList } = getAlertState();
        const allPoints = alertingList.map(
          ({
            alert: {
              location: { coordinates },
            },
          }) => {
            const [longitude, latitude] = coordinates;
            return { longitude, latitude };
          },
        );
        allPoints.push(userCoords);

        if (allPoints.length === 0) {
          setZoomLevel(DEFAULT_ZOOM_LEVEL);
          return;
        }

        const { minLat, maxLat, minLng, maxLng } = getBounds(allPoints);
        const bounds = {
          ne: { lng: maxLng, lat: maxLat },
          sw: { lng: minLng, lat: minLat },
        };
        const newZoomLevel = calculateZoomLevelFromBounds(bounds);
        setFollowUserMode(Maplibre.UserTrackingMode.Follow);
        setFollowUserLocation(false);
        setZoomLevel(newZoomLevel);
        setFollowPitch(0);
        setContentInset(Alignments.Center);
        setBounds({
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
        });
        break;
      }
      case BoundType.NAVIGATION: {
        setFollowUserLocation(true); // Let Camera handle permission check
        setFollowUserMode(Maplibre.UserTrackingMode.FollowWithCourse);
        setZoomLevel(DEFAULT_ZOOM_LEVEL);
        setFollowPitch(FOLLOW_PITCH);
        setContentInset(Alignments.Bottom);
        setBounds(null);
        break;
      }
    }
  }, [boundType, radiusAll, radiusReach, userCoords, hasUserCoords]);

  const [cameraKey, setCameraKey] = useState(1);
  const refreshCamera = useCallback(() => {
    setCameraKey(`${Date.now()}`);
    if (followUserLocation && hasUserCoords) {
      setDetached(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followPitch, followUserLocation, followUserMode, hasUserCoords]);

  return {
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
  };
}
