import React from "react";

import SelectedFeatureBubbleAlert from "./SelectedFeatureBubbleAlert";
import SelectedFeatureBubbleAlertInitial from "./SelectedFeatureBubbleAlertInitial";

export default function SelectedFeatureBubble(props) {
  const { properties = {} } = props.feature;
  if (properties.alert) {
    // Check if this is an initial location marker
    if (properties.isInitialLocation) {
      return <SelectedFeatureBubbleAlertInitial {...props} />;
    }
    return <SelectedFeatureBubbleAlert {...props} />;
  }
  return null;
}
