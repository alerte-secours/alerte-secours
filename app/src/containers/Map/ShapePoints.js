import React from "react";
import * as Maplibre from "@maplibre/maplibre-react-native";
import { createStyles, useTheme } from "~/theme";

import { CLUSTER_MIN_ZOOM_LEVEL, HITBOX_SIZE, textFont } from "./constants";

import AlertClusterCircleLayer from "./AlertClusterCircleLayer";
import AlertSymbolLayer from "./AlertSymbolLayer";

// v11 ViewPadding hitbox: half the legacy square size on each side
const hitbox = {
  top: HITBOX_SIZE / 2,
  right: HITBOX_SIZE / 2,
  bottom: HITBOX_SIZE / 2,
  left: HITBOX_SIZE / 2,
};

const iconStyle = {
  iconImage: ["get", "icon"],
  iconSize: 0.5,
};

const defibStyle = {
  iconImage: "dae",
  iconSize: 0.5,
  iconAllowOverlap: true,
};

const useStyles = createStyles(({ theme: { colors } }) => ({
  clusterCount: {
    textField: "{point_count_abbreviated}",
    textSize: 12,
    textColor: colors.surface,
    textFont,
  },
}));

export default function ShapePoints({ shape, children, ...shapeSourceProps }) {
  const styles = useStyles();

  return (
    <Maplibre.GeoJSONSource data={shape} hitbox={hitbox} {...shapeSourceProps}>
      <Maplibre.Layer
        type="symbol"
        id="pointCount"
        beforeId="points-green"
        filter={["has", "point_count"]}
        minzoom={CLUSTER_MIN_ZOOM_LEVEL}
        style={styles.clusterCount}
      />

      <AlertClusterCircleLayer level="red" />
      <AlertClusterCircleLayer level="yellow" />
      <AlertClusterCircleLayer level="green" />

      <AlertSymbolLayer level="red" />
      <AlertSymbolLayer level="yellow" />
      <AlertSymbolLayer level="green" />

      <AlertSymbolLayer level="red" isDisabled />
      <AlertSymbolLayer level="yellow" isDisabled />
      <AlertSymbolLayer level="green" isDisabled />

      <Maplibre.Layer
        type="symbol"
        filter={["==", ["get", "icon"], "origin"]}
        key="points-origin"
        id="points-origin"
        style={iconStyle}
      />

      {/* Defibrillators (DAE) – separate layer (non-clustered) */}
      <Maplibre.Layer
        type="symbol"
        filter={["==", ["get", "isDefib"], true]}
        key="points-defib"
        id="points-defib"
        afterId="points-origin"
        style={defibStyle}
      />

      {children}
    </Maplibre.GeoJSONSource>
  );
}
