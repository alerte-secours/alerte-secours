import React, { forwardRef } from "react";
import { Pressable, StyleSheet } from "react-native";

/**
 * Icon-only touch target wrapper.
 *
 * - Enforces a minimum 44x44pt touch target (WCAG / Apple HIG).
 * - Adds a default hitSlop to make small icons easier to tap.
 * - Preserves accessibility semantics via accessibility* props.
 */
function IconTouchTarget(
  {
    children,
    style,
    hitSlop = { bottom: 8, left: 8, right: 8, top: 8 },
    accessibilityRole = "button",
    accessibilityState,
    disabled,
    selected,
    ...props
  },
  ref,
) {
  const computedAccessibilityState = {
    ...(accessibilityState ?? {}),
    ...(disabled != null ? { disabled: !!disabled } : null),
    ...(selected != null ? { selected: !!selected } : null),
  };

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole={accessibilityRole}
      accessibilityState={computedAccessibilityState}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const ForwardedIconTouchTarget = forwardRef(IconTouchTarget);
ForwardedIconTouchTarget.displayName = "IconTouchTarget";

export default ForwardedIconTouchTarget;

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
});
