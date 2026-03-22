const { readFileSync } = require("node:fs")
const { processGeoJsonFeatures } = require("geodae-pipeline")

const {
  hashId,
  validateCoords,
  epsg3857ToWgs84,
  convertHour,
  coversFullDay,
  DAY_LABELS,
  createStats,
} = require("./utils")
const { parseCsvSync } = require("./csv")

// ── Police ──────────────────────────────────────────────────────────────────

function parsePoliceRecords(content, stats = createStats()) {
  const records = parseCsvSync(content, ";")
  const rows = []
  for (const r of records) {
    const rawLat = parseFloat(r.geocodage_y_GPS)
    const rawLon = parseFloat(r.geocodage_x_GPS)
    const c = validateCoords(rawLat, rawLon)
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++
    const nom = (r.service || "").trim() || null
    const adresse =
      (r.adresse_geographique || "").replace(/\$/g, ", ").trim() || null
    rows.push({
      id: hashId(
        "police",
        c.lat.toString(),
        c.lon.toString(),
        nom || "",
        adresse || ""
      ),
      type: "police",
      source_dataset: "export-pn",
      source_id: null,
      nom,
      adresse,
      code_postal: (r.code_postal || "").trim() || null,
      commune: (r.commune || "").trim() || null,
      departement: (r.departement || "").trim() || null,
      latitude: c.lat,
      longitude: c.lon,
      telephone: (r.telephone || "").trim() || null,
      horaires_raw: null,
      horaires_std: null,
      acces: null,
      disponible_24h: 0,
      url: null,
    })
  }
  return rows
}

// ── Gendarmerie ─────────────────────────────────────────────────────────────

const DAYS_MAP = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 7,
}

function parseGendarmerieRecords(content, stats = createStats()) {
  const records = parseCsvSync(content, ";")
  const rows = []

  for (const r of records) {
    const rawLat = parseFloat(r.geocodage_y_GPS)
    const rawLon = parseFloat(r.geocodage_x_GPS)
    const c = validateCoords(rawLat, rawLon)
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++

    const rawId = (r.identifiant_public_unite || "").trim()
    const sourceId = rawId && rawId !== "0" ? rawId : null
    const nom = (r.service || "").trim() || null
    const id = sourceId
      ? hashId("gendarmerie", sourceId)
      : hashId("gendarmerie", c.lat.toString(), c.lon.toString(), nom || "")

    // Parse horaires
    const slotsByDay = {}
    const days = []
    for (const [dayName, dayNum] of Object.entries(DAYS_MAP)) {
      const daySlots = []
      for (let i = 1; i <= 3; i++) {
        const open = convertHour(r[`${dayName}_plage${i}_debut`])
        const close = convertHour(r[`${dayName}_plage${i}_fin`])
        if (open && close) daySlots.push({ open, close })
      }
      if (daySlots.length > 0) {
        days.push(dayNum)
        slotsByDay[dayNum] = daySlots
      }
    }
    // Detect 24h: all 7 days must have slots, each covering 00:00-24:00
    const is24h =
      days.length === 7 &&
      days.every((dayNum) => coversFullDay(slotsByDay[dayNum]))

    const holidays = []
    for (let i = 1; i <= 3; i++) {
      const open = convertHour(r[`jours_feries_plage${i}_debut`])
      const close = convertHour(r[`jours_feries_plage${i}_fin`])
      if (open && close) holidays.push({ open, close })
    }
    const horairesStdObj =
      days.length > 0 || holidays.length > 0
        ? { days, slotsByDay, holidays, is24h }
        : null
    const horairesStd = horairesStdObj ? JSON.stringify(horairesStdObj) : null

    // Build human-readable horaires_raw text
    let horairesRaw = null
    if (horairesStdObj) {
      const rawParts = []
      for (const dayNum of days) {
        const label = DAY_LABELS[dayNum]
        const slotsStr = slotsByDay[dayNum]
          .map((s) => `${s.open}-${s.close}`)
          .join(", ")
        rawParts.push(`${label}: ${slotsStr}`)
      }
      if (holidays.length > 0) {
        const holidayStr = holidays
          .map((s) => `${s.open}-${s.close}`)
          .join(", ")
        rawParts.push(`Jours fériés: ${holidayStr}`)
      }
      horairesRaw = rawParts.join(" | ")
    }

    const adresse = (r.voie || "").trim() || null

    rows.push({
      id,
      type: "gendarmerie",
      source_dataset: "export-gn2",
      source_id: sourceId,
      nom,
      adresse,
      code_postal: (r.code_postal || "").trim() || null,
      commune: (r.commune || "").trim() || null,
      departement: (r.departement || "").trim() || null,
      latitude: c.lat,
      longitude: c.lon,
      telephone: (r.telephone || "").trim() || null,
      horaires_raw: horairesRaw,
      horaires_std: horairesStd,
      acces: null,
      disponible_24h: is24h ? 1 : 0,
      url: (r.url || "").trim() || null,
    })
  }
  return rows
}

