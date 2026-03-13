/**
 * Normalize gendarmerie opening hours from structured CSV columns.
 *
 * Input row contains columns like:
 *   lundi_plage1_debut, lundi_plage1_fin, lundi_plage2_debut, ...
 *   jours_feries_plage1_debut, jours_feries_plage1_fin, ...
 *
 * @param {Object} row - CSV record object
 * @returns {{ horairesStd: Object|null, horairesRaw: string|null }}
 */

const DAYS_MAP = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 7,
};

const DAY_LABELS = {
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
  7: "Dim",
};

/**
 * Convert "08h00" or "8h0" to "08:00"
 */
function convertHour(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/(\d{1,2})h(\d{1,2})/, (_, h, m) => h.padStart(2, "0") + ":" + m.padStart(2, "0"));
}

/**
 * Extract time slots for a given day prefix.
 * @param {Object} row
 * @param {string} prefix - e.g. "lundi" or "jours_feries"
 * @returns {Array<{open: string, close: string}>}
 */
function extractSlots(row, prefix) {
  const slots = [];
  for (let i = 1; i <= 3; i++) {
    const openKey = `${prefix}_plage${i}_debut`;
    const closeKey = `${prefix}_plage${i}_fin`;
    const open = convertHour(row[openKey]);
    const close = convertHour(row[closeKey]);
    if (open && close) {
      slots.push({ open, close });
    }
  }
  return slots;
}

/**
 * Check if slots cover a full 24h period.
 * @param {Array<{open: string, close: string}>} slots
 * @returns {boolean}
 */
function coversFullDay(slots) {
  if (slots.length === 0) return false;
  // Sort by open time
  const sorted = [...slots].sort((a, b) => a.open.localeCompare(b.open));
  // Check if first starts at 00:00 and last ends at 24:00
  if (sorted[0].open !== "00:00") return false;
  const lastClose = sorted[sorted.length - 1].close;
  if (lastClose !== "24:00") return false;
  // Check continuity
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].open !== sorted[i - 1].close) return false;
  }
  return true;
}

export function normalizeHorairesGn(row) {
  const slotsByDay = {};
  const days = [];
  for (const [dayName, dayNum] of Object.entries(DAYS_MAP)) {
    const daySlots = extractSlots(row, dayName);
    if (daySlots.length > 0) {
      days.push(dayNum);
      slotsByDay[dayNum] = daySlots;
    }
  }

  // is24h requires ALL 7 days present and each covering the full 24h period
  const allDayNames = Object.keys(DAYS_MAP);
  const is24h =
    days.length === allDayNames.length &&
    days.every((dayNum) => coversFullDay(slotsByDay[dayNum]));

  // Holidays
  const holidays = extractSlots(row, "jours_feries");

  // If no data at all, return null
  if (days.length === 0 && holidays.length === 0) {
    return { horairesStd: null, horairesRaw: null };
  }

  const horairesStd = {
    days,
    slotsByDay,
    holidays,
    is24h,
  };

  // Build human-readable raw text
  const rawParts = [];
  for (const dayNum of days) {
    const label = DAY_LABELS[dayNum];
    const slotsStr = slotsByDay[dayNum]
      .map((s) => `${s.open}-${s.close}`)
      .join(", ");
    rawParts.push(`${label}: ${slotsStr}`);
  }
  if (holidays.length > 0) {
    const holidayStr = holidays
      .map((s) => `${s.open}-${s.close}`)
      .join(", ");
    rawParts.push(`Jours fériés: ${holidayStr}`);
  }

  const horairesRaw = rawParts.join(" | ");

  return { horairesStd, horairesRaw };
}
