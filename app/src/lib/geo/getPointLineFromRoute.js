import { point, lineString } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";

const distanceOpts = { units: "meters", method: "geodesic" };

export default function getPointLineFromRoute(routeCoords, originCoords) {
  const routeLine = lineString(routeCoords);
  const originPoint = point(originCoords);

  const snappedPoint = nearestPointOnLine(routeLine, originPoint, distanceOpts);

  const distanceToLine = snappedPoint.properties.dist;

  const segmentIndex = snappedPoint.properties.index;

  const nextIndex = segmentIndex + 1;

  return {
    line: routeLine,
    distanceToLine,
    nextIndex,
    snappedPoint,
  };
}
