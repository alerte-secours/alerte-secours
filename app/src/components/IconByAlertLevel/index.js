import React from "react";

import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function IconByAlertLevel({ level, style, ...props }) {
  let name;
  switch (level) {
    case "red":
      name = "heart-pulse";
      break;
    case "yellow":
      name = "alert";
      break;
    case "green":
      // name = "hand-back-left";
      // name = "hand-front-left";
      // name = "hands-pray";
      name = "handshake";
      break;
    case "call":
      name = "phone";
      break;
    default:
    case "unknown":
      name = "magnify";
      break;
  }
  return (
    <MaterialCommunityIcons
      name={name}
      style={[styles.alertLevelIcon, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  alertLevelIcon: {},
});
