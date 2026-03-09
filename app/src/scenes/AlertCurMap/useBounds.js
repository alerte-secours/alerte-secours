import { useMemo } from "react";
import { getBoundsOfDistance, getBounds } from "geolib";
import { useSessionState } from "~/stores";
import { BoundType } from "~/containers/Map/constants";

export default function useBounds({ boundType, alertingList, userCoords }) {
  const { radiusAll, radiusReach } = useSessionState([
    "radiusAll",
    "radiusReach",
  ]);

  // Check if we have valid coordinates
  const hasUserCoords =
    userCoords && userCoords.latitude !== null && userCoords.longitude !== null;

  return useMemo(() => {
    if (boundType === BoundType.TRACK_ALERTING) {
      // Get points from alerting list
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

      // Add user coordinates if available
      if (hasUserCoords) {
        allPoints.push(userCoords);
      }

      // Return null if no points to bound
      if (allPoints.length === 0) {
        return null;
      }

      // Calculate bounds from available points
      const { minLat, maxLat, minLng, maxLng } = getBounds(allPoints);
      return {
        ne: [maxLng, maxLat],
        sw: [minLng, minLat],
      };
    }

    // Handle radius-based bounds
    if (
      hasUserCoords &&
      (boundType === BoundType.TRACK_ALERT_RADIUS_REACH ||
        boundType === BoundType.TRACK_ALERT_RADIUS_ALL)
    ) {
      let radius;
      if (boundType === BoundType.TRACK_ALERT_RADIUS_REACH) {
        radius = radiusReach;
      } else {
        radius = radiusAll;
      }

      // Calculate bounds based on radius
      const [sw, ne] = getBoundsOfDistance(userCoords, radius);
      return {
        ne: [ne.longitude, ne.latitude],
        sw: [sw.longitude, sw.latitude],
      };
    }

    // Return null if no valid bounds can be calculated
    return null;
  }, [
    boundType,
    userCoords,
    hasUserCoords,
    alertingList,
    radiusReach,
    radiusAll,
  ]);
}
