import React, { Component } from "react";
import { Animated, View, StyleSheet } from "react-native";
import color from "color";
import MaterialCommunityIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { TouchableRipple, withTheme } from "react-native-paper";

// From https://material.io/design/motion/speed.html#duration
const ANIMATION_DURATION = 100;

/**
 * Checkboxes allow the selection of multiple options from a set.
 * This component follows platform guidelines for Android.
 *
 * <div class="screenshots">
 *   <figure>
 *     <img src="screenshots/checkbox-enabled.android.png" />
 *     <figcaption>Enabled</figcaption>
 *   </figure>
 *   <figure>
 *     <img src="screenshots/checkbox-disabled.android.png" />
 *     <figcaption>Disabled</figcaption>
 *   </figure>
 * </div>
 */
class CheckboxAndroid extends Component {
  static displayName = "Checkbox.Android";

  state = {
    scaleAnim: new Animated.Value(1),
  };

  componentDidUpdate(prevProps) {
    if (prevProps.status === this.props.status) {
      return;
    }

    const checked = this.props.status === "checked";
    const { animation } = this.props.theme;

    Animated.sequence([
      Animated.timing(this.state.scaleAnim, {
        toValue: 0.85,
        duration: checked ? ANIMATION_DURATION * animation.scale : 0,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.scaleAnim, {
        toValue: 1,
        duration: checked
          ? ANIMATION_DURATION * animation.scale
          : ANIMATION_DURATION * animation.scale * 1.75,
        useNativeDriver: false,
      }),
    ]).start();
  }

  render() {
    const { status, disabled, onPress, theme, size, ...rest } = this.props;
    const checked = status === "checked";
    const indeterminate = status === "indeterminate";
    const checkedColor = this.props.color || theme.colors.accent;
    const uncheckedColor =
      this.props.uncheckedColor ||
      color(theme.colors.onBackground)
        .alpha(theme.dark ? 0.7 : 0.54)
        .rgb()
        .string();

    let rippleColor, checkboxColor;

    if (disabled) {
      rippleColor = color(theme.colors.onBackground).alpha(0.16).rgb().string();
      checkboxColor = theme.colors.disabled;
    } else {
      rippleColor = color(checkedColor).fade(0.32).rgb().string();
      checkboxColor = checked ? checkedColor : uncheckedColor;
    }

    const borderWidth = this.state.scaleAnim.interpolate({
      inputRange: [0.8, 1],
      outputRange: [7, 0],
    });

    const icon = indeterminate
      ? "minus-box"
      : checked
      ? "checkbox-marked"
      : "checkbox-blank-outline";

    const iconSize = size || 24;
    const fillSize = iconSize * 0.6;
    const fillStyle = {
      width: fillSize,
      height: fillSize,
    };
    const containerSize = iconSize * 1.5;
    const containerStyle = {
      width: containerSize,
      height: containerSize,
      borderRadius: iconSize * 0.75,
      padding: iconSize * 0.25,
    };
    return (
      <TouchableRipple
        {...rest}
        borderless
        rippleColor={rippleColor}
        onPress={onPress}
        disabled={disabled}
        accessibilityTraits={disabled ? ["button", "disabled"] : "button"}
        accessibilityComponentType="button"
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLiveRegion="polite"
        style={[containerStyle]}
      >
        <Animated.View style={{ transform: [{ scale: this.state.scaleAnim }] }}>
          <MaterialCommunityIcon
            allowFontScaling={false}
            name={icon}
            size={iconSize}
            color={checkboxColor}
            direction="ltr"
          />
          <View style={[StyleSheet.absoluteFill, styles.fillContainer]}>
            <Animated.View
              style={[
                fillStyle,
                { borderColor: checkboxColor },
                { borderWidth },
              ]}
            />
          </View>
        </Animated.View>
      </TouchableRipple>
    );
  }
}

const styles = StyleSheet.create({
  fillContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default withTheme(CheckboxAndroid);

export { CheckboxAndroid };
