import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";
import { BoundType } from "./constants";

export default function TargetButton({
  userCoords,
  cameraRef,
  boundType,
  setBoundType,
  refreshCamera,
}) {
  // Check if we have valid coordinates
  const hasUserCoords =
    userCoords && userCoords.latitude !== null && userCoords.longitude !== null;

  const styles = useStyles();
  return (
    <>
      <View style={styles.labelToggleButtonContainer}>
        <Button
          labelStyle={styles.labelButton}
          accessibilityRole="button"
          accessibilityLabel={
            boundType === BoundType.NAVIGATION
              ? "Recentrer sur l'itinéraire"
              : "Passer en mode navigation"
          }
          accessibilityHint="Replace la carte sur votre position et l'itinéraire."
          onPress={() => {
            setBoundType(BoundType.NAVIGATION);
            if (boundType === BoundType.NAVIGATION) {
              refreshCamera();
            }
            // Only attempt camera operations if we have valid coordinates
            // if (hasUserCoords && cameraRef.current) {
            //   cameraRef.current.flyTo([userCoords.longitude, userCoords.latitude]);
            // }
          }}
          icon={() => (
            <MaterialCommunityIcons
              // name="navigation"
              // name="navigation-variant"
              // name="navigation-variant-outline"
              name="navigation-outline"
              size={24}
              style={styles.labelButtonIcon}
            />
          )}
        >
          {boundType === BoundType.NAVIGATION ? "Recentrer" : "Navigation"}
        </Button>
      </View>
    </>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  labelToggleButtonContainer: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  labelButton: {
    fontSize: 16,
    color: colors.onSurface,
  },
  labelButtonIcon: {
    color: colors.onSurface,
  },
}));
