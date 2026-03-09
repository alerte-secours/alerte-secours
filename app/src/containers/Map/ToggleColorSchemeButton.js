import React, { useCallback } from "react";
import { View } from "react-native";
import { ToggleButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useParamsState, paramsActions } from "~/stores";
import { createStyles, useColorScheme } from "~/theme";

export default function ToggleColorSchemeButton({
  containerStyle = {},
  displayOnlyWhenDarkMode = true,
}) {
  const colorScheme = useColorScheme();
  const { mapColorScheme } = useParamsState(["mapColorScheme"]);

  const isDarkMap =
    mapColorScheme === "dark" ||
    (mapColorScheme === "auto" && colorScheme === "dark");

  const handleToggle = useCallback(() => {
    let newMapColorScheme = isDarkMap ? "light" : "dark";
    if (newMapColorScheme === colorScheme) {
      newMapColorScheme = "auto";
    }
    paramsActions.setMapColorScheme(newMapColorScheme);
  }, [colorScheme, isDarkMap]);

  const styles = useStyles();

  if (displayOnlyWhenDarkMode && colorScheme !== "dark") {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <ToggleButton
        onPress={handleToggle}
        accessibilityRole="switch"
        accessibilityLabel={
          isDarkMap
            ? "Basculer la carte en mode clair"
            : "Basculer la carte en mode sombre"
        }
        accessibilityHint="Change le thème de la carte."
        accessibilityState={{ checked: !!isDarkMap }}
        icon={() => (
          <Ionicons name={isDarkMap ? "sunny" : "moon"} style={styles.icon} />
        )}
        style={styles.button}
      />
    </View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  container: {
    flexDirection: "column",
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: 4,
  },
  button: {
    height: 32,
    width: 32,
    backgroundColor: colors.surface,
  },
  icon: {
    color: colors.onSurface,
    fontSize: 24,
  },
}));
