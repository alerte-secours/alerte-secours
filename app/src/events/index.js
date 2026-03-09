import EventEmitter from "eventemitter3";
import { useEffect, useCallback } from "react";

const eventEmitter = new EventEmitter();

export function useEventEmitter(eventEmitter, eventName, fn, deps = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(fn, deps);
  useEffect(() => {
    eventEmitter.on(eventName, callback);
    return () => {
      eventEmitter.off(eventName, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, callback]);
}

export default eventEmitter;
