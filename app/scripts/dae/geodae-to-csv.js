#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeHoraires } from "./lib/normalize-horaires.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT = join(__dirname, "geodae.json");
const OUTPUT = join(__dirname, "geodae.csv");

// --- Helpers ---

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

const DAY_ABBREV = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
};
const DAY_ORDER = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const DAY_NAMES_PATTERN =
  /lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i;
const DAY_NAMES_EN_PATTERN =
  /\b(mon|tue|wed|thu|fri|sat|sun)\b|mo-|tu-|we-|th-|fr-|sa-|su-/i;
const HOUR_PATTERN = /\d+[h:]\d*|\d+ ?heures?\b/;

function formatDays(arr) {
  if (!arr || arr.length === 0) return "";
  if (arr.length === 1) {
    const val = arr[0].toLowerCase().trim();
    if (val === "7j/7") return "7j/7";
    if (val === "non renseigné" || val === "non renseigne") return "";
    if (DAY_ABBREV[val]) return DAY_ABBREV[val];
    return arr[0].trim();
  }

  // Sort days by canonical order
  const sorted = arr
    .filter((d) => d != null)
    .map((d) => d.toLowerCase().trim())
    .filter((d) => DAY_ORDER.includes(d))
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

  if (sorted.length === 0) return arr.filter((d) => d != null).join(", ");
  if (sorted.length === 7) return "7j/7";

  // Detect consecutive range
  const indices = sorted.map((d) => DAY_ORDER.indexOf(d));
  const isConsecutive = indices.every(
    (idx, i) => i === 0 || idx === indices[i - 1] + 1,
  );

  if (isConsecutive && sorted.length >= 2) {
    return DAY_ABBREV[sorted[0]] + "-" + DAY_ABBREV[sorted[sorted.length - 1]];
  }

  return sorted.map((d) => DAY_ABBREV[d] || d).join(", ");
}

function formatHours(arr) {
  if (!arr || arr.length === 0) return "";
  const cleaned = arr
    .filter((h) => h != null)
    .map((h) => h.trim())
    .filter(
      (h) =>
        h &&
        h.toLowerCase() !== "non renseigné" &&
        h.toLowerCase() !== "non renseigne",
    );
  return cleaned.join(" + ");
}

/**
 * Determine if always available:
 * - 7j/7 + 24h/24
 * - OR public (Extérieur + libre access)
 */
function isAlwaysAvailable(p) {
  const is247 = is7j7(p.c_disp_j) && is24h(p.c_disp_h);

  const isExterior =
    p.c_acc &&
    (p.c_acc.trim().toLowerCase() === "extérieur" ||
      p.c_acc.trim().toLowerCase() === "exterieur");
  const isPublic = isExterior && p.c_acc_lib === true;

  return is247 || isPublic;
}

function is7j7(arr) {
  if (!arr) return false;
  if (arr.some((d) => d && d.trim() === "7j/7")) return true;
  const days = arr
    .filter((d) => d != null)
    .map((d) => d.toLowerCase().trim())
    .filter((d) => DAY_ORDER.includes(d));
  return days.length === 7;
}

function is24h(arr) {
  if (!arr) return false;
  return arr.some((h) => h && h.trim() === "24h/24");
}

/**
 * Build a single horaires string, merging days/hours/complement smartly.
 * Returns empty string if always available.
 *
 * Heuristic for complement deduplication:
 * - If complement contains day names → it already describes the full schedule → use complement only
 * - Else if complement contains hour patterns (refines "heures ouvrables") → use days + complement
 * - Else → use days + hours + complement (it's purely additional info)
 */
function buildHoraires(p) {
  const days = formatDays(p.c_disp_j);
  const hours = formatHours(p.c_disp_h);
  const complt = (p.c_disp_complt || "").replace(/[\r\n\t]+/g, " ").trim();

  if (!complt) {
    // No complement: just days + hours
    if (days && hours) return days + " " + hours;
    return days || hours || "";
  }

  // Has complement: decide how to merge
  const hasDayNames =
    DAY_NAMES_PATTERN.test(complt) || DAY_NAMES_EN_PATTERN.test(complt);
  const hasHours = HOUR_PATTERN.test(complt);

  if (hasDayNames && hasHours) {
    // Complement is a detailed per-day schedule (e.g. "Lundi au jeudi : 8h30-18h ...")
    // Use complement only — it's more specific than the base timetable
    return complt;
  }

  if (hasHours) {
    // Complement specifies actual hours (e.g. "8h-18h")
    // It refines the vague "heures ouvrables" → use days + complement
    if (days) return days + " " + complt;
    return complt;
  }

  // Complement is purely additional info (e.g. "Ouvert le dimanche...", "fermeture 31/12")
  const base = days && hours ? days + " " + hours : days || hours || "";
  if (base) return base + " ; " + complt;
  return complt;
}

