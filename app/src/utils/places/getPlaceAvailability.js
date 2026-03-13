/**
 * Determine availability for any useful place based on its schedule.
 * Generalizes the DAE getDefibAvailability logic to support:
 * - DAE standard horaires_std (days/slots/is24h/businessHours/nightHours/events)
 * - Gendarmerie slotsByDay format
 * - Angela disponibilite format (jour/nuit/jour_et_nuit)
 * - Police with no hours (unknown status)
 *
 * @typedef {{ status: "open"|"closed"|"unknown", label: string }} PlaceAvailability
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseHHMM(str) {
  if (typeof str !== "string") return null;
  const m = /^([01]\d|2[0-4]):([0-5]\d)$/.exec(str.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  // 24:xx is only valid as 24:00 (= midnight end-of-day)
  if (h === 24 && min !== 0) return null;
  return h * 60 + min;
}

function isoDayNumber(date) {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

const DAY_I18N_KEYS = [
  null,
  "dayMon",
  "dayTue",
  "dayWed",
  "dayThu",
  "dayFri",
  "daySat",
  "daySun",
];

const DAY_DEFAULTS = [null, "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Named time constants (minutes since midnight)
const BUSINESS_OPEN = 480; // 08:00
const BUSINESS_CLOSE = 1080; // 18:00
const NIGHT_OPEN = 1200; // 20:00
const NIGHT_CLOSE = 480; // 08:00 (next day)

function dayLabel(dayNum, t) {
  return t(DAY_I18N_KEYS[dayNum], { defaultValue: DAY_DEFAULTS[dayNum] });
}

function daysLabel(days, t) {
  if (!Array.isArray(days) || days.length === 0) return "";
  const uniq = Array.from(new Set(days))
    .filter((d) => d >= 1 && d <= 7)
    .sort((a, b) => a - b);
  if (uniq.length === 0) return "";
  if (uniq.length === 1) return dayLabel(uniq[0], t);
  // Check if days are consecutive
  const isConsecutive = uniq.every((d, i) => i === 0 || d === uniq[i - 1] + 1);
  if (isConsecutive) {
    return `${dayLabel(uniq[0], t)}-${dayLabel(uniq[uniq.length - 1], t)}`;
  }
  // Non-consecutive: list individual days
  return uniq.map((d) => dayLabel(d, t)).join(", ");
}

function formatTimeFromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function isWithinSlot(nowMin, openMin, closeMin) {
  if (openMin == null || closeMin == null) return false;
  // Zero-length slot (e.g. 08:00-08:00) is a data error, not 24h
  if (openMin === closeMin) return false;
  if (closeMin < openMin) {
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}

/**
 * Get availability for a useful place.
 *
 * @param {Object|null} horaires_std - Parsed schedule object
 * @param {number|null} disponible_24h
 * @param {string} _placeType - Reserved for future type-specific logic (currently unused)
 * @param {Date} [now]
 * @param {function} [t] - i18n translation function (from useTranslation)
 * @returns {PlaceAvailability}
 */