// ── Hospitals ───────────────────────────────────────────────────────────────

// FINESS category codes excluded from results:
// 354, 355, 362, 365 — EHPAD / maisons de retraite (nursing homes)
// 697, 698           — Laboratoires d'analyse (diagnostic labs)
// 379, 382, 425, 430, 433, 437, 444, 448 — Handicap + établissements pénitentiaires
const EXCLUDED_FINESS = new Set([
  "354",
  "355",
  "362",
  "365",
  "697",
  "698",
  "379",
  "382",
  "425",
  "430",
  "433",
  "437",
  "444",
  "448",
])

function parseHospitalRecords(content, stats = createStats()) {
  const records = parseCsvSync(content, ",")
  const rows = []
  for (const r of records) {
    const finess = (r["type-FR-FINESS"] || "").trim()
    if (finess && EXCLUDED_FINESS.has(finess)) continue
    const name = (r.name || "").trim()
    const finessRef = (r["ref-FR-FINESS"] || "").trim()
    if (!name && !finessRef) continue

    const geom = r.the_geom || ""
    const match = /POINT\s*\(\s*([^\s]+)\s+([^\s)]+)\s*\)/.exec(geom)
    if (!match) continue
    const coords = epsg3857ToWgs84(parseFloat(match[1]), parseFloat(match[2]))
    const c = validateCoords(coords.lat, coords.lon)
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++

    const isEmergency = (r.emergency || "").trim().toLowerCase() === "yes"
    const placeType = isEmergency ? "urgences" : "hopital"
    const nom =
      name ||
      (r.short_name || "").trim() ||
      (r.official_name || "").trim() ||
      (r.operator || "").trim() ||
      null
    const osmId = (r.osm_id || "").trim()

    rows.push({
      id: hashId(placeType, osmId || `${c.lat}|${c.lon}`),
      type: placeType,
      source_dataset: "hospitals-point",
      source_id: osmId || null,
      nom,
      adresse:
        [
          (r["addr-housenumber"] || "").trim(),
          (r["addr-street"] || "").trim(),
          (r["addr-postcode"] || "").trim(),
          (r["addr-city"] || "").trim(),
        ]
          .filter(Boolean)
          .join(" ") || null,
      code_postal: (r["addr-postcode"] || "").trim() || null,
      commune: (r["addr-city"] || "").trim() || null,
      departement: null,
      latitude: c.lat,
      longitude: c.lon,
      telephone:
        (r.phone || "").trim() || (r["contact-phone"] || "").trim() || null,
      horaires_raw: (r.opening_hours || "").trim() || null,
      horaires_std: null,
      acces: (r.wheelchair || "").trim() || null,
      disponible_24h: isEmergency ? 1 : 0,
      url: (r.url || "").trim() || (r["contact-website"] || "").trim() || null,
    })
  }
  return rows
}

// ── DAE ─────────────────────────────────────────────────────────────────────

