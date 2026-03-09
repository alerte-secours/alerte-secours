import { useMemo } from "react";
import { getBounds } from "geolib";
import { BoundType } from "~/containers/Map/constants";

export default function useBounds({ boundType, alertingList, userCoords }) {
  // Check if we have valid coordinates
  const hasUserCoords =
    userCoords && userCoords.latitude !== null && userCoords.longitude !== null;

  return useMemo(() => {
    // Only handle TRACK_ALERTING mode
    if (boundType !== BoundType.TRACK_ALERTING) {
      return null;
    }

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
  }, [boundType, userCoords, hasUserCoords, alertingList]);
}
