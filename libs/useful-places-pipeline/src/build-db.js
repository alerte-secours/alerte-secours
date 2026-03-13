const { hashId, validateCoords } = require("./utils")

const UNIFIED_SCHEMA = `CREATE TABLE IF NOT EXISTS useful_places (
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
CREATE INDEX IF NOT EXISTS idx_useful_places_coords ON useful_places(latitude, longitude);`

function buildUnifiedDb(outputPath, allRows) {
  const Database = require("better-sqlite3")
  const h3 = require("h3-js")
  const db = new Database(outputPath)

  db.pragma("journal_mode = OFF")
  db.pragma("synchronous = OFF")
  db.pragma("temp_store = MEMORY")
  db.pragma("cache_size = -64000")
  db.pragma("locking_mode = EXCLUSIVE")

  const rowCountByType = {}
  let skippedCount = 0

  try {
    db.exec(UNIFIED_SCHEMA)

    const insert = db.prepare(
      `INSERT OR IGNORE INTO useful_places
       (id, type, source_dataset, source_id, nom, adresse, code_postal, commune, departement,
        latitude, longitude, telephone, horaires_raw, horaires_std, acces, disponible_24h, url, h3)
       VALUES
       (@id, @type, @source_dataset, @source_id, @nom, @adresse, @code_postal, @commune, @departement,
        @latitude, @longitude, @telephone, @horaires_raw, @horaires_std, @acces, @disponible_24h, @url, @h3)`
    )

    const insertMany = db.transaction((batch) => {
      for (const row of batch) insert.run(row)
    })

    let batch = []

    for (const row of allRows) {
      const validated = validateCoords(row.latitude, row.longitude)
      if (!validated.valid) {
        skippedCount++
        continue
      }
      const latitude = validated.lat
      const longitude = validated.lon

      const id =
        row.id ||
        hashId(
          row.type,
          latitude.toString(),
          longitude.toString(),
          row.nom || "",
          row.adresse || ""
        )
      const h3Cell = h3.latLngToCell(latitude, longitude, 8)
      rowCountByType[row.type] = (rowCountByType[row.type] || 0) + 1

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
      })

      if (batch.length >= 5000) {
        insertMany(batch)
        batch = []
      }
    }
    if (batch.length > 0) insertMany(batch)

    db.pragma("journal_mode = DELETE")
    db.pragma("synchronous = NORMAL")
    db.exec("VACUUM")

    const count = db.prepare("SELECT count(*) AS cnt FROM useful_places").get()
    const pageCount = db.pragma("page_count", { simple: true })
    const pageSize = db.pragma("page_size", { simple: true })

    return {
      rowCount: count.cnt,
      dbSizeBytes: pageCount * pageSize,
      rowCountByType,
      skippedCount,
    }
  } finally {
    db.close()
  }
}

module.exports = { UNIFIED_SCHEMA, buildUnifiedDb }
