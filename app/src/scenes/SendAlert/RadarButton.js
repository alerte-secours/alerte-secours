import React, { forwardRef } from "react";
import { View, Platform } from "react-native";
import { IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";

const RadarButton = forwardRef(function RadarButton(
  { onPress, isLoading = false, isExpanded = false, flex = 0.22 },
  ref,
) {
  const styles = useStyles();

  return (
    <View style={[styles.container, { flex }]}>
      <IconButton
        ref={ref}
        accessibilityLabel="Radar - Voir les utilisateurs Alerte-Secours prêts à porter secours aux alentours"
        accessibilityHint="Affiche les utilisateurs prêts à porter secours à proximité."
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading, expanded: isExpanded }}
        mode="contained"
        size={24}
        style={styles.button}
        onPress={onPress}
        disabled={isLoading}
        icon={({ size, color }) => (
          <MaterialCommunityIcons
            name="radar"
            size={size}
            color={color}
            style={styles.icon}
          />
        )}
      />
    </View>
  );
});

export default RadarButton;

const useStyles = createStyles(({ wp, hp, theme: { colors, custom } }) => ({
  container: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
    flex: 1, // Stretch to fill available space
  },
  button: {
    backgroundColor: colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minHeight: 48, // Match minimum touch target height
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: Platform.select({ ios: "hidden", android: "visible" }),
  },
  icon: {
    color: colors.onPrimary,
  },
}));
