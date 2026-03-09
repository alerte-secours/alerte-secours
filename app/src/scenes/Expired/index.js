import React from "react";

import { View, StyleSheet } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";
import Text from "~/components/Text";

export default function Expired({ containerProps = {} }) {
  const styles = useStyles();
  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      <MaterialCommunityIcons style={styles.icon} name="timelapse" size={48} />
      <Text style={styles.label}>Ce lien est expiré</Text>
    </View>
  );
}

const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    paddingBottom: 15,
    color: colors.primary,
  },
  label: {
    textAlign: "center",
    fontSize: 15,
  },
}));
