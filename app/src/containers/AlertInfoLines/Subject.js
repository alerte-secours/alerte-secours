import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";

export default function AlertInfoLineSubject({ alert, ...props }) {
  return (
    <AlertInfoLine
      iconName="bullhorn"
      labelText="Sujet"
      valueText={`${alert.subject || "non indiqué"}`}
      {...props}
    />
  );
}
