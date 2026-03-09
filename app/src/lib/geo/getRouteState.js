import getPointLineFromRoute from "~/lib/geo/getPointLineFromRoute";

const MAX_ROUTE_DISTANCE = 20;

export default function getRouteState(originPoint, routePoints, options = {}) {
  const { maxRouteDistance = MAX_ROUTE_DISTANCE } = options;

  if (routePoints.length < 2) {
    return { distanceToLine: 0, line: null, nextIndex: 0, isOffRoute: true };
  }

  const { distanceToLine, line, nextIndex, snappedPoint } =
    getPointLineFromRoute(routePoints, originPoint);
  const isOffRoute = distanceToLine > maxRouteDistance;
  return {
    distanceToLine,
    line,
    nextIndex,
    isOffRoute,
    snappedPoint, // Pass the snapped point along
  };
}
