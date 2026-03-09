import { useEffect, useRef } from "react";
import { deepEqual } from "fast-equals";

function useDeepCompareMemoize(value) {
  const ref = useRef();

  if (!ref.current || !deepEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

export default function useShallowEffect(effect, deps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, useDeepCompareMemoize(deps));
}
