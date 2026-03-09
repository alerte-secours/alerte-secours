import { useEffect, useRef, useState } from "react";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES } from "~/lib/logger/scopes";

import {
  usePermissionWizardState,
  usePermissionsState,
  useTreeState,
} from "~/stores";

import trackLocation from "~/location/trackLocation";

const locationLogger = createLogger({
  module: BACKGROUND_SCOPES.GEOLOCATION,
  feature: "tracking-hook",
});

export default function useTrackLocation() {
  const { splashScreenHidden } = useTreeState(["splashScreenHidden"]);

  const { currentStep, completed } = usePermissionWizardState([
    "completed",
    "currentStep",
  ]);
  const { locationBackground, motion } = usePermissionsState([
    "locationBackground",
    "motion",
  ]);

  const [trackLocationEnabled, setTrackLocationEnabled] = useState(false);

  useEffect(() => {
    locationLogger.debug("Location tracking conditions changed", {
      locationBackground,
      motion,
      currentStep,
      completed,
    });

    if (
      locationBackground &&
      motion &&
      (currentStep === "tracking" || currentStep === "success" || completed) &&
      splashScreenHidden
    ) {
      locationLogger.info("Enabling location tracking", {
        step: currentStep,
        isCompleted: completed,
      });
      setTrackLocationEnabled(true);
    } else {
      locationLogger.debug("Location tracking requirements not met", {
        hasLocationPermission: locationBackground,
        hasMotionPermission: motion,
        step: currentStep,
      });
    }
  }, [locationBackground, motion, currentStep, completed, splashScreenHidden]);

  useEffect(() => {
    if (trackLocationEnabled) {
      locationLogger.info("Initializing location tracking");
      trackLocation().catch((error) => {
        locationLogger.error("Failed to initialize location tracking", {
          error: error.message,
          stack: error.stack,
        });
      });
    }
  }, [trackLocationEnabled]);

  return null;
}
