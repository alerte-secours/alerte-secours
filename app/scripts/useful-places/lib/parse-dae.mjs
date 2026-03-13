import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { hashId } from "./hash-id.mjs";

const require = createRequire(import.meta.url);

/**
 * Parse DAE data using the existing geodae-pipeline.
 * This is a wrapper that reuses the existing pipeline logic.
 *
 * @param {string} filepath - Path to geodae.json
 * @returns {Promise<{ rows: Array, stats: Object }>}
 */
export async function parseDae(filepath) {
  const { processGeoJsonFeatures } = require("../../../../libs/geodae-pipeline/src");

  const raw = readFileSync(filepath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse GeoJSON from ${filepath}: ${err.message}`);
  }
  const { features } = data;

  if (!features || !Array.isArray(features)) {
    throw new Error("Invalid GeoJSON — no features array");
  }

  const result = processGeoJsonFeatures(features);

  // Convert geodae rows to unified format
  const rows = result.rows.map((row) => ({
    id: hashId("dae", String(row.latitude), String(row.longitude), row.nom || "", row.adresse || ""),
    type: "dae",
    source_dataset: "geodae",
    source_id: null,
    nom: row.nom || null,
    adresse: row.adresse || null,
    code_postal: null,
    commune: null,
    departement: null,
    latitude: row.latitude,
    longitude: row.longitude,
    telephone: null,
    horaires_raw: row.horaires || null,
    horaires_std: row.horaires_std || null,
    acces: row.acces || null,
    disponible_24h: row.disponible_24h || 0,
    url: null,
  }));

  return {
    rows,
    stats: {
      read: features.length,
      kept: result.stats.kept,
      rejected: result.stats.filtered,
      alwaysAvailable: result.stats.alwaysAvailable,
    },
  };
}
