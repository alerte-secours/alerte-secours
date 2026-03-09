import { useMemo } from "react";

export default function useInitialState(callback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(callback, []);
}
