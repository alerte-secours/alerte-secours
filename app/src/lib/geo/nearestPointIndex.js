import distance from "@turf/distance";

export default function nearestPointIndex(targetPoint, points) {
  if (!targetPoint) throw new Error("targetPoint is required");
  if (!points) throw new Error("points is required");

  let minDist = Infinity;
  let bestFeatureIndex = 0;
  for (let i = 0; i < points.length; i++) {
    const distanceToPoint = distance(targetPoint, points[i]);
    if (distanceToPoint < minDist) {
      bestFeatureIndex = i;
      minDist = distanceToPoint;
    }
  }
  return bestFeatureIndex;
}
