import { useEffect, useRef, useCallback, useState } from "react";
import useLocation from "~/hooks/useLocation";
import { usefulPlacesActions, useUsefulPlacesState } from "~/stores";

const RADIUS_METERS = 30_000;

/**
 * Shared hook: loads useful places near user and exposes location + loading state.
 */
export default function useNearbyPlaces() {
  const { coords, isLastKnown, lastKnownTimestamp } = useLocation();
  const { nearUserPlaces, loadingNearUser, errorNearUser, updateState } =
    useUsefulPlacesState([
      "nearUserPlaces",
      "loadingNearUser",
      "errorNearUser",
      "updateState",
    ]);

  const hasLocation =
    coords && coords.latitude !== null && coords.longitude !== null;

  const lastLoadedRef = useRef(null);
  const [noLocation, setNoLocation] = useState(false);

  // Keep coords in a ref so loadPlaces is stable across renders
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const hasLocationRef = useRef(hasLocation);
  hasLocationRef.current = hasLocation;

  const loadPlaces = useCallback(async () => {
    const currentCoords = coordsRef.current;
    if (!hasLocationRef.current || !currentCoords) return;

    const key = `${currentCoords.latitude.toFixed(
      4,
    )},${currentCoords.longitude.toFixed(4)}`;
    if (lastLoadedRef.current === key) return;

    lastLoadedRef.current = key;
    await usefulPlacesActions.loadNearUser({
      userLonLat: [currentCoords.longitude, currentCoords.latitude],
      radiusMeters: RADIUS_METERS,
    });
  }, []);

  // Re-query after successful DB update
  const prevUpdateState = useRef(updateState);
  useEffect(() => {
    if (prevUpdateState.current !== "done" && updateState === "done") {
      lastLoadedRef.current = null;
      loadPlaces();
    }
    prevUpdateState.current = updateState;
  }, [updateState, loadPlaces]);

  const lat = coords?.latitude;
  const lon = coords?.longitude;
  useEffect(() => {
    if (hasLocation) {
      setNoLocation(false);
      loadPlaces();
    }
  }, [hasLocation, lat, lon, loadPlaces]);

  useEffect(() => {
    if (hasLocation) return;
    const timer = setTimeout(() => {
      if (!hasLocationRef.current) setNoLocation(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [hasLocation]);

  const reload = useCallback(() => {
    lastLoadedRef.current = null;
    return loadPlaces();
  }, [loadPlaces]);

  return {
    places: nearUserPlaces,
    loading: loadingNearUser,
    error: errorNearUser,
    hasLocation,
    noLocation,
    isLastKnown,
    lastKnownTimestamp,
    coords,
    reload,
  };
}
