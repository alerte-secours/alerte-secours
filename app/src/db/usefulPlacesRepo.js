// Useful places repository — nearby queries with H3 geo-indexing.
// Unified repository for all place types (DAE, police, gendarmerie, hospitals, Angela).

import { latLngToCell, gridDisk } from "~/lib/h3";
import haversine from "~/utils/geo/haversine";

// H3 average edge lengths in meters per resolution (0..15).
const H3_EDGE_M = [
  1107712, 418676, 158244, 59810, 22606, 8544, 3229, 1220, 461, 174, 65, 24, 9,
  3, 1, 0.5,
];

const H3_RES = 8;
const SQL_VAR_LIMIT = 900;

let _dbBackend = null;

/**
 * Get the useful_places DB instance (lazy, cached).
 * Delegates caching to openUsefulPlacesDb's singleton _dbPromise
 * to avoid desync between two separate cached promises.
 */
async function getUsefulPlacesDb() {
  // eslint-disable-next-line global-require
  const { openUsefulPlacesDb } = require("./openUsefulPlacesDb");
  const db = await openUsefulPlacesDb();
  _dbBackend = db;
  return db;
}

/**
 * Reset the DB connection (called during OTA updates).
 * IMPORTANT: No concurrent DB queries should be in flight at this point.
 * The caller (updateUsefulPlacesDb) must ensure all queries have settled
 * before calling this function.
 */
export function resetUsefulPlacesDb() {
  const oldBackend = _dbBackend;
  _dbBackend = null;

  if (oldBackend && typeof oldBackend.close === "function") {
    try {
      oldBackend.close();
    } catch {
      // Non-fatal: DB may already be closed or in an invalid state.
    }
  }
}

async function getDbSafe() {
  try {
    const db = await getUsefulPlacesDb();
    return { db, error: null };
  } catch (error) {
    return { db: null, error };
  }
}

function kForRadius(radiusMeters, res = H3_RES) {
  const edge = H3_EDGE_M[res];
  return Math.max(1, Math.ceil(radiusMeters / (edge * Math.sqrt(3))));
}

function bboxClause(lat, lon, radiusMeters) {
  const dLat = radiusMeters / 111_320;
  const dLon = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    clause: "latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
    params: [lat - dLat, lat + dLat, lon - dLon, lon + dLon],
  };
}

const SELECT_COLS = `id, type, source_dataset, source_id, nom, adresse, code_postal,
  commune, departement, latitude, longitude, telephone, horaires_raw,
  horaires_std, acces, disponible_24h, url`;

/**
 * Fetch useful places near a given point.
 *
 * @param {Object}  params
 * @param {number}  params.lat
 * @param {number}  params.lon
 * @param {number}  params.radiusMeters
 * @param {number}  params.limit
 * @param {string[]} [params.types] - Filter by place types (e.g. ['dae', 'police'])
 * @param {boolean} [params.progressive]
 * @returns {Promise<Array>}
 */
export async function getNearbyUsefulPlaces({
  lat,
  lon,
  radiusMeters,
  limit,
  types = null,
  progressive = false,
}) {
  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180 ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters <= 0
  ) {
    throw new Error(
      `[USEFUL_PLACES_DB] Invalid geo parameters: lat=${lat}, lon=${lon}, radius=${radiusMeters}`,
    );
  }

  if (__DEV__)
    console.warn("[USEFUL_PLACES_DB] getNearby", {
      radiusMeters,
      types,
      progressive,
    });

  const { db, error } = await getDbSafe();
  if (!db) {
    throw error || new Error("Useful places DB unavailable");
  }

  const maxK = kForRadius(radiusMeters);

  if (progressive) {
    const rows = await progressiveSearch(
      db,
      lat,
      lon,
      radiusMeters,
      limit,
      types,
      maxK,
    );
    if (__DEV__)
      console.warn("[USEFUL_PLACES_DB] getNearby:progressive", rows.length);
    return rows;
  }

  const cells = gridDisk(latLngToCell(lat, lon, H3_RES), maxK);
  const candidates = await queryCells(db, cells, types);
  const rows = rankAndFilter(candidates, lat, lon, radiusMeters, limit);
  if (__DEV__) console.warn("[USEFUL_PLACES_DB] getNearby:full", rows.length);
  return rows;
}

