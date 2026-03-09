import { useEffect } from "react";

export default function useMount(callback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useEffect(callback, []);
}
