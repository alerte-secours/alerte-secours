import * as Location from "expo-location";
import { useState, useRef, useEffect, useCallback } from "react";
import { storeLocation, getStoredLocation } from "~/location/storage";
import { createLogger } from "~/lib/logger";
import { BACKGROUND_SCOPES, UI_SCOPES } from "~/lib/logger/scopes";

const locationLogger = createLogger({
  module: BACKGROUND_SCOPES.GEOLOCATION,
  feature: UI_SCOPES.HOOKS,
});

const LOCATION_TIMEOUT = 5000; // 5 seconds

// Default coordinates when no location is available
const DEFAULT_COORDS = {
  accuracy: null,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  latitude: null,
  longitude: null,
  speed: null,
};

export default function useLocation() {
  const [location, setLocation] = useState({ coords: DEFAULT_COORDS });
  const [isLastKnown, setIsLastKnown] = useState(false);
  const [lastKnownTimestamp, setLastKnownTimestamp] = useState(null);
  // UI-facing realtime tracking (foreground).
  // We intentionally keep this separate from BGGeo background tracking.
  // Note: this watcher should be managed by screen lifecycle (mounted maps).
  const watcher = useRef();
  const timeoutRef = useRef();
  const isWatchingRef = useRef(false);
  const hasLocationRef = useRef(false);

  const setupLocationWatching = useCallback(async () => {
    // Clean up existing watcher and timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (watcher.current) {
      await watcher.current.remove();
      watcher.current = null;
    }
    // Reset flags
    isWatchingRef.current = false;
    hasLocationRef.current = false;

    // Prevent multiple watchers
    if (isWatchingRef.current) {
      return;
    }

    const watchPositionOptions = {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10,
      mayShowUserSettingsDialog: false,
    };

    try {
      isWatchingRef.current = true;

      // Start timeout to check for last known location
      timeoutRef.current = setTimeout(async () => {
        if (!hasLocationRef.current) {
          const lastKnown = await getStoredLocation();
          if (lastKnown) {
            setLocation({ coords: lastKnown.coords });
            setIsLastKnown(true);
            setLastKnownTimestamp(lastKnown.timestamp);
          }
        }
      }, LOCATION_TIMEOUT);

      watcher.current = await Location.watchPositionAsync(
        watchPositionOptions,
        async (newLocation) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          hasLocationRef.current = true;
          setLocation(newLocation);
          setIsLastKnown(false);
          setLastKnownTimestamp(null);

          // Store the location whenever we get a new one
          await storeLocation(newLocation.coords, newLocation.timestamp);
        },
      );
    } catch (error) {
      locationLogger.error("Failed to watch position", {
        error: error.message,
        stack: error.stack,
      });
      // If we fail to get current location, try to use last known
      const lastKnown = await getStoredLocation();
      if (lastKnown) {
        setLocation({ coords: lastKnown.coords });
        setIsLastKnown(true);
        setLastKnownTimestamp(lastKnown.timestamp);
      }
    }
  }, []);

  // Expose reload function to allow manual refresh
  const reload = useCallback(() => {
    setupLocationWatching();
  }, [setupLocationWatching]);

  useEffect(() => {
    setupLocationWatching();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (watcher.current) {
        watcher.current.remove();
      }
      isWatchingRef.current = false;
      hasLocationRef.current = false;
    };
  }, [setupLocationWatching]); // Add setupLocationWatching to dependencies since it's stable

  // Always ensure we have valid coords object
  const coords = location?.coords || DEFAULT_COORDS;

  return {
    coords,
    isLastKnown,
    lastKnownTimestamp,
    reload,
  };
}
