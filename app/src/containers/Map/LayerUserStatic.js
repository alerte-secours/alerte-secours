import React from "react";
import * as Maplibre from "@maplibre/maplibre-react-native";
import { useTheme } from "~/theme";

export default function LayerUserStatic() {
  const { colors, custom } = useTheme();
  const layerStyles = {
    pluse: {
      circleRadius: 15,
      circleColor: mapboxBlue,
      circleOpacity: 0.2,
      circlePitchAlignment: "map",
    },
    background: {
      circleRadius: 9,
      circleColor: colors.surface,
      circlePitchAlignment: "map",
    },
    foreground: {
      circleRadius: 6,
      circleColor: mapboxBlue,
      circlePitchAlignment: "map",
    },
  };

  return (
    <>
      <Maplibre.Layer
        type="circle"
        filter={["==", "isUserLocation", true]}
        key="mapboxUserLocationPluseCircle"
        id="mapboxUserLocationPluseCircle"
        style={layerStyles.pluse}
        afterId="points-red"
      />
      <Maplibre.Layer
        type="circle"
        filter={["==", "isUserLocation", true]}
        key="mapboxUserLocationWhiteCircle"
        id="mapboxUserLocationWhiteCircle"
        style={layerStyles.background}
        afterId="points-red"
      />
      <Maplibre.Layer
        type="circle"
        filter={["==", "isUserLocation", true]}
        key="mapboxUserLocationBlueCicle"
        id="mapboxUserLocationBlueCicle"
        afterId="mapboxUserLocationWhiteCircle"
        style={layerStyles.foreground}
      />
    </>
  );
}

const mapboxBlue = "rgba(51, 181, 229, 100)";
