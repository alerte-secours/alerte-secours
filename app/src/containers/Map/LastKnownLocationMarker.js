import React from "react";
import Maplibre from "@maplibre/maplibre-react-native";
import LastKnownLocationCallout from "./LastKnownLocationCallout";

export default function LastKnownLocationMarker({
  coordinates,
  timestamp,
  id = "lastKnownLocation", // Allow custom ID to prevent conflicts
}) {
  const point = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [coordinates.longitude, coordinates.latitude],
    },
    properties: {},
  };

  return (
    <>
      <Maplibre.ShapeSource id={`${id}_source`} shape={point}>
        <Maplibre.CircleLayer
          id={`${id}_circle`}
          style={{
            circleRadius: 8,
            circleColor: "#666",
            circleOpacity: 0.7,
            circleStrokeWidth: 2,
            circleStrokeColor: "#fff",
          }}
        />
      </Maplibre.ShapeSource>
      <Maplibre.MarkerView
        id={`${id}_marker`}
        coordinate={[coordinates.longitude, coordinates.latitude]}
        anchor={{ x: 0.5, y: 1.2 }}
      >
        <LastKnownLocationCallout timestamp={timestamp} />
      </Maplibre.MarkerView>
    </>
  );
}
