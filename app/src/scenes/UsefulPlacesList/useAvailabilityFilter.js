import { useCallback } from "react";
import {
  usefulPlacesActions,
  useUsefulPlacesState,
  getUsefulPlacesState,
} from "~/stores";

export default function useAvailabilityFilter() {
  const { hideUnavailableDae } = useUsefulPlacesState(["hideUnavailableDae"]);

  const toggleHideUnavailableDae = useCallback(() => {
    const current = getUsefulPlacesState().hideUnavailableDae;
    usefulPlacesActions.setHideUnavailableDae(!current);
  }, []);

  return { hideUnavailableDae, toggleHideUnavailableDae };
}
