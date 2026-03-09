import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

export default function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  function onKeyboardDidShow(e) {
    setKeyboardHeight(e.endCoordinates.height);
  }

  function onKeyboardDidHide() {
    setKeyboardHeight(0);
  }

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      onKeyboardDidShow,
    );
    const keyboardDidHideListeneer = Keyboard.addListener(
      "keyboardDidHide",
      onKeyboardDidHide,
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListeneer.remove();
    };
  }, []);

  return keyboardHeight;
}
