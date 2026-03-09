import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import AlertInfoLine from "~/containers/AlertInfoLine";

export default function AlertInfoLineCode({ alert, ...props }) {
  return (
    <AlertInfoLine
      Icon={FontAwesome}
      iconName="hashtag"
      labelText="Code"
      valueText={alert.code}
      {...props}
    />
  );
}
