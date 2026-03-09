// based on https://github.com/knowbody/react-native-text width fontScale added
import React, { useMemo } from "react";
import {
  Text,
  StyleSheet,
  PixelRatio,
  useWindowDimensions,
} from "react-native";

const DEVICE_BASE_WIDTH = 375; // iPhone 6 width
const FONT_SIZE = 14;

export function fontSize(
  fontSize,
  windowWidth,
  deviceBaseWidth = DEVICE_BASE_WIDTH,
) {
  const fontScale = PixelRatio.getFontScale();
  return Math.round((fontSize * windowWidth * fontScale) / deviceBaseWidth);
}

export function scaleText(
  {
    deviceBaseWidth = DEVICE_BASE_WIDTH,
    fontSize = FONT_SIZE,
    lineHeight = fontSize * 1.2, // Default line height is 120% of the font size.
  },
  windowWidth,
) {
  const fontScale = PixelRatio.getFontScale();
  return {
    fontSize: Math.round(
      (fontSize * windowWidth * fontScale) / deviceBaseWidth,
    ),
    lineHeight: Math.round(
      (lineHeight * windowWidth * fontScale) / deviceBaseWidth,
    ),
  };
}

export function useScaleText({
  deviceBaseWidth = DEVICE_BASE_WIDTH,
  fontSize = FONT_SIZE,
  lineHeight = fontSize * 1.2, // Default line height is 120% of the font size.
}) {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  return useMemo(
    () => ({
      fontSize: Math.round((fontSize * width * fontScale) / deviceBaseWidth),
      lineHeight: Math.round(
        (lineHeight * width * fontScale) / deviceBaseWidth,
      ),
    }),
    [deviceBaseWidth, fontSize, width, lineHeight, fontScale],
  );
}

export default function ScalableText({
  deviceBaseWidth,
  style = {},
  ...props
}) {
  const { fontSize, lineHeight } = StyleSheet.flatten(style);
  const { ...scaledText } = useScaleText({
    deviceBaseWidth,
    fontSize,
    lineHeight,
  });
  return <Text style={[style, scaledText]} {...props} />;
}
