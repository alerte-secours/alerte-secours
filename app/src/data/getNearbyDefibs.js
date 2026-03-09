// Final exported function to retrieve nearby defibrillators from the embedded DB.
// Usage:
//   import getNearbyDefibs from "~/data/getNearbyDefibs";
//   const results = await getNearbyDefibs({ lat: 48.8566, lon: 2.3522, radiusMeters: 1000, limit: 20 });

import {
  getNearbyDefibs as queryNearby,
  getNearbyDefibsBbox,
} from "~/db/defibsRepo";

/**
 * @typedef {Object} DefibResult
 * @property {string}  id
 * @property {number}  latitude
 * @property {number}  longitude
 * @property {string}  nom
 * @property {string}  adresse
 * @property {string}  horaires
 * @property {string}  acces
 * @property {number}  disponible_24h
 * @property {number}  distanceMeters
 */

/**
 * Retrieve nearby defibrillators, sorted by distance.
 * Uses H3 spatial index with automatic bbox fallback.
 *
 * @param {Object}  params
 * @param {number}  params.lat                 - User latitude (WGS84)
 * @param {number}  params.lon                 - User longitude (WGS84)
 * @param {number}  params.radiusMeters        - Search radius in meters
 * @param {number}  params.limit               - Maximum number of results
 * @param {boolean} [params.disponible24hOnly] - Only return 24/7 accessible defibrillators
 * @param {boolean} [params.progressive]       - Progressive H3 ring expansion (saves queries for small radii)
 * @returns {Promise<DefibResult[]>}
 */
export default async function getNearbyDefibs({
  lat,
  lon,
  radiusMeters,
  limit,
  disponible24hOnly = false,
  progressive = true,
}) {
  try {
    return await queryNearby({
      lat,
      lon,
      radiusMeters,
      limit,
      disponible24hOnly,
      progressive,
    });
  } catch (err) {
    // Fallback to bbox if H3 fails (e.g. missing h3-js on a platform)
    console.warn("[DAE_DB] H3 query failed, falling back to bbox raw:", err);
    console.warn(
      "[DAE_DB] H3 query failed, falling back to bbox message:",
      err?.message,
    );
    if (err?.stack) {
      console.warn(
        `[DAE_DB] H3 query failed, falling back to bbox stack:\n${err.stack}`,
      );
    }
    return getNearbyDefibsBbox({
      lat,
      lon,
      radiusMeters,
      limit,
      disponible24hOnly,
    });
  }
}
