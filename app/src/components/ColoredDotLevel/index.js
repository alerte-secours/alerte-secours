import React from "react";
import { Platform } from "react-native";

import { Octicons } from "@expo/vector-icons";

import { useTheme } from "~/theme";

export default function ColoredDotLevel({ style = {}, level, ...props }) {
  const { colors, custom } = useTheme();
  if (!level) {
    return null;
  }
  const color = level ? custom.appColors[level] : null;
  return (
    <Octicons
      name="dot-fill"
      size={16}
      color={color}
      style={{
        ...{
          position: "absolute",
          right: 7,
          bottom: 6,
          textAlign: "center",
          textShadowOffset: { width: 2, height: 2 },
          shadowColor: "#000",
          shadowOpacity: Platform.select({
            ios: 0.2,
            android: 0.7,
          }),
          textShadowRadius: 4,
        },
        ...style,
      }}
      {...props}
    />
  );
}
