import React from "react";
import Maplibre from "@maplibre/maplibre-react-native";

import { useTheme } from "~/theme";

import { CLUSTER_MIN_ZOOM_LEVEL, textFont } from "./constants";

export default function AlertClusterCircleLayer({ level }) {
  const { colors, custom } = useTheme();
  const style = {
    ...styles.clusteredPoints,
    circleColor: custom.appColors[level],
  };

  const key = `clusteredPoints-${level}`;
  return (
    <Maplibre.CircleLayer
      key={key}
      id={key}
      minZoomLevel={CLUSTER_MIN_ZOOM_LEVEL}
      belowLayerID="pointCount"
      filter={["==", ["get", "x_max_level"], level]}
      style={style}
    />
  );
}

const styles = {
  clusteredPoints: {
    // circleColor: "#004466",
    circleRadius: [
      "interpolate",
      ["exponential", 1.5],
      ["get", "point_count"],
      15,
      15,
      20,
      30,
    ],
    circleOpacity: 0.84,
    textFont,
  },
};
