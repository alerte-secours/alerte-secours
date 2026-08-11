import React from "react";
import * as Maplibre from "@maplibre/maplibre-react-native";

import { levelNum, numLevel, numMax } from "~/misc/levelNum";

const iconStyle = {
  iconImage: ["get", "icon"],
  iconSize: 0.5,
};

export default function AlertSymbolLayer({ level, isDisabled }) {
  const key = `points-${level}${isDisabled ? "-disabled" : ""}`;
  const num = levelNum[level];
  const aboveLevel = numLevel[num + 1];
  const icon = `${level}${isDisabled ? "Disabled" : ""}`;

  let beforeId = null;
  if (aboveLevel) {
    // Maintain level ordering within each group (disabled and non-disabled)
    beforeId = `points-${aboveLevel}${isDisabled ? "-disabled" : ""}`;
  } else if (!isDisabled) {
    // If this is the highest non-disabled level (red), put it above the highest disabled level
    beforeId = `points-${numLevel[numMax]}-disabled`;
  }

  return (
    <Maplibre.Layer
      type="symbol"
      filter={[
        "all",
        ["==", ["get", "icon"], icon],
        // Exclude DAE overlay markers (v1: separate non-clustered layer)
        ["!=", ["get", "isDefib"], true],
      ]}
      key={key}
      id={key}
      beforeId={beforeId}
      style={iconStyle}
    />
  );
}
