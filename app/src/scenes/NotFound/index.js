import React from "react";

import { View, StyleSheet } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";

import { createStyles } from "~/theme";

export default function NotFound({ containerProps = {} }) {
  const styles = useStyles();
  return (
    <View {...containerProps} style={[styles.container, containerProps.style]}>
      <MaterialCommunityIcons
        style={styles.icon}
        name="robot-dead-outline"
        size={48}
      />
      <Text style={styles.label}>Ce lien est invalide</Text>
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
