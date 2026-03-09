import React, { useCallback } from "react";
import { View } from "react-native";
import { ToggleButton } from "react-native-paper";
import { Feather } from "@expo/vector-icons";

import { createStyles, useTheme } from "~/theme";
import {
  MAPS_MAX_ZOOM_LEVEL,
  MAPS_MIN_ZOOM_LEVEL,
  DEFAULT_ZOOM_LEVEL,
} from "./constants";

export default function StepZoomButtonGroup({
  mapRef,
  // cameraRef,
  setZoomLevel,
}) {
  const { colors, custom } = useTheme();

  const styles = useStyles();
  const zoomIn = useCallback(async () => {
    const { current: map } = mapRef;
    const initialZoom = (await map?.getZoom()) || DEFAULT_ZOOM_LEVEL;
    let zoom = Math.round(initialZoom) + 1;
    if (zoom > MAPS_MAX_ZOOM_LEVEL) {
      zoom = Math.max(MAPS_MAX_ZOOM_LEVEL, initialZoom);
    }
    // camera.zoomTo(zoom, ZOOM_DURATION);
    setZoomLevel(zoom);
  }, [mapRef, setZoomLevel]);

  const zoomOut = useCallback(async () => {
    const { current: map } = mapRef;
    let zoom = await map.getZoom();
    zoom = Math.round(zoom) - 1;
    if (zoom < MAPS_MIN_ZOOM_LEVEL) {
      zoom = MAPS_MIN_ZOOM_LEVEL;
    }
    // camera.zoomTo(zoom, ZOOM_DURATION);
    setZoomLevel(zoom);
  }, [mapRef, setZoomLevel]);

  return (
    <>
      <View style={styles.zoomButtonGroup}>
        <ToggleButton
          style={[styles.zoomButton, styles.zoomInButton]}
          onPress={zoomIn}
          accessibilityRole="button"
          accessibilityLabel="Zoom avant"
          accessibilityHint="Augmente le niveau de zoom de la carte."
          icon={() => (
            <Feather name="zoom-in" size={24} style={styles.zoomIcon} />
          )}
        />
        <ToggleButton
          style={[styles.zoomButton, styles.zoomOutButton]}
          onPress={zoomOut}
          accessibilityRole="button"
          accessibilityLabel="Zoom arrière"
          accessibilityHint="Diminue le niveau de zoom de la carte."
          icon={() => (
            <Feather name="zoom-out" size={24} style={styles.zoomIcon} />
          )}
        />
      </View>
    </>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  zoomButtonGroup: {
    flexDirection: "column",
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  zoomButton: {
    height: 32,
    width: 32,
    backgroundColor: colors.surface,
  },
  zoomInButton: {
    borderBottomWidth: 0.2,
    borderBottomColor: colors.grey,
  },
  zoomOutButton: {},
  zoomIcon: {
    color: colors.onSurface,
  },
}));
