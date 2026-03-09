import { point, lineString } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import distance from "@turf/distance";

const distanceOpts = { units: "meters", method: "geodesic" };

/**
 * @typedef {[number, number]} LonLat
 */

/**
 * Normalize a {latitude, longitude} object into a Turf-friendly [lon, lat] tuple.
 *
 * @param {{ latitude: number, longitude: number }} coords
 * @returns {LonLat}
 */
export function toLonLat({ latitude, longitude }) {
  return [longitude, latitude];
}

/**
 * Compute a radius (meters) for a single DB query around the segment midpoint.
 * Strategy: radius = segmentLength/2 + corridorMeters.
 *
 * @param {Object} params
 * @param {LonLat} params.userLonLat
 * @param {LonLat} params.alertLonLat
 * @param {number} params.corridorMeters
 * @returns {number}
 */
export function computeCorridorQueryRadiusMeters({
  userLonLat,
  alertLonLat,
  corridorMeters,
}) {
  const segmentMeters = distance(
    point(userLonLat),
    point(alertLonLat),
    distanceOpts,
  );
  return Math.max(0, segmentMeters / 2 + corridorMeters);
}

/**
 * Filter defibs to those within a corridor around the user→alert segment.
 * Corridor definition: distance(point, lineSegment(user→alert)) <= corridorMeters.
 *
 * @template T
 * @param {Object} params
 * @param {T[]} params.defibs
 * @param {LonLat} params.userLonLat
 * @param {LonLat} params.alertLonLat
 * @param {number} params.corridorMeters
 * @returns {T[]}
 */
export function filterDefibsInCorridor({
  defibs,
  userLonLat,
  alertLonLat,
  corridorMeters,
}) {
  const line = lineString([userLonLat, alertLonLat]);

  const filtered = [];
  for (const defib of defibs) {
    const lon = defib.longitude;
    const lat = defib.latitude;
    if (typeof lon !== "number" || typeof lat !== "number") continue;

    const p = point([lon, lat]);
    const snapped = nearestPointOnLine(line, p, distanceOpts);
    const distToLine = snapped?.properties?.dist;
    if (typeof distToLine === "number" && distToLine <= corridorMeters) {
      filtered.push(defib);
    }
  }

  return filtered;
}
