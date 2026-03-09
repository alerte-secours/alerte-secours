import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";

export default function AlertInfoLineW3w({ alert, ...props }) {
  return (
    <AlertInfoLine
      iconName="slash-forward-box"
      labelText="Localisation en 3 mots"
      valueText={`${
        alert.what3Words ||
        (alert.what3Words === null ? "chargement..." : "non disponible")
      }`}
      {...props}
    />
  );
}