// Memory-optimized: accepts a file path, reads and parses internally so the raw
// string can be GC'd before processing, and does a single pass over features
// (combining metadata extraction + processGeoJsonFeatures logic) while nulling
// processed features to allow progressive GC.
function parseDaeRecords(filePath) {
  // Read and parse in a way that allows the raw string to be freed
  let data
  {
    const raw = readFileSync(filePath, "utf-8")
    data = JSON.parse(raw)
    // raw goes out of scope here → ~205 MB freed for GC
  }

  const { features } = data
  data = null // drop reference to the wrapper object
  if (!features || !Array.isArray(features)) return []

  // Single pass: use processGeoJsonFeatures then enrich with metadata
  // extracted in the same iteration to avoid a second full scan.
  // Pre-extract metadata before processGeoJsonFeatures consumes the features
  // (it filters many out), then null features progressively.
  const metaByCoordKey = new Map()
  for (let i = 0; i < features.length; i++) {
    const f = features[i]
    const coords = f.geometry?.coordinates
    if (coords) {
      const p = f.properties || {}
      const key = `${coords[1]}|${coords[0]}`
      if (!metaByCoordKey.has(key)) {
        const cp = (p.c_com_cp || "").trim()
        metaByCoordKey.set(key, {
          code_postal: cp || null,
          commune: (p.c_com_nom || "").trim() || null,
          departement: cp
            ? cp.startsWith("97")
              ? cp.slice(0, 3)
              : cp.slice(0, 2)
            : null,
        })
      }
    }
  }

  const { rows } = processGeoJsonFeatures(features)

  // Free the features array now that processing is done
  features.length = 0

  const result = new Array(rows.length)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const meta = metaByCoordKey.get(`${row.latitude}|${row.longitude}`) || {}
    result[i] = {
      id: hashId(
        "dae",
        String(row.latitude),
        String(row.longitude),
        row.nom || "",
        row.adresse || ""
      ),
      type: "dae",
      source_dataset: "geodae",
      source_id: null,
      nom: row.nom || null,
      adresse: row.adresse || null,
      code_postal: meta.code_postal || null,
      commune: meta.commune || null,
      departement: meta.departement || null,
      latitude: row.latitude,
      longitude: row.longitude,
      telephone: null,
      horaires_raw: row.horaires || null,
      horaires_std: row.horaires_std || null,
      acces: row.acces || null,
      disponible_24h: row.disponible_24h || 0,
      url: null,
    }
  }
  return result
}

// ── Angela (4 sources) ──────────────────────────────────────────────────────

function parseAngelaNationalRecords(content, stats = createStats()) {
  const records = parseCsvSync(content, ";")
  const rows = []
  for (const r of records) {
    const gp = (r["Geo Point"] || "").trim()
    if (!gp) continue
    const parts = gp.split(",").map((s) => s.trim())
    const c = validateCoords(parseFloat(parts[0]), parseFloat(parts[1]))
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++
    const nom = (r.nom || "").trim() || null
    rows.push({
      id: hashId("angela", nom || "", c.lat.toString(), c.lon.toString()),
      type: "angela",
      source_dataset: "angela-national",
      source_id: null,
      nom,
      adresse:
        [(r.num_voies || "").trim(), (r.nom_voies || "").trim()]
          .filter(Boolean)
          .join(" ") || null,
      code_postal: null,
      commune: (r.commune || "").trim() || null,
      departement: null,
      latitude: c.lat,
      longitude: c.lon,
      telephone: null,
      horaires_raw: null,
      horaires_std: null,
      acces: (r.categorie || "").trim() || null,
      disponible_24h: 0,
      url: null,
    })
  }
  return rows
}

