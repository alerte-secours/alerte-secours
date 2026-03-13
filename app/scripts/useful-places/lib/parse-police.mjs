import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { hashId } from "./hash-id.mjs";
import { normalizeAddress, buildAddress } from "./normalize-address.mjs";
import { validateCoords } from "./validate-coords.mjs";

/**
 * Parse police stations from export-pn.csv
 * @param {string} filepath
 * @returns {Promise<{ rows: Array, stats: Object }>}
 */
export async function parsePolice(filepath) {
  const rows = [];
  const stats = { read: 0, rejected: 0, reasons: {} };

  const parser = createReadStream(filepath, { encoding: "utf-8" }).pipe(
    parse({
      delimiter: ";",
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
      quote: '"',
      escape: '"',
    })
  );

  const REQUIRED_COLS = ["geocodage_y_GPS", "geocodage_x_GPS"];
  let columnsChecked = false;

  for await (const record of parser) {
    if (!columnsChecked) {
      const missing = REQUIRED_COLS.filter((col) => !(col in record));
      if (missing.length > 0) {
        throw new Error(`[parse-police] Missing required columns: ${missing.join(", ")}`);
      }
      columnsChecked = true;
    }
    stats.read++;

    const rawLat = parseFloat(record.geocodage_y_GPS);
    const rawLon = parseFloat(record.geocodage_x_GPS);

    const coordResult = validateCoords(rawLat, rawLon);
    if (!coordResult.valid) {
      stats.rejected++;
      stats.reasons[coordResult.reason] = (stats.reasons[coordResult.reason] || 0) + 1;
      continue;
    }
    if (coordResult.corrected) {
      stats.reasons["corrected_swap"] = (stats.reasons["corrected_swap"] || 0) + 1;
    }

    const nom = (record.service || "").trim() || null;
    const adresseGeo = normalizeAddress(record.adresse_geographique);
    const adresseFallback = buildAddress(record.voie);
    const adresse = adresseGeo || adresseFallback;

    const id = hashId("police", coordResult.lat.toString(), coordResult.lon.toString(), nom || "", adresse || "");

    rows.push({
      id,
      type: "police",
      source_dataset: "export-pn",
      source_id: null,
      nom,
      adresse,
      code_postal: (record.code_postal || "").trim() || null,
      commune: (record.commune || "").trim() || null,
      departement: (record.departement || "").trim() || null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone: (record.telephone || "").trim() || null,
      horaires_raw: null,
      horaires_std: null,
      acces: null,
      disponible_24h: 0,
      url: null,
    });
  }

  return { rows, stats };
}
