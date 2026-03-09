import React from "react";

import { Entypo } from "@expo/vector-icons";

import { createStyles, useTheme } from "~/theme";

import { useAlertState } from "~/stores";

export default function AlertCurTabBarIcon({ style, ...props }) {
  const { navAlertCur } = useAlertState(["navAlertCur"]);
  const styles = useStyles();

  const { colors, custom } = useTheme();

  return (
    <Entypo
      name="circular-graph"
      style={[
        style,
        styles.icon,
        navAlertCur
          ? { color: custom.appColors[navAlertCur.alert.level] }
          : null,
      ]}
      {...props}
    />
  );
}

const useStyles = createStyles(({ fontSize }) => ({
  icon: {
    fontSize: fontSize(18),
  },
}));
