import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";

export default function AlertInfoLineNear({ alert, ...props }) {
  return (
    <AlertInfoLine
      iconName="near-me"
      labelText="À proximité de"
      valueText={`${
        alert.nearestPlace ||
        (alert.nearestPlace === null ? "chargement..." : "non disponible")
      }`}
      {...props}
    />
  );
}
