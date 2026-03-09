import { deepEqual } from "fast-equals";
import { useRef } from "react";

export default function useShallowMemo(fn, deps) {
  const ref = useRef();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { value: fn(), deps };
  }

  return ref.current.value;
}
