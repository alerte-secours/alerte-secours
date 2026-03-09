import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";
import humanizeDistance from "~/lib/geo/humanizeDistance";

export default function AlertInfoLineRadius({ alert, ...props }) {
  if (!alert.notifyAround) {
    return null;
  }
  return (
    <AlertInfoLine
      iconName="radius"
      labelText="Rayon de signalisation"
      valueText={`${
        (alert.radius && humanizeDistance(alert.radius)) ||
        (alert.radius === null ? "chargement..." : "non disponible")
      }`}
      {...props}
    />
  );
}
