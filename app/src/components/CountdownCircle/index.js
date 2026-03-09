// based on https://github.com/MrToph/react-native-countdown-circle
import React, { useCallback, useState, useEffect, useRef } from "react";
import { Easing, Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "~/theme";

function calcInterpolationValuesForHalfCircle1(animatedValue, { shadowColor }) {
  const rotate = animatedValue.interpolate({
    inputRange: [0, 50, 50, 100],
    outputRange: ["0deg", "180deg", "180deg", "180deg"],
  });

  const backgroundColor = shadowColor;
  return { rotate, backgroundColor };
}

function calcInterpolationValuesForHalfCircle2(
  animatedValue,
  { color, shadowColor },
) {
  const rotate = animatedValue.interpolate({
    inputRange: [0, 50, 50, 100],
    outputRange: ["0deg", "0deg", "180deg", "360deg"],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 50, 50, 100],
    outputRange: [color, color, shadowColor, shadowColor],
  });
  return { rotate, backgroundColor };
}

function getInitialState(props) {
  const circleProgress = new Animated.Value(0);
  return {
    circleProgress,
    secondsElapsed: 0,
    text: props.updateText(0, props.seconds),
    interpolationValuesHalfCircle1: calcInterpolationValuesForHalfCircle1(
      circleProgress,
      props,
    ),
    interpolationValuesHalfCircle2: calcInterpolationValuesForHalfCircle2(
      circleProgress,
      props,
    ),
  };
}

export default function CountdownCircle(props) {
  const { colors, custom } = useTheme();

  props = {
    color: colors.primary,
    shadowColor: colors.grey,
    bgColor: colors.background,
    borderWidth: 2,
    seconds: 10,
    children: null,
    containerStyle: null,
    textStyle: null,
    onTimeElapsed: () => null,
    updateText: (elapsedSeconds, totalSeconds) =>
      (totalSeconds - elapsedSeconds).toString(),
    paused: false,
    ...props,
  };

  const [state, setState] = useState(() => getInitialState(props));

  const onCircleAnimated = useCallback(
    ({ finished }) => {
      // if animation was interrupted by stopAnimation don't restart it.
      if (!finished) return;

      const secondsElapsed = state.secondsElapsed + 1;
      const updatedText = props.updateText(secondsElapsed, props.seconds);
      setState({
        ...getInitialState(props),
        secondsElapsed,
        text: updatedText,
      });
    },
    [props, state.secondsElapsed],
  );

  const prevSeconds = useRef();
  useEffect(() => {
    if (
      prevSeconds.current !== undefined &&
      prevSeconds.current !== props.seconds
    ) {
      state.circleProgress.stopAnimation();
      setState(getInitialState(props));
    }
    prevSeconds.current = props.seconds;
  }, [props, prevSeconds, state.circleProgress]);

  useEffect(() => {
    if (props.paused) {
      return;
    }
    let callback;
    if (state.secondsElapsed + 1 < props.seconds) {
      callback = onCircleAnimated;
    } else {
      callback = () => {
        const updatedText = props.updateText(
          state.secondsElapsed + 1,
          props.seconds,
        );
        setState({
          ...state,
          text: updatedText,
        });
        props.onTimeElapsed();
      };
    }
    state.circleProgress.stopAnimation();
    Animated.timing(state.circleProgress, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.secondsElapsed, props.paused]);

  function renderHalfCircle({ rotate, backgroundColor }) {
    const { radius } = props;

    return (
      <View
        style={[
          styles.leftWrap,
          {
            width: radius,
            height: radius * 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: radius,
              height: radius * 2,
              borderRadius: radius,
              backgroundColor,
              transform: [
                { translateX: radius / 2 },
                { rotate },
                { translateX: -radius / 2 },
              ],
            },
          ]}
        />
      </View>
    );
  }

  function renderInnerCircle() {
    const radiusMinusBorder = props.radius - props.borderWidth;
    return (
      <View
        style={[
          styles.innerCircle,
          {
            width: radiusMinusBorder * 2,
            height: radiusMinusBorder * 2,
            borderRadius: radiusMinusBorder,
            backgroundColor: props.bgColor,
            ...props.containerStyle,
          },
        ]}
      >
        <Text style={props.textStyle}>{state.text}</Text>
      </View>
    );
  }

  const { interpolationValuesHalfCircle1, interpolationValuesHalfCircle2 } =
    state;
  return (
    <View
      style={[
        styles.outerCircle,
        {
          width: props.radius * 2,
          height: props.radius * 2,
          borderRadius: props.radius,
          backgroundColor: props.color,
        },
        props.style,
      ]}
    >
      {renderHalfCircle(interpolationValuesHalfCircle1)}
      {renderHalfCircle(interpolationValuesHalfCircle2)}
      {renderInnerCircle()}
    </View>
  );
}

const styles = StyleSheet.create({
  outerCircle: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  leftWrap: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  halfCircle: {
    position: "absolute",
    top: 0,
    left: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
});
