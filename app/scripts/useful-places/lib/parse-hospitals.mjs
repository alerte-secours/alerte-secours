import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { hashId } from "./hash-id.mjs";
import { buildAddress } from "./normalize-address.mjs";
import { validateCoords } from "./validate-coords.mjs";
import { parsePointEpsg3857 } from "./convert-epsg3857.mjs";

// FINESS codes to exclude: EHPAD, labs, disability, prison
const EXCLUDED_FINESS = new Set([
  "354", "355", "362", "365", // EHPAD / maisons de retraite
  "697", "698",               // Labos d'analyse
  "379", "382", "425", "430", "433", "437", "444", "448", // Handicap + prison
]);

/**
 * Parse hospitals from hospitals_point.csv (EPSG:3857 coordinates)
 * @param {string} filepath
 * @returns {Promise<{ rows: Array, stats: Object }>}
 */
export async function parseHospitals(filepath) {
  const rows = [];
  const stats = {
    read: 0,
    rejected: 0,
    reasons: {},
    finessFiltered: 0,
    noNameFiltered: 0,
    urgences: 0,
    hopital: 0,
  };

  const parser = createReadStream(filepath, { encoding: "utf-8" }).pipe(
    parse({
      delimiter: ",",
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
      quote: '"',
      escape: '"',
    })
  );

  const REQUIRED_COLS = ["the_geom"];
  let columnsChecked = false;

  for await (const record of parser) {
    if (!columnsChecked) {
      const missing = REQUIRED_COLS.filter((col) => !(col in record));
      if (missing.length > 0) {
        throw new Error(`[parse-hospitals] Missing required columns: ${missing.join(", ")}`);
      }
      columnsChecked = true;
    }
    stats.read++;

    // Filter by FINESS code
    const finessCode = (record["type-FR-FINESS"] || "").trim();
    if (finessCode && EXCLUDED_FINESS.has(finessCode)) {
      stats.finessFiltered++;
      stats.rejected++;
      continue;
    }

    // Exclude features without name AND without FINESS ref
    const name = (record.name || "").trim();
    const finessRef = (record["ref-FR-FINESS"] || "").trim();
    if (!name && !finessRef) {
      stats.noNameFiltered++;
      stats.rejected++;
      continue;
    }

    // Parse POINT geometry from EPSG:3857
    const coords = parsePointEpsg3857(record.the_geom);
    if (!coords) {
      stats.rejected++;
      stats.reasons["bad_geometry"] = (stats.reasons["bad_geometry"] || 0) + 1;
      continue;
    }

    const coordResult = validateCoords(coords.lat, coords.lon);
    if (!coordResult.valid) {
      stats.rejected++;
      stats.reasons[coordResult.reason] = (stats.reasons[coordResult.reason] || 0) + 1;
      continue;
    }

    // Determine type
    const isEmergency = (record.emergency || "").trim().toLowerCase() === "yes";
    const placeType = isEmergency ? "urgences" : "hopital";
    if (isEmergency) {
      stats.urgences++;
    } else {
      stats.hopital++;
    }

    // Name fallback chain
    const nom =
      name ||
      (record.short_name || "").trim() ||
      (record.official_name || "").trim() ||
      (record.operator || "").trim() ||
      null;

    // Phone fallback
    const telephone =
      (record.phone || "").trim() ||
      (record["contact-phone"] || "").trim() ||
      null;

    // Address
    const houseNumber = (record["addr-housenumber"] || "").trim();
    const street = (record["addr-street"] || "").trim();
    const adresse = buildAddress(houseNumber, street);

    // URL fallback
    const url =
      (record.url || "").trim() ||
      (record["contact-website"] || "").trim() ||
      null;

    const openingHours = (record.opening_hours || "").trim() || null;
    const osmId = (record.osm_id || "").trim();
    const id = hashId(placeType, osmId || `${coordResult.lat}|${coordResult.lon}`);

    rows.push({
      id,
      type: placeType,
      source_dataset: "hospitals-point",
      source_id: osmId || null,
      nom,
      adresse,
      code_postal: (record["addr-postcode"] || "").trim() || null,
      commune: (record["addr-city"] || "").trim() || null,
      departement: null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone,
      horaires_raw: openingHours,
      horaires_std: null,
      acces: (record.wheelchair || "").trim() || null,
      // Use opening_hours to determine 24h availability when present;
      // fall back to assuming 24h only for emergency departments without hours data
      disponible_24h: openingHours === "24/7"
        ? 1
        : (isEmergency && !openingHours) ? 1 : 0,
      url,
    });
  }

  return { rows, stats };
}
