import React from "react";
import * as Maplibre from "@maplibre/maplibre-react-native";
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
      <Maplibre.GeoJSONSource id={`${id}_source`} data={point}>
        <Maplibre.Layer
          type="circle"
          id={`${id}_circle`}
          style={{
            circleRadius: 8,
            circleColor: "#666",
            circleOpacity: 0.7,
            circleStrokeWidth: 2,
            circleStrokeColor: "#fff",
          }}
        />
      </Maplibre.GeoJSONSource>
      <Maplibre.Marker
        id={`${id}_marker`}
        lngLat={[coordinates.longitude, coordinates.latitude]}
        anchor="bottom"
        offset={[0, -8]}
      >
        <LastKnownLocationCallout timestamp={timestamp} />
      </Maplibre.Marker>
    </>
  );
}