function parseAngelaBordeauxRecords(content, stats = createStats()) {
  const records = parseCsvSync(content, ";")
  const rows = []
  for (const r of records) {
    const gp = (r["Geo Point"] || "").trim()
    if (!gp) continue
    const parts = gp.split(",").map((s) => s.trim())
    const c = validateCoords(parseFloat(parts[0]), parseFloat(parts[1]))
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++
    const nom = (r.libelle || "").trim() || null
    const sourceId = (r.gid || "").trim() || null
    const adresseParts = [
      (r.adresse || "").trim(),
      (r.complement_adresse || "").trim(),
    ]
    const adresse = adresseParts.filter(Boolean).join(", ") || null

    // Horaires
    const ouverture = (r.ouverture || "").trim()
    const horairesRaw = ouverture || null
    let horairesStd = null
    if (ouverture) {
      const ouvertureParts = ouverture
        .split(",")
        .map((s) => s.trim().toUpperCase())
      const hasJour = ouvertureParts.includes("JOUR")
      const hasNuit = ouvertureParts.includes("NUIT")
      if (hasJour && hasNuit) {
        horairesStd = JSON.stringify({ disponibilite: "jour_et_nuit" })
      } else if (hasJour) {
        horairesStd = JSON.stringify({ disponibilite: "jour" })
      } else if (hasNuit) {
        horairesStd = JSON.stringify({ disponibilite: "nuit" })
      }
    }

    rows.push({
      id: sourceId
        ? hashId("angela", "bordeaux", sourceId)
        : hashId("angela", "bordeaux", c.lat.toString(), c.lon.toString()),
      type: "angela",
      source_dataset: "angela-bordeaux",
      source_id: sourceId,
      nom,
      adresse,
      code_postal: null,
      commune: null,
      departement: null,
      latitude: c.lat,
      longitude: c.lon,
      telephone: null,
      horaires_raw: horairesRaw,
      horaires_std: horairesStd,
      acces: null,
      disponible_24h: 0,
      url: (r.url || "").trim() || null,
    })
  }
  return rows
}

function parseAngelaBayonneRecords(content, stats = createStats()) {
  const geojson = JSON.parse(content)
  const features = geojson.features || []
  const rows = []
  for (const f of features) {
    const coords = f.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const c = validateCoords(coords[1], coords[0])
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++
    const props = f.properties || {}
    const nom = (props.enseigne || "").trim() || null
    rows.push({
      id: hashId(
        "angela",
        "bayonne",
        props.ogc_fid ? String(props.ogc_fid) : `${c.lat}|${c.lon}`
      ),
      type: "angela",
      source_dataset: "angela-bayonne",
      source_id: props.ogc_fid ? String(props.ogc_fid) : null,
      nom,
      adresse:
        [(props.adr_num || "").trim(), (props.adr_rue || "").trim()]
          .filter(Boolean)
          .join(" ") || null,
      code_postal: null,
      commune: "Bayonne",
      departement: null,
      latitude: c.lat,
      longitude: c.lon,
      telephone: null,
      horaires_raw: null,
      horaires_std: null,
      acces: null,
      disponible_24h: 0,
      url: null,
    })
  }
  return rows
}

function parseAngelaPoitiersRecords(content, stats = createStats()) {
  const records = parseCsvSync(content, ",")
  const rows = []
  for (const r of records) {
    const lat = parseFloat(r.latitude)
    const lon = parseFloat(r.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const c = validateCoords(lat, lon)
    if (!c.valid) continue
    if (c.corrected) stats.correctedCount++
    const nom = (r.nom_etablissement || "").trim() || null
    rows.push({
      id: hashId(
        "angela",
        "poitiers",
        nom || "",
        c.lat.toString(),
        c.lon.toString()
      ),
      type: "angela",
      source_dataset: "angela-poitiers",
      source_id: null,
      nom,
      adresse: (r.adresse_complete || "").trim() || null,
      code_postal: null,
      commune: null,
      departement: null,
      latitude: c.lat,
      longitude: c.lon,
      telephone: null,
      horaires_raw: null,
      horaires_std: null,
      acces: null,
      disponible_24h: 0,
      url: null,
    })
  }
  return rows
}

module.exports = {
  parsePoliceRecords,
  parseGendarmerieRecords,
  parseHospitalRecords,
  parseDaeRecords,
  parseAngelaNationalRecords,
  parseAngelaBordeauxRecords,
  parseAngelaBayonneRecords,
  parseAngelaPoitiersRecords,
  EXCLUDED_FINESS,
}
