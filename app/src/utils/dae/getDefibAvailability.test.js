import { getDefibAvailability } from "./getDefibAvailability";

function makeLocalDate(y, m, d, hh, mm) {
  // Note: uses local time on purpose, because getDefibAvailability relies on
  // Date#getDay() / Date#getHours() which are locale/timezone dependent.
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

describe("dae/getDefibAvailability", () => {
  test("disponible_24h=1 always open", () => {
    const res = getDefibAvailability(null, 1, makeLocalDate(2026, 3, 1, 3, 0));
    expect(res).toEqual({ status: "open", label: "24h/24 7j/7" });
  });

  test("is24h + days includes today => open", () => {
    // 2026-03-02 is Monday (ISO=1)
    const now = makeLocalDate(2026, 3, 2, 12, 0);
    const res = getDefibAvailability(
      { days: [1], slots: null, is24h: true },
      0,
      now,
    );
    expect(res.status).toBe("open");
  });

  test("days excludes today => closed", () => {
    // Monday
    const now = makeLocalDate(2026, 3, 2, 12, 0);
    const res = getDefibAvailability({ days: [2, 3], slots: null }, 0, now);
    expect(res.status).toBe("closed");
  });

  test("slots determine open/closed", () => {
    // Monday 09:00
    const now = makeLocalDate(2026, 3, 2, 9, 0);
    const res = getDefibAvailability(
      {
        days: [1],
        slots: [{ open: "08:00", close: "10:00" }],
      },
      0,
      now,
    );
    expect(res.status).toBe("open");
  });

  test("events => unknown", () => {
    const now = makeLocalDate(2026, 3, 2, 9, 0);
    const res = getDefibAvailability(
      {
        days: null,
        slots: null,
        events: true,
      },
      0,
      now,
    );
    expect(res).toEqual({ status: "unknown", label: "Selon événements" });
  });
});