function formatAddress(p) {
  const parts = [];
  let num = (p.c_adr_num || "").trim();
  let street = (p.c_adr_voie || "")
    .split("\t")[0] // strip tab-separated cp/city embedded in the field
    .split("|")[0] // strip pipe-separated cp/city embedded in the field
    .trim();

  // Drop invalid numbers: placeholders, decimals, letters, etc.
  // Valid street numbers: digits with optional dash/slash/space separators (e.g. "62", "62-64", "10 12")
  if (!/^\d[\d\s\-/]*$/.test(num)) num = "";

  const cp = (p.c_com_cp || "").trim();

  // Drop num when it equals the postal code (data entry mistake)
  if (num && num === cp) num = "";
  // Strip parenthesized cp from city name, e.g. "GANAC (09000)" → "GANAC"
  let city = (p.c_com_nom || "").trim();
  if (cp && city) {
    city = city
      .replace(
        new RegExp(
          "\\s*\\(" + cp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\)",
        ),
        "",
      )
      .trim();
  }

  // Strip cp+city already embedded in street field
  // e.g. "Mont Salomon 38200 Vienne" or "62117 rue de Lambres" when cp matches
  if (cp && street.includes(cp)) {
    const cpEscaped = cp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Trailing: "street 38200 Vienne" → "street"
    street = street
      .replace(new RegExp("\\s+" + cpEscaped + "\\s+.*$"), "")
      .trim();
    // Leading: "62117 rue de Lambres" → "rue de Lambres"
    street = street.replace(new RegExp("^" + cpEscaped + "\\s+"), "").trim();
  }

  if (num && street) {
    // Avoid duplicated number when street already starts with the same number
    // Handles plain "62 Rue…", ranges "62-64 Rue…", and slashes "62/64 Rue…"
    const numEscaped = num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const alreadyHasNum = new RegExp("^" + numEscaped + "(?!\\d)").test(street);
    if (alreadyHasNum) {
      parts.push(street);
    } else {
      parts.push(num + " " + street);
    }
  } else if (street) {
    parts.push(street);
  } else if (num) {
    parts.push(num);
  }

  if (cp && city) {
    parts.push(cp + " " + city);
  } else if (city) {
    parts.push(city);
  }
  return parts.join(", ");
}

function formatAccess(p) {
  const parts = [];

  // Indoor/Outdoor
  if (p.c_acc) parts.push(p.c_acc.trim());

  // Free access
  if (p.c_acc_lib === true) parts.push("libre");

  // Floor
  const floor = (p.c_acc_etg || "").trim().toLowerCase();
  if (
    floor &&
    floor !== "0" &&
    floor !== "rdc" &&
    floor !== "rez de chaussee" &&
    floor !== "rez de chaussée"
  ) {
    parts.push("étage " + p.c_acc_etg.trim());
  }

  // Complement
  const complt = (p.c_acc_complt || "").trim();
  if (complt) parts.push(complt);

  return parts.join(", ");
}

function getName(p) {
  const expt = (p.c_expt_rais || "").trim();
  const nom = (p.c_nom || "").trim();
  return expt || nom || "";
}

