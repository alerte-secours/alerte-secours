import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Easing, StyleSheet, Animated } from "react-native";

const styles = StyleSheet.create({
  flippableView: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: "hidden",
  },
});

const getTargetRenderStateFromFlippedValue = (isFlipped) => {
  return {
    frontRotation: isFlipped ? 0.5 : 0,
    backRotation: isFlipped ? 1 : 0.5,
  };
};

export default function FlipView({
  flipDuration,
  flipEasing,
  flipAxis,
  front,
  back,
  perspective,
  onFlip,
  onFlipped,
  isFlipped: isFlippedProp,
  ...viewProps
}) {
  const [isFlipped, setIsFlipped] = useState(isFlippedProp);

  const targetRenderState = getTargetRenderStateFromFlippedValue(isFlipped);

  const frontRotationAnimatedValue = useMemo(
    () => new Animated.Value(targetRenderState.frontRotation),
    [targetRenderState.frontRotation],
  );
  const backRotationAnimatedValue = useMemo(
    () => new Animated.Value(targetRenderState.backRotation),
    [targetRenderState.backRotation],
  );
  const interpolationConfig = {
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  };
  const frontRotation =
    frontRotationAnimatedValue.interpolate(interpolationConfig);
  const backRotation =
    backRotationAnimatedValue.interpolate(interpolationConfig);

  const animateValue = useCallback(
    (animatedValue, toValue, easing) => {
      return Animated.timing(animatedValue, {
        toValue: toValue,
        duration: flipDuration,
        easing: easing,
        useNativeDriver: true,
      });
    },
    [flipDuration],
  );

  const flip = useCallback(() => {
    onFlip();

    const nextIsFlipped = !isFlipped;

    const { frontRotation, backRotation } =
      getTargetRenderStateFromFlippedValue(nextIsFlipped);

    setImmediate(() => {
      requestAnimationFrame(() => {
        Animated.parallel([
          animateValue(frontRotationAnimatedValue, frontRotation, flipEasing),
          animateValue(backRotationAnimatedValue, backRotation, flipEasing),
        ]).start((k) => {
          if (!k.finished) {
            return;
          }
          setIsFlipped(nextIsFlipped);
          onFlipped(nextIsFlipped);
        });
      });
    });
  }, [
    animateValue,
    flipEasing,
    onFlip,
    onFlipped,
    backRotationAnimatedValue,
    frontRotationAnimatedValue,
    isFlipped,
  ]);

  useEffect(() => {
    if (isFlipped !== isFlippedProp) {
      flip();
    }
  }, [isFlipped, isFlippedProp, flip]);

  const rotateProperty = flipAxis === "y" ? "rotateY" : "rotateX";

  return (
    <View {...viewProps}>
      <Animated.View
        pointerEvents={isFlipped ? "none" : "auto"}
        style={[
          styles.flippableView,
          {
            transform: [
              { perspective: perspective },
              { [rotateProperty]: frontRotation },
            ],
          },
        ]}
      >
        {front}
      </Animated.View>
      <Animated.View
        pointerEvents={isFlipped ? "auto" : "none"}
        style={[
          styles.flippableView,
          {
            transform: [
              { perspective: perspective },
              { [rotateProperty]: backRotation },
            ],
          },
        ]}
      >
        {back}
      </Animated.View>
    </View>
  );
}

FlipView.defaultProps = {
  style: {},
  flipDuration: 500,
  flipEasing: Easing.out(Easing.ease),
  flipAxis: "y",
  perspective: 1000,
  onFlip: () => {},
  onFlipped: () => {},
  isFlipped: false,
};
