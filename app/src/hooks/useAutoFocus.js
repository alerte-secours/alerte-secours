import React from "react";
import { InteractionManager } from "react-native";

export default function useAutoFocus(autoFocus = true) {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      if (inputRef.current) {
        InteractionManager.runAfterInteractions(() => {
          inputRef.current?.focus();
        });
      }
    }
  }, [autoFocus, inputRef]);

  return inputRef;
}
