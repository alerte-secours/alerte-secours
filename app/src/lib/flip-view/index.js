import { View, StyleSheet } from "react-native";

import React, { useCallback, useState, useEffect } from "react";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function FlipView({
  front,
  back,
  style,
  isFlipped: isFlippedProp,
  onFlipping,
  onFlipped,
  duration = 500,
}) {
  const [isFlipped, setIsFlipped] = useState(isFlippedProp);
  const spin = useSharedValue(isFlipped ? 1 : 0);

  useEffect(() => {
    if (isFlipped !== isFlippedProp) {
      setIsFlipped(isFlippedProp);
    }
  }, [isFlipped, isFlippedProp]);

  const flipTo = useCallback(
    (to) => {
      spin.value = to ? 0 : 1;
      onFlipping && onFlipping(to);
      setTimeout(() => {
        onFlipped && onFlipped(to);
      }, duration);
    },
    [duration, onFlipped, onFlipping, spin],
  );

  useEffect(() => {
    flipTo(isFlipped);
  }, [isFlipped, flipTo]);

  const rStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [0, 180]);
    return {
      transform: [
        {
          rotateY: withTiming(`${spinVal}deg`, { duration }),
        },
      ],
    };
  }, []);

  const bStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [180, 360]);
    return {
      transform: [
        {
          rotateY: withTiming(`${spinVal}deg`, { duration }),
        },
      ],
    };
  }, []);

  return (
    <View style={style}>
      <Animated.View
        pointerEvents={isFlipped ? "auto" : "none"}
        style={[Styles.viewFace, rStyle]}
      >
        {back}
      </Animated.View>
      <Animated.View
        pointerEvents={isFlipped ? "none" : "auto"}
        style={[Styles.viewFace, bStyle]}
      >
        {front}
      </Animated.View>
    </View>
  );
}

const Styles = StyleSheet.create({
  viewFace: {
    position: "absolute",
    // left: 0,
    // top: 0,
    // right: 0,
    // bottom: 0,
    height: "100%",
    width: "100%",
    // backgroundColor: "#fff",
    backfaceVisibility: "hidden",
  },
});