export function getPlaceAvailability(
  horaires_std,
  disponible_24h,
  _placeType,
  now = new Date(),
  t = (key, opts) => {
    // Fallback: return the key itself (labels will still be readable)
    if (opts?.defaultValue) return opts.defaultValue;
    return key;
  },
) {
  // 24h flag takes priority for all types (SQLite returns 0/1 integers)
  if (disponible_24h === 1 || disponible_24h === true) {
    return {
      status: "open",
      label: t("avail24h7", { defaultValue: "24h/24 7j/7" }),
    };
  }

  const h =
    horaires_std && typeof horaires_std === "object" ? horaires_std : null;

  // Angela: disponibilite format
  if (h && h.disponibilite) {
    switch (h.disponibilite) {
      case "jour_et_nuit":
        return {
          status: "open",
          label: t("availDayAndNight", { defaultValue: "Jour et nuit" }),
        };
      case "jour":
        return {
          status: "unknown",
          label: t("availDaytime", { defaultValue: "Ouvert en journée" }),
        };
      case "nuit":
        return {
          status: "unknown",
          label: t("availNighttime", { defaultValue: "Ouvert la nuit" }),
        };
      default:
        break;
    }
  }

  // Gendarmerie: slotsByDay format
  if (h && h.slotsByDay) {
    const today = isoDayNumber(now);
    const nowMin = minutesSinceMidnight(now);
    const daySlots = h.slotsByDay[today];

    if (h.is24h) {
      return {
        status: "open",
        label: t("avail24h", { defaultValue: "24h/24" }),
      };
    }

    if (!daySlots || daySlots.length === 0) {
      // Check if there are any days with slots
      const days = h.days || [];
      if (days.length > 0) {
        return {
          status: "closed",
          label:
            daysLabel(days, t) ||
            t("availClosedToday", { defaultValue: "Fermé aujourd'hui" }),
        };
      }
      return {
        status: "unknown",
        label: t("availNoHours", { defaultValue: "Horaires non renseignés" }),
      };
    }

    // Check current slots
    for (const slot of daySlots) {
      const openMin = parseHHMM(slot.open);
      const closeMin = parseHHMM(slot.close);
      if (isWithinSlot(nowMin, openMin, closeMin)) {
        return {
          status: "open",
          label: t("availUntil", {
            time: formatTimeFromMinutes(closeMin),
            defaultValue: `Jusqu'à ${formatTimeFromMinutes(closeMin)}`,
          }),
        };
      }
    }

    // Find next opening
    const opens = daySlots
      .map((s) => parseHHMM(s.open))
      .filter((m) => typeof m === "number")
      .sort((a, b) => a - b);
    const nextOpen = opens.find((m) => m > nowMin);
    if (typeof nextOpen === "number") {
      return {
        status: "closed",
        label: t("availOpensAt", {
          time: formatTimeFromMinutes(nextOpen),
          defaultValue: `Ouvre à ${formatTimeFromMinutes(nextOpen)}`,
        }),
      };
    }

    return {
      status: "closed",
      label: t("availClosed", { defaultValue: "Fermé" }),
    };
  }

  // DAE standard format (days/slots/is24h/businessHours/nightHours/events)
  if (h) {
    const today = isoDayNumber(now);
    const nowMin = minutesSinceMidnight(now);
    const days = Array.isArray(h.days) ? h.days : null;
    const hasToday = Array.isArray(days) ? days.includes(today) : null;

    if (h.is24h === true && hasToday === true) {
      return {
        status: "open",
        label: t("avail24h", { defaultValue: "24h/24" }),
      };
    }

    if (Array.isArray(days) && hasToday === false) {
      return {
        status: "closed",
        label:
          daysLabel(days, t) ||
          t("availClosedToday", { defaultValue: "Fermé aujourd'hui" }),
      };
    }

    if (hasToday === true && Array.isArray(h.slots) && h.slots.length > 0) {
      for (const slot of h.slots) {
        const openMin = parseHHMM(slot.open);
        const closeMin = parseHHMM(slot.close);
        if (isWithinSlot(nowMin, openMin, closeMin)) {
          return {
            status: "open",
            label: t("availUntil", {
              time: formatTimeFromMinutes(closeMin),
              defaultValue: `Jusqu'à ${formatTimeFromMinutes(closeMin)}`,
            }),
          };
        }
      }

      const opens = h.slots
        .map((s) => parseHHMM(s.open))
        .filter((m) => typeof m === "number")
        .sort((a, b) => a - b);
      const nextOpen = opens.find((m) => m > nowMin);
      if (typeof nextOpen === "number") {
        return {
          status: "closed",
          label: t("availOpensAt", {
            time: formatTimeFromMinutes(nextOpen),
            defaultValue: `Ouvre à ${formatTimeFromMinutes(nextOpen)}`,
          }),
        };
      }

      return {
        status: "closed",
        label: t("availClosed", { defaultValue: "Fermé" }),
      };
    }

    if (h.businessHours === true) {
      const isWeekday = today >= 1 && today <= 5;
      const isOpen =
        isWeekday && nowMin >= BUSINESS_OPEN && nowMin < BUSINESS_CLOSE;
      return {
        status: isOpen ? "open" : "closed",
        label: isOpen
          ? t("availBusinessHours", { defaultValue: "Heures ouvrables" })
          : t("availClosedBusiness", {
              defaultValue: "Fermé (heures ouvrables)",
            }),
      };
    }

    if (h.nightHours === true) {
      const isOpen = isWithinSlot(nowMin, NIGHT_OPEN, NIGHT_CLOSE);
      return {
        status: isOpen ? "open" : "closed",
        label: isOpen
          ? t("availNightHours", { defaultValue: "Heures de nuit" })
          : t("availClosedNight", { defaultValue: "Fermé (heures de nuit)" }),
      };
    }

    if (h.events === true) {
      return {
        status: "unknown",
        label: t("availEvents", { defaultValue: "Selon événements" }),
      };
    }

    const notes = typeof h.notes === "string" ? h.notes.trim() : "";
    if (notes) {
      return { status: "unknown", label: notes };
    }
  }

  // No schedule data
  return {
    status: "unknown",
    label: t("availNoHours", { defaultValue: "Horaires non renseignés" }),
  };
}
