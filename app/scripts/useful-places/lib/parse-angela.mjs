import { createReadStream, readFileSync } from "node:fs";
import { parse } from "csv-parse";
import { hashId } from "./hash-id.mjs";
import { buildAddress } from "./normalize-address.mjs";
import { validateCoords } from "./validate-coords.mjs";

// ── Toulouse: reseau-angela.csv ──────────────────────────────────────────────

export async function parseAngelaNational(filepath) {
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

  const REQUIRED_COLS = ["Geo Point"];
  let columnsChecked = false;

  for await (const record of parser) {
    if (!columnsChecked) {
      const missing = REQUIRED_COLS.filter((col) => !(col in record));
      if (missing.length > 0) {
        throw new Error(`[parse-angela-national] Missing required columns: ${missing.join(", ")}`);
      }
      columnsChecked = true;
    }
    stats.read++;

    // Parse "Geo Point" format: "lat, lon"
    const geoPoint = (record["Geo Point"] || "").trim();
    if (!geoPoint) {
      stats.rejected++;
      stats.reasons["no_geo_point"] = (stats.reasons["no_geo_point"] || 0) + 1;
      continue;
    }

    const parts = geoPoint.split(",").map((s) => s.trim());
    const rawLat = parseFloat(parts[0]);
    const rawLon = parseFloat(parts[1]);

    const coordResult = validateCoords(rawLat, rawLon);
    if (!coordResult.valid) {
      stats.rejected++;
      stats.reasons[coordResult.reason] = (stats.reasons[coordResult.reason] || 0) + 1;
      continue;
    }

    const nom = (record.nom || "").trim() || null;
    const adresse = buildAddress(record.num_voies, record.nom_voies);
    const commune = (record.commune || "").trim() || null;
    const categorie = (record.categorie || "").trim() || null;

    const id = hashId("angela", nom || "", coordResult.lat.toString(), coordResult.lon.toString());

    rows.push({
      id,
      type: "angela",
      source_dataset: "angela-national",
      source_id: null,
      nom,
      adresse,
      code_postal: null,
      commune,
      departement: null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone: null,
      horaires_raw: null,
      horaires_std: null,
      acces: categorie,
      disponible_24h: 0,
      url: null,
    });
  }

  return { rows, stats };
}

// ── Bayonne: angela.geojson ──────────────────────────────────────────────────

