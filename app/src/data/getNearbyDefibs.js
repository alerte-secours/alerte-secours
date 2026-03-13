// Final exported function to retrieve nearby defibrillators from the unified DB.
// Uses the unified useful_places repository with type='dae' filter.
// Usage:
//   import getNearbyDefibs from "~/data/getNearbyDefibs";
//   const results = await getNearbyDefibs({ lat: 48.8566, lon: 2.3522, radiusMeters: 1000, limit: 20 });

import {
  getNearbyDefibs as queryNearby,
  getNearbyDefibsBbox,
} from "~/db/usefulPlacesRepo";

// Map unified schema field names to legacy DAE field names for compatibility.
function toDefibCompat(row) {
  if (!row) return row;
  return {
    ...row,
    // Legacy consumers expect "horaires" (DAEItem/Infos.js), unified schema uses "horaires_raw"
    horaires: row.horaires_raw ?? null,
  };
}

/**
 * Retrieve nearby defibrillators, sorted by distance.
 * Uses H3 spatial index with automatic bbox fallback.
 *
 * @param {Object}  params
 * @param {number}  params.lat                 - User latitude (WGS84)
 * @param {number}  params.lon                 - User longitude (WGS84)
 * @param {number}  params.radiusMeters        - Search radius in meters
 * @param {number}  params.limit               - Maximum number of results
 * @param {boolean} [params.progressive]       - Progressive H3 ring expansion (saves queries for small radii)
 * @returns {Promise<Array>}
 */
export default async function getNearbyDefibs({
  lat,
  lon,
  radiusMeters,
  limit,
  progressive = true,
}) {
  try {
    const rows = await queryNearby({
      lat,
      lon,
      radiusMeters,
      limit,
      progressive,
    });
    return rows.map(toDefibCompat);
  } catch (err) {
    // Fallback to bbox if H3 fails (e.g. missing h3-js on a platform)
    console.warn(
      "[getNearbyDefibs] H3 query failed, falling back to bbox:",
      err?.message,
    );
    if (err?.stack) {
      console.warn(`[getNearbyDefibs] stack:\n${err.stack}`);
    }
    const rows = await getNearbyDefibsBbox({
      lat,
      lon,
      radiusMeters,
      limit,
    });
    return rows.map(toDefibCompat);
  }
}
