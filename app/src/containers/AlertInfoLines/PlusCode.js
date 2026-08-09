import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";
import getPlusCode from "~/lib/geo/getPlusCode";

export default function AlertInfoLinePlusCode({ alert, ...props }) {
  return (
    <AlertInfoLine
      iconName="grid"
      labelText="Plus Code"
      valueText={getPlusCode(alert.location?.coordinates) || "non disponible"}
      {...props}
    />
  );
}
