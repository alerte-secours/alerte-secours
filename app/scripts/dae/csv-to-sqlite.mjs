#!/usr/bin/env node
// CSV-to-SQLite pipeline for defibrillator data with H3 geo-indexing.
// Usage: node csv-to-sqlite.mjs --input <path> --output <path> [--h3res 8] [--delimiter auto] [--batchSize 5000]

import { createReadStream, readFileSync, existsSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parse } from "csv-parse";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const h3 = require("h3-js");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o" },
    h3res: { type: "string", default: "8" },
    delimiter: { type: "string", default: "auto" },
    batchSize: { type: "string", default: "5000" },
  },
});

const INPUT = args.input;
const OUTPUT = args.output;
const H3_RES = parseInt(args.h3res, 10);
const BATCH_SIZE = parseInt(args.batchSize, 10);

if (!INPUT || !OUTPUT) {
  console.error("Usage: node csv-to-sqlite.mjs --input <csv> --output <db> [--h3res 8] [--delimiter auto] [--batchSize 5000]");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "lib", "schema.sql");

function detectDelimiter(filePath) {
  // Read first line to detect delimiter
  const chunk = readFileSync(filePath, { encoding: "utf-8", end: 4096 });
  const firstLine = chunk.split(/\r?\n/)[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const detected = semicolonCount > commaCount ? ";" : ",";
  console.log(`Delimiter auto-detected: "${detected}" (commas=${commaCount}, semicolons=${semicolonCount})`);
  return detected;
}

function computeH3(lat, lon, res) {
  return h3.latLngToCell(lat, lon, res);
}

function deterministicId(lat, lon, nom, adresse) {
  const payload = `${lat}|${lon}|${nom}|${adresse}`;
  return createHash("sha256").update(payload, "utf-8").digest("hex").slice(0, 16);
}

function cleanFloat(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

function cleanInt(val) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

function cleanStr(val) {
  return (val ?? "").trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const delimiter =
    args.delimiter === "auto" ? detectDelimiter(INPUT) : args.delimiter;

  // Remove existing output to avoid UNIQUE constraint errors on re-run
  if (existsSync(OUTPUT)) {
    unlinkSync(OUTPUT);
    console.log(`Removed existing DB: ${OUTPUT}`);
  }

  // Open database with fast-import PRAGMAs
  const db = new Database(OUTPUT);
  db.pragma("journal_mode = OFF");
  db.pragma("synchronous = OFF");
  db.pragma("temp_store = MEMORY");
  db.pragma("cache_size = -64000"); // 64 MB
  db.pragma("locking_mode = EXCLUSIVE");

  // Create schema
  const schema = readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);

  // Prepare insert statement
  const insert = db.prepare(
    `INSERT OR IGNORE INTO defibs (id, latitude, longitude, nom, adresse, horaires, horaires_std, acces, disponible_24h, h3)
     VALUES (@id, @latitude, @longitude, @nom, @adresse, @horaires, @horaires_std, @acces, @disponible_24h, @h3)`
  );

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row);
    }
  });

  // Streaming CSV parse
  const parser = createReadStream(INPUT, { encoding: "utf-8" }).pipe(
    parse({
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
      quote: '"',
      escape: '"',
    })
  );

  let batch = [];
  let total = 0;
  let skipped = 0;

  for await (const record of parser) {
    const lat = cleanFloat(record.latitude);
    const lon = cleanFloat(record.longitude);

    // Skip rows with invalid coordinates
    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      skipped++;
      continue;
    }

    const nom = cleanStr(record.nom);
    const adresse = cleanStr(record.adresse);
    const horaires = cleanStr(record.horaires);
    const acces = cleanStr(record.acces);
    const disponible_24h = cleanInt(record.disponible_24h);
    const horaires_std = cleanStr(record.horaires_std) || "{}";
    const id = deterministicId(lat, lon, nom, adresse);
    const h3Cell = computeH3(lat, lon, H3_RES);

    batch.push({
      id,
      latitude: lat,
      longitude: lon,
      nom,
      adresse,
      horaires,
      horaires_std,
      acces,
      disponible_24h,
      h3: h3Cell,
    });

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      process.stdout.write(`\rInserted ${total} rows...`);
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    insertMany(batch);
    total += batch.length;
  }

  console.log(`\nDone: ${total} rows inserted, ${skipped} skipped.`);

  // Restore safe PRAGMAs for the shipped DB
  db.pragma("journal_mode = DELETE");
  db.pragma("synchronous = NORMAL");

  // VACUUM to compact
  db.exec("VACUUM");

  // Final stats
  const count = db.prepare("SELECT count(*) AS cnt FROM defibs").get();
  const pageCount = db.pragma("page_count", { simple: true });
  const pageSize = db.pragma("page_size", { simple: true });
  const sizeBytes = pageCount * pageSize;
  console.log(`DB rows: ${count.cnt}`);
  console.log(`DB size: ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