async function progressiveSearch(
  db,
  lat,
  lon,
  radiusMeters,
  limit,
  types,
  maxK,
) {
  let allCandidates = [];
  const seenIds = new Set();
  const queriedCells = new Set();
  // Hard cap to prevent OOM on dense areas
  const maxCandidates = Math.max(limit * 10, 5000);

  for (let k = 1; k <= maxK; k++) {
    const allCells = gridDisk(latLngToCell(lat, lon, H3_RES), k);
    const newCells = allCells.filter((c) => !queriedCells.has(c));
    for (const c of newCells) queriedCells.add(c);

    const rows = await queryCells(db, newCells, types);

    for (const row of rows) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        allCandidates.push(row);
      }
    }

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

    if (allCandidates.length >= maxCandidates) break;
  }

  return rankAndFilter(allCandidates, lat, lon, radiusMeters, limit);
}

async function queryCells(db, cells, types) {
  if (cells.length === 0) return [];

  const results = [];

  const typesVarCount = types && types.length > 0 ? types.length : 0;
  const chunkSize = SQL_VAR_LIMIT - typesVarCount;
  if (chunkSize <= 0) {
    throw new Error(
      `[USEFUL_PLACES_DB] Too many type filters (${typesVarCount}) — exceeds SQL variable limit`,
    );
  }

  for (let i = 0; i < cells.length; i += chunkSize) {
    const chunk = cells.slice(i, i + chunkSize).map(String);
    const placeholders = chunk.map(() => "?").join(",");

    let sql = `SELECT ${SELECT_COLS} FROM useful_places WHERE h3 IN (${placeholders})`;
    const params = [...chunk];

    if (types && types.length > 0) {
      const typePlaceholders = types.map(() => "?").join(",");
      sql += ` AND type IN (${typePlaceholders})`;
      params.push(...types);
    }

    const rows = await db.getAllAsync(sql, params);
    for (const row of rows) results.push(row);
  }

  if (__DEV__) console.warn("[USEFUL_PLACES_DB] queryCells", results.length);

  return results;
}

function parseHorairesStd(row) {
  if (!row.horaires_std) return { ...row, horaires_std: null };
  try {
    return { ...row, horaires_std: JSON.parse(row.horaires_std) };
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[USEFUL_PLACES_DB] Failed to parse horaires_std:",
        err.message,
        "for id:",
        row.id,
      );
    }
    return { ...row, horaires_std: null };
  }
}

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
 * Bbox fallback.
 */
export async function getNearbyUsefulPlacesBbox({
  lat,
  lon,
  radiusMeters,
  limit,
  types = null,
}) {
  if (__DEV__)
    console.warn("[USEFUL_PLACES_DB] getNearbyBbox", { radiusMeters, types });

  const { db, error } = await getDbSafe();
  if (!db) {
    throw error || new Error("Useful places DB unavailable");
  }

  const { clause, params } = bboxClause(lat, lon, radiusMeters);
  let sql = `SELECT ${SELECT_COLS} FROM useful_places WHERE ${clause}`;

  if (types && types.length > 0) {
    const typePlaceholders = types.map(() => "?").join(",");
    sql += ` AND type IN (${typePlaceholders})`;
    params.push(...types);
  }

  const rows = await db.getAllAsync(sql, params);
  const ranked = rankAndFilter(rows, lat, lon, radiusMeters, limit);
  if (__DEV__) console.warn("[USEFUL_PLACES_DB] getNearbyBbox", ranked.length);
  return ranked;
}

/**
 * Compatibility facade for existing DAE code.
 */
export async function getNearbyDefibs(params) {
  return getNearbyUsefulPlaces({ ...params, types: ["dae"] });
}

export async function getNearbyDefibsBbox(params) {
  return getNearbyUsefulPlacesBbox({ ...params, types: ["dae"] });
}
