import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { hashId } from "./hash-id.mjs";
import { buildAddress } from "./normalize-address.mjs";
import { validateCoords } from "./validate-coords.mjs";
import { normalizeHorairesGn } from "./normalize-horaires-gn.mjs";

/**
 * Parse gendarmerie units from export-gn2.csv
 * @param {string} filepath
 * @returns {Promise<{ rows: Array, stats: Object }>}
 */
export async function parseGendarmerie(filepath) {
  const rows = [];
  const stats = {
    read: 0,
    rejected: 0,
    reasons: {},
    withHoraires: 0,
    withoutHoraires: 0,
    outreMer: 0,
    metropole: 0,
    idZeroCount: 0,
  };

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
        throw new Error(`[parse-gendarmerie] Missing required columns: ${missing.join(", ")}`);
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

    // Determine ID
    const rawId = (record.identifiant_public_unite || "").trim();
    let sourceId;
    let id;
    if (rawId && rawId !== "0") {
      sourceId = rawId;
      id = hashId("gendarmerie", sourceId);
    } else {
      stats.idZeroCount++;
      sourceId = null;
      id = hashId("gendarmerie", coordResult.lat.toString(), coordResult.lon.toString(), (record.service || "").trim());
    }

    const nom = (record.service || "").trim() || null;
    const adresse = buildAddress(record.voie);

    // Parse horaires
    const { horairesStd, horairesRaw } = normalizeHorairesGn(record);
    if (horairesStd) {
      stats.withHoraires++;
    } else {
      stats.withoutHoraires++;
    }

    // Detect outre-mer via department
    const dept = (record.departement || "").trim();
    const deptNum = parseInt(dept, 10);
    if (deptNum >= 971 && deptNum <= 988) {
      stats.outreMer++;
    } else {
      stats.metropole++;
    }

    rows.push({
      id,
      type: "gendarmerie",
      source_dataset: "export-gn2",
      source_id: sourceId,
      nom,
      adresse,
      code_postal: (record.code_postal || "").trim() || null,
      commune: (record.commune || "").trim() || null,
      departement: dept || null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone: (record.telephone || "").trim() || null,
      horaires_raw: horairesRaw,
      horaires_std: horairesStd ? JSON.stringify(horairesStd) : null,
      acces: null,
      disponible_24h: horairesStd?.is24h ? 1 : 0,
      url: (record.url || "").trim() || null,
    });
  }

  return { rows, stats };
}
