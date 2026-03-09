import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AlertInfoLine from "~/containers/AlertInfoLine";
import useTimeDisplay from "~/hooks/useTimeDisplay";

export default function AlertInfoLineClosedTime({ alert, ...props }) {
  const { closedAt } = alert;
  const closedAtText = useTimeDisplay(closedAt);
  if (!closedAt) {
    return null;
  }

  return (
    <AlertInfoLine
      iconName={"clock-time-four-outline"}
      labelText={`Terminée`}
      valueText={closedAtText}
      {...props}
    />
  );
}
