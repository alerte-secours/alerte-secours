// Process GeoJSON features from data.gouv.fr into defibrillator row objects.
// Ported from app/scripts/dae/geodae-to-csv.js

const { normalizeHoraires } = require("./normalize-horaires")

const DAY_ABBREV = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
}
const DAY_ORDER = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]

const DAY_NAMES_PATTERN = /lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i
const DAY_NAMES_EN_PATTERN =
  /\b(mon|tue|wed|thu|fri|sat|sun)\b|mo-|tu-|we-|th-|fr-|sa-|su-/i
const HOUR_PATTERN = /\d+[h:]\d*|\d+ ?heures?\b/

function normalize(str) {
  if (!str) return ""
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function passesFilter(p) {
  const etat = normalize(p.c_etat)
  if (etat && etat !== "actif") return false
  const fonct = normalize(p.c_etat_fonct)
  if (fonct !== "en fonctionnement") return false
  const valid = normalize(p.c_etat_valid)
  if (valid !== "validees") return false
  return true
}

function isPlausibleFrance(lat, lon) {
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false
  if (lat >= 41 && lat <= 52 && lon >= -6 && lon <= 11) return true
  if (lat >= -22 && lat <= -20 && lon >= 54 && lon <= 57) return true
  if (lat >= -14 && lat <= -12 && lon >= 44 && lon <= 46) return true
  if (lat >= 14 && lat <= 18 && lon >= -64 && lon <= -60) return true
  if (lat >= 2 && lat <= 6 && lon >= -55 && lon <= -51) return true
  if (lat >= -23 && lat <= -19 && lon >= 163 && lon <= 169) return true
  if (lat >= -28 && lat <= -7 && lon >= -155 && lon <= -130) return true
  if (lat >= 46 && lat <= 48 && lon >= -57 && lon <= -55) return true
  if (lat >= -15 && lat <= -13 && lon >= -179 && lon <= -176) return true
  if (lat >= -50 && lat <= -37 && lon >= 50 && lon <= 78) return true
  if (lat >= 10 && lat <= 11 && lon >= -110 && lon <= -108) return true
  return false
}

function tryNormalizeCoord(val, limit) {
  if (Math.abs(val) <= limit) return val
  let v = val
  while (Math.abs(v) > limit) {
    v /= 10
  }
  return v
}

function fixCoordinates(lat, lon, geometry) {
  if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon }

  if (geometry && geometry.coordinates) {
    let coords = geometry.coordinates
    while (Array.isArray(coords[0])) [coords] = coords
    if (coords.length === 2) {
      const [gLon, gLat] = coords
      if (isPlausibleFrance(gLat, gLon)) return { lat: gLat, lon: gLon }
      if (isPlausibleFrance(gLon, gLat)) return { lat: gLon, lon: gLat }
    }
  }

  const fixedLat = tryNormalizeCoord(lat, 90)
  const fixedLon = tryNormalizeCoord(lon, 180)
  if (isPlausibleFrance(fixedLat, fixedLon))
    return { lat: fixedLat, lon: fixedLon }

  return null
}

function formatDays(arr) {
  if (!arr || arr.length === 0) return ""
  if (arr.length === 1) {
    const val = arr[0].toLowerCase().trim()
    if (val === "7j/7") return "7j/7"
    if (val === "non renseigné" || val === "non renseigne") return ""
    if (DAY_ABBREV[val]) return DAY_ABBREV[val]
    return arr[0].trim()
  }
  const sorted = arr
    .filter((d) => d != null)
    .map((d) => d.toLowerCase().trim())
    .filter((d) => DAY_ORDER.includes(d))
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))

  if (sorted.length === 0) return arr.filter((d) => d != null).join(", ")
  if (sorted.length === 7) return "7j/7"

  const indices = sorted.map((d) => DAY_ORDER.indexOf(d))
  const isConsecutive = indices.every(
    (idx, i) => i === 0 || idx === indices[i - 1] + 1
  )
  if (isConsecutive && sorted.length >= 2) {
    return `${DAY_ABBREV[sorted[0]]}-${DAY_ABBREV[sorted[sorted.length - 1]]}`
  }
  return sorted.map((d) => DAY_ABBREV[d] || d).join(", ")
}

function formatHours(arr) {
  if (!arr || arr.length === 0) return ""
  const cleaned = arr
    .filter((h) => h != null)
    .map((h) => h.trim())
    .filter(
      (h) =>
        h &&
        h.toLowerCase() !== "non renseigné" &&
        h.toLowerCase() !== "non renseigne"
    )
  return cleaned.join(" + ")
}

function is7j7(arr) {
  if (!arr) return false
  if (arr.some((d) => d && d.trim() === "7j/7")) return true
  const days = arr
    .filter((d) => d != null)
    .map((d) => d.toLowerCase().trim())
    .filter((d) => DAY_ORDER.includes(d))
  return days.length === 7
}

function is24h(arr) {
  if (!arr) return false
  return arr.some((h) => h && h.trim() === "24h/24")
}