export async function parseAngelaBayonne(filepath) {
  const rows = [];
  const stats = { read: 0, rejected: 0, reasons: {} };

  const raw = readFileSync(filepath, "utf-8");
  let geojson;
  try {
    geojson = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse GeoJSON from ${filepath}: ${err.message}`);
  }
  const features = geojson.features || [];

  for (const feature of features) {
    stats.read++;

    const coords = feature.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      stats.rejected++;
      stats.reasons["no_coordinates"] = (stats.reasons["no_coordinates"] || 0) + 1;
      continue;
    }

    // GeoJSON: [lon, lat]
    const rawLon = coords[0];
    const rawLat = coords[1];

    const coordResult = validateCoords(rawLat, rawLon);
    if (!coordResult.valid) {
      stats.rejected++;
      stats.reasons[coordResult.reason] = (stats.reasons[coordResult.reason] || 0) + 1;
      continue;
    }

    const props = feature.properties || {};
    const nom = (props.enseigne || "").trim() || null;
    const adresse = buildAddress(props.adr_num, props.adr_rue);
    const sourceId = props.ogc_fid ? String(props.ogc_fid) : null;

    const id = sourceId
      ? hashId("angela", "bayonne", sourceId)
      : hashId("angela", "bayonne", coordResult.lat.toString(), coordResult.lon.toString());

    rows.push({
      id,
      type: "angela",
      source_dataset: "angela-bayonne",
      source_id: sourceId,
      nom,
      adresse,
      code_postal: null,
      commune: "Bayonne",
      departement: null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone: null,
      horaires_raw: null,
      horaires_std: null,
      acces: null,
      disponible_24h: 0,
      url: null,
    });
  }

  return { rows, stats };
}

// ── Grand Poitiers: plan-angela-2.csv ────────────────────────────────────────

export async function parseAngelaPoitiers(filepath) {
  const rows = [];
  const stats = { read: 0, rejected: 0, reasons: {} };

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

  const VALID_PERIODES = new Set(["Journée", "Journée et soirée", "soirée"]);
  const REQUIRED_COLS = ["latitude", "longitude"];
  let columnsChecked = false;

  for await (const record of parser) {
    if (!columnsChecked) {
      const missing = REQUIRED_COLS.filter((col) => !(col in record));
      if (missing.length > 0) {
        throw new Error(`[parse-angela-poitiers] Missing required columns: ${missing.join(", ")}`);
      }
      columnsChecked = true;
    }
    stats.read++;

    const rawLat = parseFloat(record.latitude);
    const rawLon = parseFloat(record.longitude);

    if (!Number.isFinite(rawLat) || !Number.isFinite(rawLon)) {
      stats.rejected++;
      stats.reasons["no_coordinates"] = (stats.reasons["no_coordinates"] || 0) + 1;
      continue;
    }

    const coordResult = validateCoords(rawLat, rawLon);
    if (!coordResult.valid) {
      stats.rejected++;
      stats.reasons[coordResult.reason] = (stats.reasons[coordResult.reason] || 0) + 1;
      continue;
    }

    const nom = (record.nom_etablissement || "").trim() || null;
    const adresse = (record.adresse_complete || "").trim() || null;

    // Detect shifted columns: nature_activite and periode_ouverture may contain
    // city names or postcodes when the CSV columns are misaligned.
    const rawActivite = (record.nature_activite || "").trim();
    const rawPeriode = (record.periode_ouverture || "").trim();

    // A field is suspect if it looks like a French postcode or a standalone
    // city name rather than a legitimate activity description.
    // - Postcodes: exactly 5 digits
    // - All-caps words 3+ chars: likely city names (e.g. "POITIERS"), but not short
    //   activity words like "BAR" which are only 3 uppercase chars
    // - Multi-word proper nouns: "Saint-Benoît", "La Rochelle" etc.
    // Note: single-word mixed-case city names like "Buxerolles" are NOT caught;
    // these are rare edge cases that would need source-specific handling.
    const isSuspectField = (val) =>
      /^\d{5}$/.test(val) ||
      /^[A-ZÀ-Ÿ]{3,}$/.test(val) || // all-caps word 3+ chars (e.g. "POITIERS")
      /^[A-ZÀ-Ÿ][a-zà-ÿ]+([-\s][A-ZÀ-Ÿ][a-zà-ÿ]+)+$/.test(val); // multi-word proper noun (e.g. "Saint-Benoît")

    const isSuspectActivite = isSuspectField(rawActivite);
    const isSuspectPeriode = isSuspectField(rawPeriode);

    const acces = !isSuspectActivite && rawActivite ? rawActivite : null;
    const horairesRaw =
      !isSuspectPeriode && VALID_PERIODES.has(rawPeriode) ? rawPeriode : null;

    const id = hashId("angela", "poitiers", nom || "", coordResult.lat.toString(), coordResult.lon.toString());

    rows.push({
      id,
      type: "angela",
      source_dataset: "angela-poitiers",
      source_id: null,
      nom,
      adresse,
      code_postal: null,
      commune: null,
      departement: null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone: null,
      horaires_raw: horairesRaw,
      horaires_std: null,
      acces,
      disponible_24h: 0,
      url: null,
    });
  }

  return { rows, stats };
}

// ── Bordeaux: sv_angela_p.csv ────────────────────────────────────────────────

export async function parseAngelaBordeaux(filepath) {
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

  const REQUIRED_COLS_BDX = ["Geo Point"];
  let columnsCheckedBdx = false;

  for await (const record of parser) {
    if (!columnsCheckedBdx) {
      const missing = REQUIRED_COLS_BDX.filter((col) => !(col in record));
      if (missing.length > 0) {
        throw new Error(`[parse-angela-bordeaux] Missing required columns: ${missing.join(", ")}`);
      }
      columnsCheckedBdx = true;
    }
    stats.read++;

    // Parse "Geo Point" format: "lat, lon"
    const geoPoint = (record["Geo Point"] || "").trim();
    if (!geoPoint) {
      stats.rejected++;
      stats.reasons["no_geo_point"] = (stats.reasons["no_geo_point"] || 0) + 1;
      continue;
    }

    const parts = geoPoint.split(",").map((s) => s.trim());
    const rawLat = parseFloat(parts[0]);
    const rawLon = parseFloat(parts[1]);

    const coordResult = validateCoords(rawLat, rawLon);
    if (!coordResult.valid) {
      stats.rejected++;
      stats.reasons[coordResult.reason] = (stats.reasons[coordResult.reason] || 0) + 1;
      continue;
    }

    const nom = (record.libelle || "").trim() || null;
    const adresseParts = [(record.adresse || "").trim(), (record.complement_adresse || "").trim()];
    const adresse = adresseParts.filter(Boolean).join(", ") || null;
    const sourceId = (record.gid || "").trim() || null;
    const url = (record.url || "").trim() || null;

    // Horaires
    const ouverture = (record.ouverture || "").trim();
    const horairesRaw = ouverture || null;
    let horairesStd = null;

    if (ouverture) {
      const parts = ouverture.split(",").map((s) => s.trim().toUpperCase());
      const hasJour = parts.includes("JOUR");
      const hasNuit = parts.includes("NUIT");

      if (hasJour && hasNuit) {
        horairesStd = JSON.stringify({ disponibilite: "jour_et_nuit" });
      } else if (hasJour) {
        horairesStd = JSON.stringify({ disponibilite: "jour" });
      } else if (hasNuit) {
        horairesStd = JSON.stringify({ disponibilite: "nuit" });
      }
    }

    const id = sourceId
      ? hashId("angela", "bordeaux", sourceId)
      : hashId("angela", "bordeaux", coordResult.lat.toString(), coordResult.lon.toString());

    rows.push({
      id,
      type: "angela",
      source_dataset: "angela-bordeaux",
      source_id: sourceId,
      nom,
      adresse,
      code_postal: null,
      commune: null,
      departement: null,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      telephone: null,
      horaires_raw: horairesRaw,
      horaires_std: horairesStd,
      acces: null,
      disponible_24h: 0,
      url,
    });
  }

  return { rows, stats };
}
