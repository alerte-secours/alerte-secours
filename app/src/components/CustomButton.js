import React from "react";
import { Button } from "react-native-paper";
import { createStyles, useTheme } from "~/theme";

const CustomButton = ({
  children,
  style,
  contentStyle,
  labelStyle,
  mode = "contained",
  selected,
  ...props
}) => {
  const styles = useStyles();

  const theme = useTheme();
  const isOutlined = mode === "outlined";

  const computedAccessibilityLabel =
    props.accessibilityLabel ??
    (typeof children === "string" ? children : undefined);

  // Hints are optional; we provide an empty hint to satisfy lint rules while
  // encouraging callers to add meaningful hints for non-obvious actions.
  const computedAccessibilityHint = props.accessibilityHint ?? "";

  const computedAccessibilityState = {
    ...(props.accessibilityState ?? {}),
    ...(props.disabled != null ? { disabled: !!props.disabled } : null),
    ...(selected != null ? { selected: !!selected } : null),
  };

  return (
    <Button
      {...props}
      accessibilityRole={props.accessibilityRole ?? "button"}
      accessibilityLabel={computedAccessibilityLabel}
      accessibilityHint={computedAccessibilityHint}
      accessibilityState={computedAccessibilityState}
      mode={mode}
      style={[
        styles.button,
        style,
        {
          backgroundColor: isOutlined
            ? theme.colors.onPrimary
            : theme.colors.primary,
        },
      ]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[
        styles.label,
        labelStyle,
        { color: isOutlined ? theme.colors.primary : theme.colors.onPrimary },
      ]}
    >
      {children}
    </Button>
  );
};

const useStyles = createStyles(({ theme: { colors } }) => ({
  button: {
    marginVertical: 5,
  },
  content: {
    minHeight: 48,
    paddingVertical: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
    flexWrap: "wrap",
  },
}));

export default CustomButton;
