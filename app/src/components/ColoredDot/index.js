import React from "react";
import { Platform } from "react-native";
import { Octicons } from "@expo/vector-icons";
import { useTheme, createStyles } from "~/theme";

export default function ColoredDot({ style = {}, color, size = 16, ...props }) {
  const { colors } = useTheme();
  const styles = useStyles();

  // If no color is provided, use blueLight color from theme for better contrast
  // Avoiding colors that could be confused with alert levels (red, yellow, green)
  const dotColor = color || colors.blueLight;

  return (
    <Octicons
      name="dot-fill"
      size={size}
      color={dotColor}
      style={[styles.dot, style]}
      {...props}
    />
  );
}

const useStyles = createStyles(({ theme }) => ({
  dot: {
    position: "absolute",
    right: 7,
    bottom: 6,
    textAlign: "center",
    textShadowOffset: { width: 2, height: 2 },
    shadowColor: theme.colors.shadow,
    shadowOpacity: Platform.select({
      ios: 0.2,
      android: 0.7,
    }),
    textShadowRadius: 4,
  },
}));
