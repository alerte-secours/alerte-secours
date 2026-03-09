import React from "react";
import { ToggleButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { createStyles } from "~/theme";

export default function ToggleZoomButton({ value, selected, iconName, icon }) {
  const styles = useStyles();
  if (selected !== value) {
    return null;
  }

  const a11yLabelByValue = {
    TRACK_ALERT_RADIUS_ALL: "Afficher le rayon de toutes les alertes",
    TRACK_ALERT_RADIUS_REACH:
      "Afficher le rayon des alertes sans contact plus proche",
    TRACK_ALERTING: "Afficher le rayon des alertes en cours",
    NAVIGATION: "Afficher le mode navigation",
  };

  return (
    <ToggleButton
      style={styles.boundTypeButton}
      accessibilityRole="button"
      accessibilityLabel={
        a11yLabelByValue[String(value)] || "Changer le mode d'affichage"
      }
      accessibilityHint="Change le mode d'affichage de la carte."
      icon={() =>
        icon ? (
          icon
        ) : (
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            style={styles.icon}
          />
        )
      }
      value={value}
    />
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  boundTypeButton: {
    backgroundColor: colors.surface,
    height: 32,
    width: 32,
  },
  icon: {
    color: colors.onSurface,
  },
}));
