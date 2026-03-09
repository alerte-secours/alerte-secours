import React, { useCallback } from "react";

import { useToast } from "~/lib/toast-notifications";

import { getDistance } from "geolib";

import { pixelsToMeters } from "~/lib/geo/mapboxZoomMatrix";
import useMount from "~/hooks/useMount";

import AlertPreview from "~/containers/Map/AlertPreview";
import { HITBOX_SIZE, ANIMATION_DURATION } from "~/containers/Map/constants";

import prioritizeFeatures from "./prioritizeFeatures";

export default function useOnLongPress({
  mapRef,
  clusterFeature,
  cameraRef,
  superCluster,
  currentAlertShowingRef,
}) {
  const toast = useToast();
  useMount(() => {
    return () => {
      if (currentAlertShowingRef.current) {
        toast.hide(currentAlertShowingRef.current);
      }
    };
  });
  return useCallback(
    async (event) => {
      const { current: map } = mapRef;

      const zoomLevel = await map.getZoom();
      const hitboxMeters = pixelsToMeters({
        latitude: event.geometry.coordinates[1],
        zoomLevel,
        pixels: HITBOX_SIZE / 2,
      });
      const [eventLng, eventLat] = event.geometry.coordinates;
      const featuresAtPoint = clusterFeature.filter((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const distance = getDistance(
          { longitude, latitude },
          { longitude: eventLng, latitude: eventLat },
        );
        return distance <= hitboxMeters;
      });

      const features = prioritizeFeatures(featuresAtPoint);
      if (!features.length > 0) {
        return;
      }
      const [feature] = features;
      const { properties } = feature;

      if (properties.cluster) {
        const { current: camera } = cameraRef;
        camera.setCamera({
          centerCoordinate: feature.geometry.coordinates,
          zoomLevel: superCluster.getClusterExpansionZoom(
            feature.properties.cluster_id,
          ),
          animationDuration: ANIMATION_DURATION,
        });
        return;
      }

      if (properties.alert) {
        const { alert } = properties;
        if (alert) {
          if (currentAlertShowingRef.current) {
            toast.hide(currentAlertShowingRef.current);
          }
          currentAlertShowingRef.current = toast.show(
            <AlertPreview feature={feature} />,
            { duration: 0 },
          );
        }
        return;
      }

      console.warn("Unexepted feature pressed", JSON.stringify(features));
    },
    [
      mapRef,
      clusterFeature,
      cameraRef,
      superCluster,
      currentAlertShowingRef,
      toast,
    ],
  );
}
