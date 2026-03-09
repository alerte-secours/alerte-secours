import React from "react";

import { Text } from "react-native";

import { fontFamily, useTheme } from "~/theme";

const defaulStyle = {
  fontFamily,
};

export default function AppText({
  style = {},
  allowFontScaling = true,
  ...props
}) {
  const { colors } = useTheme();
  // return <ScalableText style={[defaulStyle,style]} {...props} />
  return (
    <Text
      style={[defaulStyle, { color: colors.onSurface }, style]}
      allowFontScaling={allowFontScaling}
      {...props}
    />
  );
}
