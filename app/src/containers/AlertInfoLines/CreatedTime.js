import React from "react";
import AlertInfoLine from "~/containers/AlertInfoLine";
import useTimeDisplay from "~/hooks/useTimeDisplay";

export default function AlertInfoLineCreatedTime({ alert, ...props }) {
  const { createdAt } = alert;
  const createdAtText = useTimeDisplay(createdAt, { short: false });
  return (
    <AlertInfoLine
      iconName="clock"
      labelText="Alerte lancée"
      valueText={createdAtText}
      {...props}
    />
  );
}
