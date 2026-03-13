// Retrieve nearby useful places from the embedded DB.
// Usage:
//   import getNearbyUsefulPlaces from "~/data/getNearbyUsefulPlaces";
//   const results = await getNearbyUsefulPlaces({ lat, lon, radiusMeters, limit, types });

import {
  getNearbyUsefulPlaces as queryNearby,
  getNearbyUsefulPlacesBbox,
} from "~/db/usefulPlacesRepo";

/**
 * Retrieve nearby useful places, sorted by distance.
 * Uses H3 spatial index with automatic bbox fallback.
 *
 * @param {Object}  params
 * @param {number}  params.lat
 * @param {number}  params.lon
 * @param {number}  params.radiusMeters
 * @param {number}  params.limit
 * @param {string[]} [params.types] - Filter by place types
 * @param {boolean} [params.progressive]
 * @returns {Promise<Array>}
 */
export default async function getNearbyUsefulPlaces({
  lat,
  lon,
  radiusMeters,
  limit,
  types = null,
  progressive = true,
}) {
  try {
    return await queryNearby({
      lat,
      lon,
      radiusMeters,
      limit,
      types,
      progressive,
    });
  } catch (err) {
    console.warn(
      "[USEFUL_PLACES_DB] H3 query failed, falling back to bbox:",
      err?.message,
    );
    if (err?.stack) {
      console.warn(`[USEFUL_PLACES_DB] stack:\n${err.stack}`);
    }
    return getNearbyUsefulPlacesBbox({
      lat,
      lon,
      radiusMeters,
      limit,
      types,
    });
  }
}
