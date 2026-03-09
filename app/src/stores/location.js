import { createAtom } from "~/lib/atomic-zustand";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

const locationStoreLogger = createLogger({
  module: BACKGROUND_SCOPES.GEOLOCATION,
  feature: "store",
});

export default createAtom(({ merge, get }) => {
  const update = (coords) => {
    const prevState = get();
    locationStoreLogger.debug("Updating location store", {
      isFirstUpdate: !prevState.loaded,
      hasValidCoords: !!(coords.latitude && coords.longitude),
      accuracy: coords.accuracy,
    });

    merge({
      coords,
      loaded: true,
    });

    if (!prevState.loaded) {
      locationStoreLogger.info(
        "Location store initialized with first coordinates",
      );
    }

    // Log significant changes in accuracy or movement
    if (prevState.loaded) {
      const prevCoords = prevState.coords;
      const accuracyChange = Math.abs(
        (coords.accuracy || 0) - (prevCoords.accuracy || 0),
      );
      const hasSignificantAccuracyChange = accuracyChange > 10; // 10 meters threshold

      if (hasSignificantAccuracyChange) {
        locationStoreLogger.debug("Significant accuracy change detected", {
          previousAccuracy: prevCoords.accuracy,
          newAccuracy: coords.accuracy,
          change: accuracyChange,
        });
      }

      // Log if speed or heading information becomes available
      if (
        (!prevCoords.speed && coords.speed) ||
        (!prevCoords.heading && coords.heading)
      ) {
        locationStoreLogger.debug("New motion data available", {
          hasSpeed: !!coords.speed,
          hasHeading: !!coords.heading,
          speed: coords.speed,
          heading: coords.heading,
        });
      }
    }
  };

  locationStoreLogger.debug("Initializing location store");

  return {
    default: {
      loaded: false,
      coords: {
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: null,
        longitude: null,
        speed: null,
      },
    },
    actions: {
      update,
    },
  };
});
