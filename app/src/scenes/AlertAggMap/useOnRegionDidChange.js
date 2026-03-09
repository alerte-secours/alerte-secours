import React, { useCallback, useRef } from "react";

import { useToast } from "~/lib/toast-notifications";

import { levelNum } from "~/misc/levelNum";

import MaxRadiusToast from "~/containers/Map/MaxRadiusToast";

export default function useOnRegionDidChange({
  mapRef,
  superCluster,
  setClusterFeature,
  // userCoords,
  setDetached,
}) {
  const toast = useToast();
  const displayedMaxRadiusInfoRef = useRef(false);
  const maxRadiusTimeoutRef = useRef(null);

  return useCallback(
    async (event) => {
      const { current: map } = mapRef;
      if (!map) {
        return;
      }

      const { isUserInteraction } = event.properties;
      if (isUserInteraction && setDetached) {
        setDetached(true);
      }

      const zoom = Math.round(await map.getZoom());
      const visibleBounds = await map.getVisibleBounds();

      const [eastLng, northLat] = visibleBounds[0];
      const [westLng, southLat] = visibleBounds[1];

      if (zoom < 7) {
        if (!displayedMaxRadiusInfoRef.current) {
          displayedMaxRadiusInfoRef.current = true;
          // Clear any existing timeout
          if (maxRadiusTimeoutRef.current) {
            clearTimeout(maxRadiusTimeoutRef.current);
          }
          // Set a new timeout to show the toast after a delay
          maxRadiusTimeoutRef.current = setTimeout(async () => {
            // Recheck zoom level before showing toast
            const currentZoom = Math.round(await map.getZoom());
            if (currentZoom < 7) {
              toast.show(<MaxRadiusToast />, {
                duration: 20000,
                hideOnPress: true,
              });
            } else {
              displayedMaxRadiusInfoRef.current = false;
            }
          }, 5000);
        }
      } else {
        displayedMaxRadiusInfoRef.current = false;
        if (maxRadiusTimeoutRef.current) {
          clearTimeout(maxRadiusTimeoutRef.current);
        }
      }

      const features = superCluster.getClusters(
        [westLng, southLat, eastLng, northLat],
        zoom,
      );

      function setMaxLevelRecursive(features, parentFeatures = []) {
        for (const child of features) {
          const isCluster = child.properties.cluster;
          if (isCluster) {
            setMaxLevelRecursive(
              superCluster.getChildren(child.properties.cluster_id),
              [...parentFeatures, child],
            );
          } else if (child.properties.level !== undefined) {
            const { level } = child.properties;
            const num = levelNum[level];
            for (const f of parentFeatures) {
              if (
                !f.properties.x_max_level_num ||
                f.properties.x_max_level_num < num
              ) {
                f.properties.x_max_level_num = num;
                f.properties.x_max_level = level;
              }
            }
          }
        }
      }
      setMaxLevelRecursive(features);

      // console.log({ features: JSON.stringify(features) });

      setClusterFeature(features);
    },
    [mapRef, setDetached, superCluster, setClusterFeature, toast],
  );
}
