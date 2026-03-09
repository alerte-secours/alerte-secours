import { deepEqual } from "fast-equals";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import { locationActions } from "~/stores";

const locationStateLogger = createLogger({
  module: BACKGROUND_SCOPES.GEOLOCATION,
  feature: "state-management",
});

let lastCoordsRef;

export default async function setLocationState(coords) {
  if (deepEqual(coords, lastCoordsRef)) {
    locationStateLogger.debug("Skipping duplicate location update", {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    return;
  }

  locationStateLogger.debug("Processing new location update", {
    previous: lastCoordsRef
      ? {
          latitude: lastCoordsRef.latitude,
          longitude: lastCoordsRef.longitude,
          accuracy: lastCoordsRef.accuracy,
        }
      : null,
    current: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    },
  });

  lastCoordsRef = coords;

  const {
    accuracy,
    altitude,
    altitudeAccuracy,
    heading,
    latitude,
    longitude,
    speed,
  } = coords;

  locationStateLogger.info("Updating location state", {
    hasAltitude: !!altitude,
    hasHeading: !!heading,
    hasSpeed: !!speed,
    accuracy,
  });

  locationActions.update({
    accuracy,
    altitude,
    altitudeAccuracy,
    heading,
    latitude,
    longitude,
    speed,
  });
}
