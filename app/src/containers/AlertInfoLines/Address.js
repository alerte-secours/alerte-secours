import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";

export default function AlertInfoLineAddress({ alert, ...props }) {
  return (
    <AlertInfoLine
      iconName="home-map-marker"
      labelText="Adresse"
      valueText={`${
        alert.address ||
        (alert.address === null ? "chargement..." : "non disponible")
      }`}
      {...props}
    />
  );
}
