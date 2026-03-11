// Build a SQLite database from defibrillator row objects with H3 geo-indexing.
// Ported from app/scripts/dae/csv-to-sqlite.mjs

const { createHash } = require("node:crypto")
const { resolve } = require("node:path")

const SCHEMA_PATH = resolve(__dirname, "schema.sql")

// Inline schema so it works when bundled by ncc/webpack (no filesystem read needed)
const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS defibs (
  id            TEXT PRIMARY KEY NOT NULL,
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  nom           TEXT NOT NULL DEFAULT '',
  adresse       TEXT NOT NULL DEFAULT '',
  horaires      TEXT NOT NULL DEFAULT '',
  horaires_std  TEXT NOT NULL DEFAULT '{}',
  acces         TEXT NOT NULL DEFAULT '',
  disponible_24h INTEGER NOT NULL DEFAULT 0,
  h3            TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_defibs_h3 ON defibs (h3);
CREATE INDEX IF NOT EXISTS idx_defibs_latlon ON defibs (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_defibs_dispo ON defibs (disponible_24h);`

const DEFAULT_H3_RES = 8
const DEFAULT_BATCH_SIZE = 5000

function deterministicId(lat, lon, nom, adresse) {
  const payload = `${lat}|${lon}|${nom}|${adresse}`
  return createHash("sha256")
    .update(payload, "utf-8")
    .digest("hex")
    .slice(0, 16)
}

/**
 * Build a SQLite database file from processed defibrillator rows.
 *
 * @param {Object} options
 * @param {string} options.outputPath - Path for the output .db file
 * @param {Array}  options.rows       - Row objects from processGeoJsonFeatures
 * @param {number} [options.h3Resolution=8] - H3 resolution level
 * @param {number} [options.batchSize=5000] - Insert batch size
 * @returns {{ rowCount: number, dbSizeBytes: number }}
 */
function buildSqliteDb({
  outputPath,
  rows,
  h3Resolution = DEFAULT_H3_RES,
  batchSize = DEFAULT_BATCH_SIZE,
}) {
  // Lazy require to avoid loading native modules when not needed
  const Database = require("better-sqlite3")
  const h3 = require("h3-js")

  const db = new Database(outputPath)

  // Fast-import PRAGMAs
  db.pragma("journal_mode = OFF")
  db.pragma("synchronous = OFF")
  db.pragma("temp_store = MEMORY")
  db.pragma("cache_size = -64000") // 64 MB
  db.pragma("locking_mode = EXCLUSIVE")

  // Create schema
  db.exec(SCHEMA_SQL)

  // Prepare insert
  const insert = db.prepare(
    `INSERT OR IGNORE INTO defibs (id, latitude, longitude, nom, adresse, horaires, horaires_std, acces, disponible_24h, h3)
     VALUES (@id, @latitude, @longitude, @nom, @adresse, @horaires, @horaires_std, @acces, @disponible_24h, @h3)`
  )

  const insertMany = db.transaction((batch) => {
    for (const row of batch) {
      insert.run(row)
    }
  })

  // Process rows in batches
  let batch = []

  for (const row of rows) {
    const { latitude, longitude, nom, adresse } = row

    // Skip invalid coordinates
    if (
      latitude == null ||
      longitude == null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      continue
    }

    const id = deterministicId(latitude, longitude, nom, adresse)
    const h3Cell = h3.latLngToCell(latitude, longitude, h3Resolution)

    batch.push({
      id,
      latitude,
      longitude,
      nom: nom || "",
      adresse: adresse || "",
      horaires: row.horaires || "",
      horaires_std: row.horaires_std || "{}",
      acces: row.acces || "",
      disponible_24h: row.disponible_24h || 0,
      h3: h3Cell,
    })

    if (batch.length >= batchSize) {
      insertMany(batch)
      batch = []
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    insertMany(batch)
  }

  // Restore safe PRAGMAs for the shipped DB
  db.pragma("journal_mode = DELETE")
  db.pragma("synchronous = NORMAL")

  // VACUUM to compact
  db.exec("VACUUM")

  // Final stats
  const count = db.prepare("SELECT count(*) AS cnt FROM defibs").get()
  const pageCount = db.pragma("page_count", { simple: true })
  const pageSize = db.pragma("page_size", { simple: true })
  const dbSizeBytes = pageCount * pageSize

  db.close()

  return {
    rowCount: count.cnt,
    dbSizeBytes,
  }
}

module.exports = { buildSqliteDb, deterministicId, SCHEMA_PATH, SCHEMA_SQL }
