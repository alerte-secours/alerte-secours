#!/usr/bin/env node
// Orchestrator: parse all sources and build unified useful-places.db

import { existsSync, mkdirSync, unlinkSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parsePolice } from "./lib/parse-police.mjs";
import { parseGendarmerie } from "./lib/parse-gendarmerie.mjs";
import { parseHospitals } from "./lib/parse-hospitals.mjs";
import {
  parseAngelaNational,
  parseAngelaBayonne,
  parseAngelaPoitiers,
  parseAngelaBordeaux,
} from "./lib/parse-angela.mjs";
import { buildUsefulPlacesSqlite } from "./build-sqlite.mjs";
import { PipelineStats } from "./stats.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, ".data");
const OUTPUT_DB = join(__dirname, "../../src/assets/db/useful-places.db");

// DAE pipeline is optional — skip if source file not available
let parseDae;
try {
  const mod = await import("./lib/parse-dae.mjs");
  parseDae = mod.parseDae;
} catch (err) {
  console.warn("DAE parser unavailable:", err.message);
  parseDae = null;
}

async function main() {
  const pipelineStats = new PipelineStats();
  const allRows = [];

  function addRows(source, rows) {
    // Loop instead of allRows.push(...rows) to avoid stack overflow on 100k+ element arrays
    for (let i = 0; i < rows.length; i++) allRows.push(rows[i]);
  }

  // ── 1. Police ──────────────────────────────────────────────────────────
  const policeFile = join(DATA_DIR, "export-pn.csv");
  if (existsSync(policeFile)) {
    console.log("Parsing police...");
    const { rows, stats } = await parsePolice(policeFile);
    stats.rowCount = rows.length;
    pipelineStats.addSource("police", stats);
    addRows("police", rows);
    console.log(`  Police: ${rows.length} rows`);
  } else {
    console.warn("  Police source not found, skipping");
  }

  // ── 2. Gendarmerie ─────────────────────────────────────────────────────
  const gnFile = join(DATA_DIR, "export-gn2.csv");
  if (existsSync(gnFile)) {
    console.log("Parsing gendarmerie...");
    const { rows, stats } = await parseGendarmerie(gnFile);
    stats.rowCount = rows.length;
    pipelineStats.addSource("gendarmerie", stats);
    addRows("gendarmerie", rows);
    console.log(`  Gendarmerie: ${rows.length} rows`);
  } else {
    console.warn("  Gendarmerie source not found, skipping");
  }

  // ── 3. Hospitals ───────────────────────────────────────────────────────
  const hospFile = join(DATA_DIR, "hospitals_point.csv");
  if (existsSync(hospFile)) {
    console.log("Parsing hospitals...");
    const { rows, stats } = await parseHospitals(hospFile);
    stats.rowCount = rows.length;
    pipelineStats.addSource("hospitals", stats);
    addRows("hospitals", rows);
    console.log(`  Hospitals: ${rows.length} rows (${stats.urgences} urgences, ${stats.hopital} hopital)`);
  } else {
    console.warn("  Hospitals source not found, skipping");
  }

  // ── 4. Angela (4 sources) ──────────────────────────────────────────────
  const angelaSources = [
    { name: "angela-national", parser: parseAngelaNational, file: "angela/reseau-angela.csv" },
    { name: "angela-bayonne", parser: parseAngelaBayonne, file: "angela/angela.geojson" },
    { name: "angela-poitiers", parser: parseAngelaPoitiers, file: "angela/plan-angela-2.csv" },
    { name: "angela-bordeaux", parser: parseAngelaBordeaux, file: "angela/sv_angela_p.csv" },
  ];

  for (const { name, parser, file } of angelaSources) {
    const filePath = join(DATA_DIR, file);
    if (existsSync(filePath)) {
      console.log(`Parsing ${name}...`);
      const { rows, stats } = await parser(filePath);
      stats.rowCount = rows.length;
      pipelineStats.addSource(name, stats);
      addRows(name, rows);
      console.log(`  ${name}: ${rows.length} rows`);
    } else {
      console.warn(`  ${name} source not found, skipping`);
    }
  }

  // ── 5. DAE ─────────────────────────────────────────────────────────────
  const daeFile = join(DATA_DIR, "geodae.json");
  if (parseDae && existsSync(daeFile)) {
    console.log("Parsing DAE...");
    try {
      const { rows, stats } = await parseDae(daeFile);
      stats.rowCount = rows.length;
      pipelineStats.addSource("dae", stats);
      addRows("dae", rows);
      console.log(`  DAE: ${rows.length} rows`);
    } catch (error) {
      console.warn(`  DAE parsing failed: ${error.message}`);
    }
  } else {
    console.warn("  DAE source not found or parser unavailable, skipping");
  }

  // ── 6. Build SQLite ────────────────────────────────────────────────────
  console.log(`\nTotal unified rows: ${allRows.length}`);

  if (allRows.length === 0) {
    console.error("No rows to process. Ensure data sources are downloaded.");
    process.exit(1);
  }

  // Ensure output directory exists (may be absent on fresh clone)
  mkdirSync(dirname(OUTPUT_DB), { recursive: true });

  // Build into a temp file, then atomically rename on success
  const OUTPUT_DB_TMP = OUTPUT_DB + ".tmp";
  if (existsSync(OUTPUT_DB_TMP)) {
    unlinkSync(OUTPUT_DB_TMP);
  }

  console.log(`Building SQLite database -> ${OUTPUT_DB}`);
  const { rowCount, dbSizeBytes, rowCountByType } = buildUsefulPlacesSqlite({
    outputPath: OUTPUT_DB_TMP,
    rows: allRows,
  });

  // Atomic swap: remove old DB only after successful build
  if (existsSync(OUTPUT_DB)) {
    unlinkSync(OUTPUT_DB);
  }
  renameSync(OUTPUT_DB_TMP, OUTPUT_DB);

  console.log(`DB rows: ${rowCount}`);
  console.log(`DB size: ${(dbSizeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("By type:", JSON.stringify(rowCountByType, null, 2));

  // ── 7. Print stats ────────────────────────────────────────────────────
  pipelineStats.print();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
