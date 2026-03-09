/**
 * @typedef {{
 *  days: number[]|null,
 *  slots: {open: string, close: string}[]|null,
 *  is24h?: boolean,
 *  businessHours?: boolean,
 *  nightHours?: boolean,
 *  events?: boolean,
 *  notes?: string,
 * }} HorairesStd
 */

/**
 * @typedef {{ status: "open"|"closed"|"unknown", label: string }} DefibAvailability
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseHHMM(str) {
  if (typeof str !== "string") return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(str.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// ISO 8601 day number: 1=Mon ... 7=Sun
function isoDayNumber(date) {
  const js = date.getDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

const DAY_LABELS = [null, "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function daysLabel(days) {
  if (!Array.isArray(days) || days.length === 0) return "";
  const uniq = Array.from(new Set(days)).filter((d) => d >= 1 && d <= 7);
  uniq.sort((a, b) => a - b);
  if (uniq.length === 1) return DAY_LABELS[uniq[0]];
  return `${DAY_LABELS[uniq[0]]}-${DAY_LABELS[uniq[uniq.length - 1]]}`;
}

function formatTimeFromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function isWithinSlot(nowMin, openMin, closeMin) {
  if (openMin == null || closeMin == null) return false;
  if (openMin === closeMin) return true;
  // Cross-midnight slot (e.g. 20:00-08:00)
  if (closeMin < openMin) {
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}

/**
 * Determine availability for a given defib schedule.
 * Priority logic per PLAN_DAE-merged.md.
 *
 * @param {HorairesStd|null|undefined} horaires_std
 * @param {number|boolean|null|undefined} disponible_24h
 * @param {Date} [now]
 * @returns {DefibAvailability}
 */
export function getDefibAvailability(
  horaires_std,
  disponible_24h,
  now = new Date(),
) {
  if (disponible_24h === 1 || disponible_24h === true) {
    return { status: "open", label: "24h/24 7j/7" };
  }

  /** @type {HorairesStd} */
  const h =
    horaires_std && typeof horaires_std === "object" ? horaires_std : null;
  if (!h) {
    return { status: "unknown", label: "Horaires non renseignés" };
  }

  const today = isoDayNumber(now);
  const nowMin = minutesSinceMidnight(now);

  const days = Array.isArray(h.days) ? h.days : null;
  const hasToday = Array.isArray(days) ? days.includes(today) : null;

  // 2. is24h + today
  if (h.is24h === true && hasToday === true) {
    return { status: "open", label: "24h/24" };
  }

  // 3. days known and today not included
  if (Array.isArray(days) && hasToday === false) {
    const label = daysLabel(days);
    return { status: "closed", label: label || "Fermé aujourd'hui" };
  }

  // 4. explicit slots for today
  if (hasToday === true && Array.isArray(h.slots) && h.slots.length > 0) {
    let isOpen = false;
    let nextBoundaryLabel = "";

    for (const slot of h.slots) {
      const openMin = parseHHMM(slot.open);
      const closeMin = parseHHMM(slot.close);
      if (openMin == null || closeMin == null) continue;

      if (isWithinSlot(nowMin, openMin, closeMin)) {
        isOpen = true;
        nextBoundaryLabel = `Jusqu'à ${formatTimeFromMinutes(closeMin)}`;
        break;
      }
    }

    if (isOpen) {
      return { status: "open", label: nextBoundaryLabel || "Ouvert" };
    }

    // Not within any slot: show next opening time if any (same-day).
    const opens = h.slots
      .map((s) => parseHHMM(s.open))
      .filter((m) => typeof m === "number")
      .sort((a, b) => a - b);
    const nextOpen = opens.find((m) => m > nowMin);
    if (typeof nextOpen === "number") {
      return {
        status: "closed",
        label: `Ouvre à ${formatTimeFromMinutes(nextOpen)}`,
      };
    }

    return { status: "closed", label: "Fermé" };
  }

  // 5. business hours approximation (Mon-Fri 08:00-18:00)
  if (h.businessHours === true) {
    const isWeekday = today >= 1 && today <= 5;
    const openMin = 8 * 60;
    const closeMin = 18 * 60;
    const isOpen = isWeekday && nowMin >= openMin && nowMin < closeMin;
    return {
      status: isOpen ? "open" : "closed",
      label: isOpen ? "Heures ouvrables" : "Fermé (heures ouvrables)",
    };
  }

  // 6. night hours approximation (20:00-08:00)
  if (h.nightHours === true) {
    const openMin = 20 * 60;
    const closeMin = 8 * 60;
    const isOpen = isWithinSlot(nowMin, openMin, closeMin);
    return {
      status: isOpen ? "open" : "closed",
      label: isOpen ? "Heures de nuit" : "Fermé (heures de nuit)",
    };
  }

  // 7. events
  if (h.events === true) {
    return { status: "unknown", label: "Selon événements" };
  }

  // 8. fallback
  const notes = typeof h.notes === "string" ? h.notes.trim() : "";
  return { status: "unknown", label: notes || "Horaires non renseignés" };
}
