import React, { useEffect, useState } from "react";
import * as Maplibre from "@maplibre/maplibre-react-native";
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
    // bounds: { ne: [lng, lat], sw: [lng, lat] } → [west, south, east, north]
    cameraRef.current.fitBounds(
      [bounds.sw[0], bounds.sw[1], bounds.ne[0], bounds.ne[1]],
      {
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        duration: 300,
      },
    );
  }, [bounds, cameraRef]);

  // Only enable user tracking if:
  // 1. We have permission
  // 2. followUserLocation is explicitly enabled
  // 3. We have a valid mode
  const trackUserLocation =
    hasPermission && followUserLocation && followUserMode != null
      ? followUserMode
      : undefined;

  return (
    <Maplibre.Camera
      key={cameraKey}
      // triggerKey={cameraKey} // doesn't seem to work, using key instead
      ref={cameraRef}
      duration={ANIMATION_DURATION}
      easing={ANIMATION_MODE}
      padding={{
        left: 15,
        right: 15,
        top: 5,
        bottom: 5,
      }}
      trackUserLocation={trackUserLocation}
      // Only drive zoom/pitch while tracking (v10 followZoomLevel/followPitch
      // semantics); otherwise let fitBounds/user interactions own the camera.
      pitch={trackUserLocation ? followPitch : undefined}
      zoom={trackUserLocation ? zoomLevel : undefined}
      maxZoom={MAPS_MAX_ZOOM_LEVEL}
      minZoom={MAPS_MIN_ZOOM_LEVEL}
    />
  );
}
