import React from "react";

import Text from "~/components/Text";
import { useTheme } from "~/theme";

export default function ErrorMessage({ error }) {
  const { colors, custom } = useTheme();
  return (
    <Text key="error" style={{ color: colors.error }}>
      {error.message || ""}
    </Text>
  );
}
