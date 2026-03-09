import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";
import humanizeDistance from "~/lib/geo/humanizeDistance";

export default function AlertInfoLineDistance({ alert, ...props }) {
  const { distance } = alert;
  if (distance === false) {
    return null;
  }
  const distanceText =
    typeof distance === "number" ? humanizeDistance(distance) : "";
  return (
    <AlertInfoLine
      iconName="map-marker-distance"
      labelText="Distance actuelle"
      valueText={distanceText}
      {...props}
    />
  );
}
