#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  processGeoJsonFeatures,
} = require("../../../libs/geodae-pipeline/src/process-geojson");

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT = join(__dirname, "geodae.json");
const OUTPUT = join(__dirname, "geodae.csv");

// --- CSV helpers ---

function escapeCsv(value) {
  if (value == null) return "";
  // Replace newlines and tabs with spaces to keep one row per entry
  const str = String(value)
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  if (str.includes('"') || str.includes(",")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// --- Main ---

console.log("Reading geodae.json...");
const data = JSON.parse(readFileSync(INPUT, "utf-8"));
const features = data.features;
console.log(`Total features: ${features.length}`);

const { rows, stats } = processGeoJsonFeatures(features);

const CSV_HEADER = [
  "latitude",
  "longitude",
  "nom",
  "adresse",
  "horaires",
  "horaires_std",
  "acces",
  "disponible_24h",
];

const csvRows = [CSV_HEADER.join(",")];

for (const row of rows) {
  const csvRow = [
    row.latitude,
    row.longitude,
    escapeCsv(row.nom),
    escapeCsv(row.adresse),
    escapeCsv(row.horaires),
    escapeCsv(row.horaires_std),
    escapeCsv(row.acces),
    row.disponible_24h,
  ];
  csvRows.push(csvRow.join(","));
}

writeFileSync(OUTPUT, csvRows.join("\n") + "\n", "utf-8");
console.log(`Kept: ${stats.kept}, Filtered out: ${stats.filtered}`);
console.log(`Always available (24h): ${stats.alwaysAvailable}`);
console.log(`Written to ${OUTPUT}`);
