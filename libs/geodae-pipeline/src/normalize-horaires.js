// Deterministic normalizer for French opening hours (horaires) strings.
// Ported from app/scripts/dae/lib/normalize-horaires.mjs (ESM → CJS)

const DAY_MAP = { lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 7 }
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const SEVEN_DAYS_RE = /^7\s*j?\s*[/]\s*7\s*j?/i
const DAY_RANGE_RE =
  /^(lun|mar|mer|jeu|ven|sam|dim)\s*-\s*(lun|mar|mer|jeu|ven|sam|dim)/i
const DAY_LIST_RE =
  /^((lun|mar|mer|jeu|ven|sam|dim)(\s*,\s*(lun|mar|mer|jeu|ven|sam|dim))+)/i
const DAY_SINGLE_RE = /^(lun|mar|mer|jeu|ven|sam|dim)\b/i

function dayRange(startName, endName) {
  const start = DAY_MAP[startName.toLowerCase()]
  const end = DAY_MAP[endName.toLowerCase()]
  const days = []
  let d = start
  do {
    days.push(d)
    if (d === end) break
    d = (d % 7) + 1
  } while (days.length <= 7)
  return days
}

function extractDayPrefix(text) {
  const m7 = text.match(SEVEN_DAYS_RE)
  if (m7) return { days: [...ALL_DAYS], end: m7[0].length }

  const mRange = text.match(DAY_RANGE_RE)
  if (mRange)
    return { days: dayRange(mRange[1], mRange[2]), end: mRange[0].length }

  const mList = text.match(DAY_LIST_RE)
  if (mList) {
    const names = mList[0].split(/\s*,\s*/)
    return {
      days: names.map((n) => DAY_MAP[n.trim().toLowerCase()]).filter(Boolean),
      end: mList[0].length,
    }
  }

  const mSingle = text.match(DAY_SINGLE_RE)
  if (mSingle)
    return {
      days: [DAY_MAP[mSingle[1].toLowerCase()]],
      end: mSingle[0].length,
    }

  return null
}

function stripRedundantDays(text) {
  return text
    .replace(/\b7\s*[jJ]?\s*[/]\s*7\s*[jJ]?\b/g, "")
    .replace(/\b(?:L|Ma|Me|J|V|S|D)\s+(?:au|à)\s+(?:L|Ma|Me|J|V|S|D)\b/gi, "")
    .replace(
      /\b(?:du\s+)?(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(?:au|à)\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
      ""
    )
    .replace(/\b[LMJVSD]\s+(?:au|à)\s+[LMJVSD]\b/gi, "")
    .replace(/^[,;:\-\s]+/, "")
    .trim()
}

function fmtTime(h, m) {
  const hh = parseInt(h, 10)
  const mm = parseInt(m || "0", 10)
  if (hh < 0 || hh > 24 || mm < 0 || mm > 59) return null
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

const TIME_RANGE_RE =
  /(\d{1,2})\s*[:h](\d{0,2})\s*(?:[-/à]|\ba\b)\s*(\d{1,2})\s*[:h](\d{0,2})/g
const TIME_POINT_RE = /(\d{1,2})\s*h(\d{0,2})/g

function extractTimeSlots(text) {
  const slots = []
  const re1 = new RegExp(TIME_RANGE_RE.source, "g")
  let match = re1.exec(text)
  while (match !== null) {
    const open = fmtTime(match[1], match[2])
    const close = fmtTime(match[3], match[4])
    if (open && close) slots.push({ open, close })
    match = re1.exec(text)
  }
  if (slots.length > 0) return slots

  const re2 = new RegExp(TIME_POINT_RE.source, "g")
  const points = []
  match = re2.exec(text)
  while (match !== null) {
    const t = fmtTime(match[1], match[2])
    if (t) points.push(t)
    match = re2.exec(text)
  }
  for (let i = 0; i + 1 < points.length; i += 2) {
    slots.push({ open: points[i], close: points[i + 1] })
  }
  return slots
}

function removeTimeTokens(text) {
  return text
    .replace(
      /(\d{1,2})\s*[:h](\d{0,2})\s*(?:[-/à]|\ba\b)\s*(\d{1,2})\s*[:h](\d{0,2})/g,
      ""
    )
    .replace(/(\d{1,2})\s*h(\d{0,2})/g, "")
    .trim()
}

function normalizeHoraires(raw, disponible24h) {
  const result = {
    days: null,
    slots: null,
    is24h: disponible24h === 1,
    businessHours: false,
    nightHours: false,
    events: false,
    notes: "",
  }

  if (disponible24h === 1) {
    result.days = [...ALL_DAYS]
  }

  if (!raw || raw.trim() === "") return result

  let text = raw.trim()

  const dayPrefix = extractDayPrefix(text)
  if (dayPrefix) {
    if (!result.days) result.days = dayPrefix.days
    text = text.slice(dayPrefix.end).trim()
    text = text.replace(/^[,;]\s*/, "")
  }

  text = text.replace(/,?\s*jours?\s+f[ée]ri[ée]s?\s*/gi, "").trim()

  if (/24\s*h?\s*[/]\s*24\s*h?/i.test(text)) {
    result.is24h = true
    text = text.replace(/24\s*h?\s*[/]\s*24\s*h?/gi, "").trim()
    if (!result.days) result.days = [...ALL_DAYS]
  }

  if (/heures?\s+ouvrables?/i.test(text)) {
    result.businessHours = true
    text = text.replace(/heures?\s+ouvrables?/gi, "").trim()
  }

  if (/heures?\s+de\s+nuit/i.test(text)) {
    result.nightHours = true
    text = text.replace(/heures?\s+de\s+nuit/gi, "").trim()
  }

  if (/[ée]v[éè]nements?/i.test(text)) {
    result.events = true
    text = text.replace(/[ée]v[éè]nements?/gi, "").trim()
  }

  text = stripRedundantDays(text)

  if (!result.is24h) {
    const slots = extractTimeSlots(text)
    if (slots.length > 0) {
      result.slots = slots.slice(0, 4)
      text = removeTimeTokens(text)
    }
  }

  text = text
    .replace(/^[;,\-/+.\s]+/, "")
    .replace(/[;,\-/+.\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
  if (text) result.notes = text

  return result
}

module.exports = { normalizeHoraires }