function isAlwaysAvailable(p) {
  const is247 = is7j7(p.c_disp_j) && is24h(p.c_disp_h)
  const isExterior =
    p.c_acc &&
    (p.c_acc.trim().toLowerCase() === "extérieur" ||
      p.c_acc.trim().toLowerCase() === "exterieur")
  const isPublic = isExterior && p.c_acc_lib === true
  return is247 || isPublic
}

function buildHoraires(p) {
  const days = formatDays(p.c_disp_j)
  const hours = formatHours(p.c_disp_h)
  const complt = (p.c_disp_complt || "").replace(/[\r\n\t]+/g, " ").trim()

  if (!complt) {
    if (days && hours) return `${days} ${hours}`
    return days || hours || ""
  }

  const hasDayNames =
    DAY_NAMES_PATTERN.test(complt) || DAY_NAMES_EN_PATTERN.test(complt)
  const hasHours = HOUR_PATTERN.test(complt)

  if (hasDayNames && hasHours) return complt
  if (hasHours) {
    if (days) return `${days} ${complt}`
    return complt
  }

  const base = days && hours ? `${days} ${hours}` : days || hours || ""
  if (base) return `${base} ; ${complt}`
  return complt
}

function formatAddress(p) {
  const parts = []
  let num = (p.c_adr_num || "").trim()
  let street = (p.c_adr_voie || "").split("\t")[0].split("|")[0].trim()

  if (!/^\d[\d\s\-/]*$/.test(num)) num = ""

  const cp = (p.c_com_cp || "").trim()

  if (num && num === cp) num = ""
  let city = (p.c_com_nom || "").trim()
  if (cp && city) {
    city = city
      .replace(
        new RegExp(`\\s*\\(${cp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`),
        ""
      )
      .trim()
  }

  if (cp && street.includes(cp)) {
    const cpEscaped = cp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    street = street.replace(new RegExp(`\\s+${cpEscaped}\\s+.*$`), "").trim()
    street = street.replace(new RegExp(`^${cpEscaped}\\s+`), "").trim()
  }

  if (num && street) {
    const numEscaped = num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const alreadyHasNum = new RegExp(`^${numEscaped}(?!\\d)`).test(street)
    if (alreadyHasNum) {
      parts.push(street)
    } else {
      parts.push(`${num} ${street}`)
    }
  } else if (street) {
    parts.push(street)
  } else if (num) {
    parts.push(num)
  }

  if (cp && city) {
    parts.push(`${cp} ${city}`)
  } else if (city) {
    parts.push(city)
  }
  return parts.join(", ")
}

function formatAccess(p) {
  const parts = []
  if (p.c_acc) parts.push(p.c_acc.trim())
  if (p.c_acc_lib === true) parts.push("libre")
  const floor = (p.c_acc_etg || "").trim().toLowerCase()
  if (
    floor &&
    floor !== "0" &&
    floor !== "rdc" &&
    floor !== "rez de chaussee" &&
    floor !== "rez de chaussée"
  ) {
    parts.push(`étage ${p.c_acc_etg.trim()}`)
  }
  const complt = (p.c_acc_complt || "").trim()
  if (complt) parts.push(complt)
  return parts.join(", ")
}

function getName(p) {
  const expt = (p.c_expt_rais || "").trim()
  const nom = (p.c_nom || "").trim()
  return expt || nom || ""
}

/**
 * Process an array of GeoJSON features into defibrillator row objects.
 *
 * @param {Array} features - GeoJSON FeatureCollection features array
 * @returns {{ rows: Array, stats: { total: number, kept: number, filtered: number, alwaysAvailable: number } }}
 */
function processGeoJsonFeatures(features) {
  const rows = []
  let filtered = 0
  let alwaysCount = 0

  for (const feature of features) {
    const p = feature.properties

    if (!passesFilter(p)) {
      filtered++
      continue
    }

    const rawLat = p.c_lat_coor1
    const rawLon = p.c_long_coor1
    if (rawLat == null || rawLon == null) {
      filtered++
      continue
    }

    const fixed = fixCoordinates(rawLat, rawLon, feature.geometry)
    if (!fixed) {
      filtered++
      continue
    }
    const { lat, lon } = fixed

    const always = isAlwaysAvailable(p)
    if (always) alwaysCount++
    const disponible24h = always ? 1 : 0

    const horaires = always ? "" : buildHoraires(p)
    const horairesStd = normalizeHoraires(horaires, disponible24h)

    rows.push({
      latitude: lat,
      longitude: lon,
      nom: getName(p),
      adresse: formatAddress(p),
      horaires,
      horaires_std: JSON.stringify(horairesStd),
      acces: formatAccess(p),
      disponible_24h: disponible24h,
    })
  }

  return {
    rows,
    stats: {
      total: features.length,
      kept: rows.length,
      filtered,
      alwaysAvailable: alwaysCount,
    },
  }
}

module.exports = { processGeoJsonFeatures }
