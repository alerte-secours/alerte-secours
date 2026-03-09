import React from "react";

import { View } from "react-native";
import Text from "~/components/Text";

export default function HelpBlock({ children, style, labelStyle, ...props }) {
  return (
    <View accessible accessibilityRole="text" style={[style]} {...props}>
      <Text style={[labelStyle]}>{children}</Text>
    </View>
  );
}
