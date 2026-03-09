// Defibrillator repository — nearby queries with H3 geo-indexing.
import { latLngToCell, gridDisk } from "~/lib/h3";

import { getDbSafe } from "./openDb";
import haversine from "~/utils/geo/haversine";

// H3 average edge lengths in meters per resolution (0..15).
const H3_EDGE_M = [
  1107712, 418676, 158244, 59810, 22606, 8544, 3229, 1220, 461, 174, 65, 24, 9,
  3, 1, 0.5,
];

const H3_RES = 8;

// SQLite max variable number is 999 by default; chunk IN() queries accordingly.
const SQL_VAR_LIMIT = 900;

// Compute k (ring size) needed to cover a given radius at a given H3 resolution.
function kForRadius(radiusMeters, res = H3_RES) {
  const edge = H3_EDGE_M[res];
  // sqrt(3) * edge ≈ diameter between parallel edges of a hexagon
  return Math.max(1, Math.ceil(radiusMeters / (edge * Math.sqrt(3))));
}

// Build a bounding-box fallback SQL clause + params.
function bboxClause(lat, lon, radiusMeters) {
  // 1 degree latitude ≈ 111_320 m
  const dLat = radiusMeters / 111_320;
  // 1 degree longitude shrinks with cos(lat)
  const dLon = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    clause: "latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
    params: [lat - dLat, lat + dLat, lon - dLon, lon + dLon],
  };
}

/**
 * @typedef {Object} Defib
 * @property {string}  id
 * @property {number}  latitude
 * @property {number}  longitude
 * @property {string}  nom
 * @property {string}  adresse
 * @property {string}  horaires
 * @property {Object}  horaires_std
 * @property {number[]|null} horaires_std.days - ISO 8601 day numbers (1=Mon…7=Sun)
 * @property {{open:string,close:string}[]|null} horaires_std.slots - Time ranges
 * @property {boolean} horaires_std.is24h
 * @property {boolean} horaires_std.businessHours
 * @property {boolean} horaires_std.nightHours
 * @property {boolean} horaires_std.events
 * @property {string}  horaires_std.notes
 * @property {string}  acces
 * @property {number}  disponible_24h
 */

/**
 * Fetch defibrillators near a given point.
 *
 * @param {Object}  params
 * @param {number}  params.lat                 - User latitude
 * @param {number}  params.lon                 - User longitude
 * @param {number}  params.radiusMeters        - Search radius in meters
 * @param {number}  params.limit               - Max results returned
 * @param {boolean} [params.disponible24hOnly] - Filter 24/7 accessible only
 * @param {boolean} [params.progressive]       - Enable progressive expansion (k=1,2,3…)
 * @returns {Promise<(Defib & { distanceMeters: number })[]>}
 */
export async function getNearbyDefibs({
  lat,
  lon,
  radiusMeters,
  limit,
  disponible24hOnly = false,
  progressive = false,
}) {
  const { db, error } = await getDbSafe();
  if (!db) {
    throw error || new Error("DAE DB unavailable");
  }
  const maxK = kForRadius(radiusMeters);

  if (progressive) {
    return progressiveSearch(
      db,
      lat,
      lon,
      radiusMeters,
      limit,
      disponible24hOnly,
      maxK,
    );
  }

  // One-shot: compute full disk and query
  const cells = gridDisk(latLngToCell(lat, lon, H3_RES), maxK);
  const candidates = await queryCells(db, cells, disponible24hOnly);
  return rankAndFilter(candidates, lat, lon, radiusMeters, limit);
}

// Progressive expansion: start at k=1, expand until enough results or maxK.
async function progressiveSearch(
  db,
  lat,
  lon,
  radiusMeters,
  limit,
  dispo24h,
  maxK,
) {
  let allCandidates = [];
  const seenIds = new Set();

  for (let k = 1; k <= maxK; k++) {
    const cells = gridDisk(latLngToCell(lat, lon, H3_RES), k);
    const rows = await queryCells(db, cells, dispo24h);

    for (const row of rows) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        allCandidates.push(row);
      }
    }

    // Early exit: if we already have more candidates than limit, rank and check
    if (allCandidates.length >= limit) {
      const ranked = rankAndFilter(
        allCandidates,
        lat,
        lon,
        radiusMeters,
        limit,
      );
      if (ranked.length >= limit) return ranked;
    }
  }

  return rankAndFilter(allCandidates, lat, lon, radiusMeters, limit);
}

// Query the DB for rows matching a set of H3 cells, chunking if needed.
async function queryCells(db, cells, dispo24h) {
  if (cells.length === 0) return [];

  const results = [];

  // Chunk cells to stay under SQLite variable limit
  for (let i = 0; i < cells.length; i += SQL_VAR_LIMIT) {
    const chunk = cells.slice(i, i + SQL_VAR_LIMIT);
    const placeholders = chunk.map(() => "?").join(",");

    let sql = `SELECT id, latitude, longitude, nom, adresse, horaires, horaires_std, acces, disponible_24h
               FROM defibs WHERE h3 IN (${placeholders})`;
    const params = [...chunk];

    if (dispo24h) {
      sql += " AND disponible_24h = 1";
    }

    const rows = await db.getAllAsync(sql, params);
    results.push(...rows);
  }

  return results;
}

// Parse horaires_std JSON string into object.
function parseHorairesStd(row) {
  try {
    return { ...row, horaires_std: JSON.parse(row.horaires_std) };
  } catch {
    return { ...row, horaires_std: null };
  }
}

// Compute distance, filter by radius, sort, and limit.
function rankAndFilter(candidates, lat, lon, radiusMeters, limit) {
  const withDist = [];
  for (const row of candidates) {
    const distanceMeters = haversine(lat, lon, row.latitude, row.longitude);
    if (distanceMeters <= radiusMeters) {
      withDist.push({ ...parseHorairesStd(row), distanceMeters });
    }
  }
  withDist.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return withDist.slice(0, limit);
}

/**
 * Bbox fallback — use when H3 is unavailable.
 *
 * @param {Object}  params
 * @param {number}  params.lat
 * @param {number}  params.lon
 * @param {number}  params.radiusMeters
 * @param {number}  params.limit
 * @param {boolean} [params.disponible24hOnly]
 * @returns {Promise<(Defib & { distanceMeters: number })[]>}
 */
export async function getNearbyDefibsBbox({
  lat,
  lon,
  radiusMeters,
  limit,
  disponible24hOnly = false,
}) {
  const { db, error } = await getDbSafe();
  if (!db) {
    throw error || new Error("DAE DB unavailable");
  }
  const { clause, params } = bboxClause(lat, lon, radiusMeters);

  let sql = `SELECT id, latitude, longitude, nom, adresse, horaires, horaires_std, acces, disponible_24h
             FROM defibs WHERE ${clause}`;
  if (disponible24hOnly) {
    sql += " AND disponible_24h = 1";
  }

  const rows = await db.getAllAsync(sql, params);
  return rankAndFilter(rows, lat, lon, radiusMeters, limit);
}
