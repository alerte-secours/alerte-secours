import React, { useEffect, useState } from "react";
import Maplibre from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";

import {
  ANIMATION_DURATION,
  ANIMATION_MODE,
  MAPS_MAX_ZOOM_LEVEL,
  MAPS_MIN_ZOOM_LEVEL,
} from "./constants";

export default function Camera({
  followUserLocation,
  followUserMode,
  followPitch,
  zoomLevel,
  cameraRef,
  cameraKey,
  setCameraKey,
  refreshCamera,
  bounds,
  detached,
  compassViewPosition,
}) {
  const [hasPermission, setHasPermission] = useState(false);

  // Check location permissions
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasPermission(status === "granted");
      } catch (error) {
        console.error("Error checking location permission:", error);
        setHasPermission(false);
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    refreshCamera();
  }, [
    followUserLocation,
    followUserMode,
    followPitch,
    // zoomLevel,
    refreshCamera,
  ]);

  useEffect(() => {
    if (!cameraRef.current || !bounds) {
      return;
    }
    cameraRef.current.fitBounds(bounds.ne, bounds.sw, 20, 300);
  }, [bounds, cameraRef]);

  // Only enable followUserLocation if:
  // 1. We have permission
  // 2. followUserLocation is explicitly enabled
  // 3. We have a valid mode (not None)
  // 4. Mode is defined
  const safeFollowUserLocation =
    hasPermission &&
    followUserLocation &&
    followUserMode != null &&
    followUserMode !== Maplibre.UserTrackingMode.None;

  return (
    <Maplibre.Camera
      key={cameraKey}
      // triggerKey={cameraKey} // doesn't seem to work, using key instead
      ref={cameraRef}
      animationDuration={ANIMATION_DURATION}
      animationMode={ANIMATION_MODE}
      padding={{
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 5,
        paddingBottom: 5,
      }}
      followUserLocation={safeFollowUserLocation}
      followUserMode={followUserMode}
      followHeading={compassViewPosition} // 0: TopLeft, 1: TopRight, 2: BottomLeft, 3: BottomRight
      followPitch={followPitch}
      followZoomLevel={zoomLevel}
      // zoomLevel={zoomLevel}
      maxZoomLevel={MAPS_MAX_ZOOM_LEVEL}
      minZoomLevel={MAPS_MIN_ZOOM_LEVEL}
    />
  );
}
