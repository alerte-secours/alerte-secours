import React, { forwardRef } from "react";
import { View, TextInput, Text } from "react-native";
import { createStyles, useTheme } from "~/theme";

function OutlinedInputText(
  {
    style,
    labelStyle,
    inputStyle,
    label,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    required,
    error,
    errorMessage,
    ...props
  },
  ref,
) {
  const styles = useStyles();
  const { colors } = useTheme();

  const computedAccessibilityLabel = accessibilityLabel ?? label;

  const computedAccessibilityHint =
    accessibilityHint ?? (errorMessage ? errorMessage : undefined);

  const computedAccessibilityState = {
    ...(accessibilityState ?? {}),
    ...(required != null ? { required: !!required } : null),
    ...(error != null || !!errorMessage
      ? { invalid: !!error || !!errorMessage }
      : null),
  };

  return (
    <View
      style={[
        styles.container,
        error || errorMessage ? styles.containerError : null,
        style,
      ]}
    >
      {!!label && (
        <Text
          style={[styles.label, labelStyle]}
          // Prevent the label from being announced as a separate element.
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.outline}
        style={[styles.input, inputStyle]}
        ref={ref}
        accessibilityLabel={computedAccessibilityLabel}
        accessibilityHint={computedAccessibilityHint}
        accessibilityState={computedAccessibilityState}
        {...props}
      />
      {!!errorMessage && (
        <Text
          style={[styles.errorText]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
}

const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  container: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.outline,
    backgroundColor: "transparent",
  },
  containerError: {
    borderColor: colors.error,
  },
  label: {
    position: "absolute",
    left: 6,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  input: {
    backgroundColor: "transparent",
  },
  errorText: {
    color: colors.error,
    marginTop: 6,
  },
}));

export default forwardRef(OutlinedInputText);
