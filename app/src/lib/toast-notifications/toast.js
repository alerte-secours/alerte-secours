import React, { FC, useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Text,
  TouchableWithoutFeedback,
  PanResponder,
  PanResponderInstance,
  PanResponderGestureState,
  Platform,
} from "react-native";
import { useDimensions } from "./utils/useDimensions";
import { useTheme, createStyles } from "~/theme";

function Toast(props) {
  const { colors, custom } = useTheme();
  const styles = useStyles();
  let {
    id,
    onDestroy,
    icon,
    type = "normal",
    message,
    duration = 5000,
    style,
    textStyle,
    animationDuration = 250,
    animationType = "slide-in",
    successIcon,
    dangerIcon,
    warningIcon,
    successColor,
    dangerColor,
    warningColor,
    normalColor,
    placement,
    swipeEnabled,
    onPress,
    hideOnPress,
    container,
  } = props;

  const containerRef = useRef(null);
  const [animation] = useState(new Animated.Value(0));
  const panResponderRef = useRef();
  const panResponderAnimRef = useRef();
  const closeTimeoutRef = useRef(null);
  const dims = useDimensions();

  const handleClose = useCallback(() => {
    Animated.timing(animation, {
      toValue: 0,
      useNativeDriver: Platform.OS !== "web",
      duration: animationDuration,
    }).start(() => onDestroy());
  }, [animation, animationDuration, onDestroy]);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      duration: animationDuration,
    }).start();
    if (duration !== 0 && typeof duration === "number") {
      closeTimeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      closeTimeoutRef.current && clearTimeout(closeTimeoutRef.current);
    };
  }, [animation, animationDuration, duration, handleClose]);

  // Handles hide & hideAll
  useEffect(() => {
    if (!props.open) {
      // Unregister close timeout
      closeTimeoutRef.current && clearTimeout(closeTimeoutRef.current);

      // Close animation them remove from stack.
      handleClose();
    }
  }, [handleClose, props.open]);

  const panReleaseToLeft = (gestureState) => {
    Animated.timing(getPanResponderAnim(), {
      toValue: { x: (-dims.width / 10) * 9, y: gestureState.dy },
      useNativeDriver: Platform.OS !== "web",
      duration: 250,
    }).start(() => onDestroy());
  };

  const panReleaseToRight = (gestureState) => {
    Animated.timing(getPanResponderAnim(), {
      toValue: { x: (dims.width / 10) * 9, y: gestureState.dy },
      useNativeDriver: Platform.OS !== "web",
      duration: 250,
    }).start(() => onDestroy());
  };

  const getPanResponder = () => {
    if (panResponderRef.current) return panResponderRef.current;
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        //return true if user is swiping, return false if it's a single click
        return !(gestureState.dx === 0 && gestureState.dy === 0);
      },
      onPanResponderMove: (_, gestureState) => {
        getPanResponderAnim()?.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          panReleaseToRight(gestureState);
        } else if (gestureState.dx < -50) {
          panReleaseToLeft(gestureState);
        } else {
          Animated.spring(getPanResponderAnim(), {
            toValue: { x: 0, y: 0 },
            useNativeDriver: Platform.OS !== "web",
          }).start();
        }
      },
    });
    return panResponderRef.current;
  };

  const getPanResponderAnim = () => {
    if (panResponderAnimRef.current) return panResponderAnimRef.current;
    panResponderAnimRef.current = new Animated.ValueXY({ x: 0, y: 0 });
    return panResponderAnimRef.current;
  };

  if (icon === undefined) {
    switch (type) {
      case "success": {
        if (successIcon) {
          icon = successIcon;
        }
        break;
      }

      case "danger": {
        if (dangerIcon) {
          icon = dangerIcon;
        }
        break;
      }
      case "warning": {
        if (warningIcon) {
          icon = warningIcon;
        }
        break;
      }
    }
  }

  let backgroundColor = "";
  switch (type) {
    case "success":
      backgroundColor = successColor || "#00C851";
      break;
    case "danger":
      backgroundColor = dangerColor || "#ff4444";
      break;
    case "warning":
      backgroundColor = warningColor || "#ffbb33";
      break;
    default:
      backgroundColor = normalColor || colors.surfaceVariant;
  }

  const animationStyle = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: placement === "bottom" ? [20, 0] : [-20, 0], // 0 : 150, 0.5 : 75, 1 : 0
        }),
      },
    ],
  };

  if (swipeEnabled) {
    animationStyle.transform?.push(
      getPanResponderAnim().getTranslateTransform()[0],
    );
  }

  if (animationType === "zoom-in") {
    animationStyle.transform?.push({
      scale: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.7, 1],
      }),
    });
  }

  return (
    <Animated.View
      ref={containerRef}
      {...(swipeEnabled ? getPanResponder().panHandlers : null)}
      style={[styles.container, animationStyle]}
    >
      {props.renderType && props.renderType[type] ? (
        props.renderType[type](props)
      ) : props.renderToast ? (
        props.renderToast(props)
      ) : (
        <TouchableWithoutFeedback
          accessibilityRole="button"
          disabled={!(onPress || hideOnPress)}
          onPress={() => {
            onPress && onPress(id);
            hideOnPress && container.hide(id);
          }}
        >
          <View
            style={[
              styles.toastContainer,
              { maxWidth: (dims.width / 10) * 9, backgroundColor },
              style,
            ]}
          >
            {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
            {React.isValidElement(message) ? (
              message
            ) : (
              <Text style={[styles.message, textStyle]}>{message}</Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      )}
    </Animated.View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: { width: "100%", alignItems: "center" },
  toastContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 5,
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  message: {
    fontWeight: "500",
    color: colors.onSurfaceVariant,
  },
  iconContainer: {
    marginRight: 5,
  },
}));

export default Toast;
