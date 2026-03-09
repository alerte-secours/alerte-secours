import React from "react";
import Maplibre from "@maplibre/maplibre-react-native";

import env from "~/env";
import { Alignments } from "./constants";

import { useColorScheme } from "~/theme";
import { useParamsState, paramsActions } from "~/stores";

export default function MapView({
  mapRef,
  children,
  contentInset = Alignments.Center,
  compassViewPosition,
  compassViewMargin,
  ...mapViewProps
}) {
  const colorScheme = useColorScheme();
  const { mapColorScheme } = useParamsState(["mapColorScheme"]);

  const scheme = mapColorScheme === "auto" ? colorScheme : mapColorScheme;
  const mapStyleUrl =
    scheme === "dark" ? env.MAPVIEW_DARK_STYLE_URL : env.MAPVIEW_STYLE_URL;
  return (
    <Maplibre.MapView
      style={styles.mapView}
      // A11y: the map surface should not become a focus trap and should not
      // expose internal native nodes to screen readers.
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      attributionEnabled={false}
      logoEnabled={false}
      styleURL={`${mapStyleUrl}?cache=123456789`}
      zoomEnabled
      pitchEnabled
      compassEnabled
      compassViewPosition={compassViewPosition} // 0: TopLeft, 1: TopRight, 2: BottomLeft, 3: BottomRigh
      compassViewMargins={compassViewMargin}
      // surfaceView
      contentInset={contentInset}
      ref={(ref) => (mapRef.current = ref)}
      regionDidChangeDebounceTime={300}
      regionWillChangeDebounceTime={300}
      followHeading={compassViewPosition}
      {...mapViewProps}
    >
      {children}
    </Maplibre.MapView>
  );
}

const styles = {
  mapView: {
    flex: 1,
  },
};
