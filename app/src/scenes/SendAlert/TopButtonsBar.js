import React from "react";
import { View } from "react-native";
import { createStyles } from "~/theme";

export default function TopButtonsBar({ children }) {
  const styles = useStyles();

  return <View style={styles.container}>{children}</View>;
}

const useStyles = createStyles(({ wp, hp }) => ({
  container: {
    flexDirection: "row",
    alignItems: "stretch", // Ensures both buttons have same height
    justifyContent: "space-between",
    marginTop: hp(1),
    marginBottom: hp(1),
    gap: wp(3), // Slightly more space between the buttons
    minHeight: 48, // Minimum touch target height for accessibility
  },
}));
