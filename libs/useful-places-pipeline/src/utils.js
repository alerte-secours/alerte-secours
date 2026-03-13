const { createHash } = require("node:crypto")

function hashId(...fields) {
  const payload = fields.map((f) => (f ?? "").toString().trim()).join("|")
  return createHash("sha256")
    .update(payload, "utf-8")
    .digest("hex")
    .slice(0, 20)
}

function validateCoords(lat, lon) {
  if (
    lat == null ||
    lon == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  )
    return { lat, lon, valid: false, corrected: false }
  if (lat === 0 && lon === 0)
    return { lat, lon, valid: false, corrected: false }
  // Reject identical lat/lon only within metro France lat range (41-52)
  // where it's clearly a data entry error. Points like (7,7) exist elsewhere.
  if (lat === lon && lat !== 0 && lat >= 41 && lat <= 52)
    return { lat, lon, valid: false, corrected: false }
  // Detect swapped lat/lon for France (lat ~41-52, lon ~-6-10)
  // Exclude overseas territories where lon 41-52 is valid (Mayotte: lat ~-13, lon ~45)
  if (
    lon >= 41 &&
    lon <= 52 &&
    lat >= -6 &&
    lat <= 10 &&
    !(lat >= -22 && lat <= -12) // Don't swap if lat is in Réunion/Mayotte range
  ) {
    return { lat: lon, lon: lat, valid: true, corrected: true }
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
    return { lat, lon, valid: false, corrected: false }
  return { lat, lon, valid: true, corrected: false }
}

function epsg3857ToWgs84(x, y) {
  const lonVal = (x / 20037508.34) * 180
  let latVal = (y / 20037508.34) * 180
  latVal =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((latVal * Math.PI) / 180)) - Math.PI / 2)
  return { lat: latVal, lon: lonVal }
}

function convertHour(raw) {
  if (!raw || typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  return trimmed.replace(
    /(\d{1,2})h(\d{2})/,
    (_, h, m) => `${h.padStart(2, "0")}:${m}`
  )
}

function coversFullDay(slots) {
  if (slots.length === 0) return false
  const sorted = [...slots].sort((a, b) => a.open.localeCompare(b.open))
  if (sorted[0].open !== "00:00") return false
  const lastClose = sorted[sorted.length - 1].close
  if (lastClose !== "24:00") return false
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].open !== sorted[i - 1].close) return false
  }
  return true
}

const DAY_LABELS = {
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
  7: "Dim",
}

function createStats() {
  return { correctedCount: 0 }
}

module.exports = {
  hashId,
  validateCoords,
  epsg3857ToWgs84,
  convertHour,
  coversFullDay,
  DAY_LABELS,
  createStats,
}
