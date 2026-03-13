import { useCallback } from "react";
import {
  usefulPlacesActions,
  useUsefulPlacesState,
  getUsefulPlacesState,
} from "~/stores";
import { ALL_TYPES, DEFAULT_TYPES } from "~/utils/places/constants";

export { ALL_TYPES, DEFAULT_TYPES };

const CONTEXT_CONFIG = {
  map: { stateKey: "mapVisibleTypes", action: "setMapVisibleTypes" },
  list: { stateKey: "listVisibleTypes", action: "setListVisibleTypes" },
};

export default function useTypeFilter(context = "list") {
  const { stateKey, action } = CONTEXT_CONFIG[context];
  const state = useUsefulPlacesState([stateKey]);
  const visibleTypes = state[stateKey];

  const toggle = useCallback(
    (type) => {
      const current = getUsefulPlacesState()[stateKey] ?? ALL_TYPES;
      const isActive = current.includes(type);
      if (isActive) {
        if (current.length <= 1) return;
        usefulPlacesActions[action](current.filter((t) => t !== type));
      } else {
        usefulPlacesActions[action]([...current, type]);
      }
    },
    [stateKey, action],
  );

  return { visibleTypes, toggle };
}
