import { getPlaceAvailability } from "./getPlaceAvailability";

/**
 * Filter out DAE places that are currently closed.
 * Non-DAE places pass through unfiltered.
 * DAEs with status "open" or "unknown" are kept.
 */
export function filterUnavailableDae(places, now = new Date()) {
  return places.filter((p) => {
    if (p.type !== "dae") return true;
    const { status } = getPlaceAvailability(
      p.horaires_std,
      p.disponible_24h,
      p.type,
      now,
    );
    return status !== "closed";
  });
}