function normalize(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function passesFilter(p) {
  // c_etat: accept "Actif" or null, reject "Non identifie"
  const etat = normalize(p.c_etat);
  if (etat && etat !== "actif") return false;

  // c_etat_fonct: must be "En fonctionnement"
  const fonct = normalize(p.c_etat_fonct);
  if (fonct !== "en fonctionnement") return false;

  // c_etat_valid: must be "validées"
  const valid = normalize(p.c_etat_valid);
  if (valid !== "validees") return false;

  return true;
}

/**
 * Check if coordinates fall in a plausible French territory.
 */
function isPlausibleFrance(lat, lon) {
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
  // Metropolitan France
  if (lat >= 41 && lat <= 52 && lon >= -6 && lon <= 11) return true;
  // La Réunion
  if (lat >= -22 && lat <= -20 && lon >= 54 && lon <= 57) return true;
  // Mayotte
  if (lat >= -14 && lat <= -12 && lon >= 44 && lon <= 46) return true;
  // Guadeloupe / Martinique / Saint-Martin / Saint-Barthélemy
  if (lat >= 14 && lat <= 18 && lon >= -64 && lon <= -60) return true;
  // Guyane
  if (lat >= 2 && lat <= 6 && lon >= -55 && lon <= -51) return true;
  // Nouvelle-Calédonie
  if (lat >= -23 && lat <= -19 && lon >= 163 && lon <= 169) return true;
  // Polynésie française
  if (lat >= -28 && lat <= -7 && lon >= -155 && lon <= -130) return true;
  // Saint-Pierre-et-Miquelon
  if (lat >= 46 && lat <= 48 && lon >= -57 && lon <= -55) return true;
  // Wallis-et-Futuna
  if (lat >= -15 && lat <= -13 && lon >= -179 && lon <= -176) return true;
  // TAAF (Kerguelen, Crozet, Amsterdam, etc.)
  if (lat >= -50 && lat <= -37 && lon >= 50 && lon <= 78) return true;
  // Clipperton
  if (lat >= 10 && lat <= 11 && lon >= -110 && lon <= -108) return true;
  return false;
}

/**
 * Try to fix an out-of-range coordinate by dividing by powers of 10.
 * Returns the fixed value if it falls in [minValid, maxValid], else null.
 */
function tryNormalizeCoord(val, limit) {
  if (Math.abs(val) <= limit) return val;
  let v = val;
  while (Math.abs(v) > limit) {
    v /= 10;
  }
  return v;
}

/**
 * Attempt to produce valid WGS84 coordinates from potentially garbled input.
 * Strategy:
 *  1. Use properties directly if valid
 *  2. Fall back to GeoJSON geometry (standard [lon, lat] then swapped)
 *  3. Try power-of-10 normalization for misplaced decimals
 */
function fixCoordinates(lat, lon, geometry) {
  // 1. Already valid WGS84 — trust the source as-is
  if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon };

  // Out of WGS84 range — try to recover using fallbacks + plausibility check

  // 2. Try GeoJSON geometry
  if (geometry && geometry.coordinates) {
    let coords = geometry.coordinates;
    // Flatten nested arrays (MultiPoint, etc.)
    while (Array.isArray(coords[0])) coords = coords[0];
    if (coords.length === 2) {
      const [gLon, gLat] = coords; // GeoJSON = [lon, lat]
      if (isPlausibleFrance(gLat, gLon)) return { lat: gLat, lon: gLon };
      // Try swapped (some entries have lat/lon inverted in geometry)
      if (isPlausibleFrance(gLon, gLat)) return { lat: gLon, lon: gLat };
    }
  }

  // 3. Try power-of-10 normalization for misplaced decimals
  const fixedLat = tryNormalizeCoord(lat, 90);
  const fixedLon = tryNormalizeCoord(lon, 180);
  if (isPlausibleFrance(fixedLat, fixedLon))
    return { lat: fixedLat, lon: fixedLon };

  return null;
}

// --- Main ---

console.log("Reading geodae.json...");
const data = JSON.parse(readFileSync(INPUT, "utf-8"));
const features = data.features;
console.log(`Total features: ${features.length}`);

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

const rows = [CSV_HEADER.join(",")];
let filtered = 0;
let kept = 0;
let alwaysCount = 0;

for (const feature of features) {
  const p = feature.properties;

  if (!passesFilter(p)) {
    filtered++;
    continue;
  }

  const rawLat = p.c_lat_coor1;
  const rawLon = p.c_long_coor1;
  if (rawLat == null || rawLon == null) {
    filtered++;
    continue;
  }

  const fixed = fixCoordinates(rawLat, rawLon, feature.geometry);
  if (!fixed) {
    filtered++;
    continue;
  }
  const { lat, lon } = fixed;

  const always = isAlwaysAvailable(p);
  if (always) alwaysCount++;

  const disponible24h = always ? 1 : 0;

  // When always available, leave horaires empty
  const horaires = always ? "" : buildHoraires(p);

  // Normalize horaires into structured JSON
  const horairesStd = normalizeHoraires(horaires, disponible24h);

  const row = [
    lat,
    lon,
    escapeCsv(getName(p)),
    escapeCsv(formatAddress(p)),
    escapeCsv(horaires),
    escapeCsv(JSON.stringify(horairesStd)),
    escapeCsv(formatAccess(p)),
    disponible24h,
  ];

  rows.push(row.join(","));
  kept++;
}

writeFileSync(OUTPUT, rows.join("\n") + "\n", "utf-8");
console.log(`Kept: ${kept}, Filtered out: ${filtered}`);
console.log(`Always available (24h): ${alwaysCount}`);
console.log(`Written to ${OUTPUT}`);
