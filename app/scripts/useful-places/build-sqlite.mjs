// Build unified useful_places SQLite database with H3 geo-indexing.

import { createRequire } from "node:module";
import { hashId } from "./lib/hash-id.mjs";

const require = createRequire(import.meta.url);

const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS useful_places (
  id             TEXT PRIMARY KEY NOT NULL,
  type           TEXT NOT NULL,
  source_dataset TEXT NOT NULL,
  source_id      TEXT,
  nom            TEXT,
  adresse        TEXT,
  code_postal    TEXT,
  commune        TEXT,
  departement    TEXT,
  latitude       REAL NOT NULL,
  longitude      REAL NOT NULL,
  telephone      TEXT,
  horaires_raw   TEXT,
  horaires_std   TEXT,
  acces          TEXT,
  disponible_24h INTEGER DEFAULT 0,
  url            TEXT,
  h3             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_useful_places_h3 ON useful_places(h3);
CREATE INDEX IF NOT EXISTS idx_useful_places_type ON useful_places(type);
CREATE INDEX IF NOT EXISTS idx_useful_places_coords ON useful_places(latitude, longitude);`;

const DEFAULT_H3_RES = 8;
const DEFAULT_BATCH_SIZE = 5000;

/**
 * Build a SQLite database from unified useful_places rows.
 *
 * @param {Object} options
 * @param {string} options.outputPath
 * @param {Array}  options.rows
 * @param {number} [options.h3Resolution=8]
 * @param {number} [options.batchSize=5000]
 * @returns {{ rowCount: number, dbSizeBytes: number, rowCountByType: Object }}
 */
export function buildUsefulPlacesSqlite({
  outputPath,
  rows,
  h3Resolution = DEFAULT_H3_RES,
  batchSize = DEFAULT_BATCH_SIZE,
}) {
  const Database = require("better-sqlite3");
  const h3 = require("h3-js");

  const db = new Database(outputPath);

  try {
    // Fast-import PRAGMAs
    db.pragma("journal_mode = OFF");
    db.pragma("synchronous = OFF");
    db.pragma("temp_store = MEMORY");
    db.pragma("cache_size = -64000");
    db.pragma("locking_mode = EXCLUSIVE");

    // Create schema
    db.exec(SCHEMA_SQL);

    // Prepare insert
    const insert = db.prepare(
      `INSERT OR IGNORE INTO useful_places
       (id, type, source_dataset, source_id, nom, adresse, code_postal, commune, departement,
        latitude, longitude, telephone, horaires_raw, horaires_std, acces, disponible_24h, url, h3)
       VALUES
       (@id, @type, @source_dataset, @source_id, @nom, @adresse, @code_postal, @commune, @departement,
        @latitude, @longitude, @telephone, @horaires_raw, @horaires_std, @acces, @disponible_24h, @url, @h3)`
    );

    const insertMany = db.transaction((batch) => {
      for (const row of batch) {
        insert.run(row);
      }
    });

    let batch = [];

    for (const row of rows) {
      const { latitude, longitude } = row;

      // Skip invalid coordinates
      if (
        latitude == null ||
        longitude == null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        continue;
      }

      const id = row.id || hashId(row.type, latitude, longitude, row.nom || "", row.adresse || "");
      const h3Cell = h3.latLngToCell(latitude, longitude, h3Resolution);

      batch.push({
        id,
        type: row.type,
        source_dataset: row.source_dataset || "",
        source_id: row.source_id || null,
        nom: row.nom || null,
        adresse: row.adresse || null,
        code_postal: row.code_postal || null,
        commune: row.commune || null,
        departement: row.departement || null,
        latitude,
        longitude,
        telephone: row.telephone || null,
        horaires_raw: row.horaires_raw || null,
        horaires_std: row.horaires_std || null,
        acces: row.acces || null,
        disponible_24h: row.disponible_24h || 0,
        url: row.url || null,
        h3: h3Cell,
      });

      if (batch.length >= batchSize) {
        insertMany(batch);
        batch = [];
      }
    }

    // Flush remaining
    if (batch.length > 0) {
      insertMany(batch);
    }

    // Restore safe PRAGMAs
    db.pragma("journal_mode = DELETE");
    db.pragma("synchronous = NORMAL");

    // VACUUM
    db.exec("VACUUM");

    // Stats — query actual counts from DB (INSERT OR IGNORE may skip duplicates)
    const count = db.prepare("SELECT count(*) AS cnt FROM useful_places").get();
    const typeRows = db.prepare("SELECT type, count(*) AS cnt FROM useful_places GROUP BY type").all();
    const actualRowCountByType = {};
    for (const r of typeRows) {
      actualRowCountByType[r.type] = r.cnt;
    }
    const pageCount = db.pragma("page_count", { simple: true });
    const pageSize = db.pragma("page_size", { simple: true });
    const dbSizeBytes = pageCount * pageSize;

    return {
      rowCount: count.cnt,
      dbSizeBytes,
      rowCountByType: actualRowCountByType,
    };
  } finally {
    db.close();
  }
}

export { SCHEMA_SQL };
