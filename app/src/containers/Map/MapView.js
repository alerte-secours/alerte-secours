import React from "react";
import * as Maplibre from "@maplibre/maplibre-react-native";

import env from "~/env";
import { Alignments } from "./constants";

import { useColorScheme } from "~/theme";
import { useParamsState } from "~/stores";

// Convert legacy compass position (0: TopLeft, 1: TopRight, 2: BottomLeft,
// 3: BottomRight) + {x, y} margins to a v11 OrnamentViewPosition object.
const toOrnamentPosition = (position, margin = { x: 10, y: 10 }) => {
  switch (position) {
    case 0:
      return { top: margin.y, left: margin.x };
    case 2:
      return { bottom: margin.y, left: margin.x };
    case 3:
      return { bottom: margin.y, right: margin.x };
    case 1:
    default:
      return { top: margin.y, right: margin.x };
  }
};

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
    <Maplibre.Map
      style={styles.mapView}
      // A11y: the map surface should not become a focus trap and should not
      // expose internal native nodes to screen readers.
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      attribution={false}
      logo={false}
      mapStyle={`${mapStyleUrl}?cache=123456789`}
      touchZoom
      doubleTapZoom
      touchPitch
      compass
      compassPosition={toOrnamentPosition(
        compassViewPosition,
        compassViewMargin,
      )}
      contentInset={contentInset}
      ref={mapRef ? (ref) => (mapRef.current = ref) : undefined}
      {...mapViewProps}
    >
      {children}
    </Maplibre.Map>
  );
}

const styles = {
  mapView: {
    flex: 1,
  },
};
