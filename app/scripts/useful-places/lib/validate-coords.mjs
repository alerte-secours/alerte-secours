/**
 * Validate and optionally correct geographic coordinates.
 *
 * @param {number} lat - Latitude value
 * @param {number} lon - Longitude value
 * @returns {{ lat: number, lon: number, valid: boolean, corrected: boolean, reason: string|null }}
 */
export function validateCoords(lat, lon) {
  // Reject nulls or NaN
  if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { lat, lon, valid: false, corrected: false, reason: "missing_or_nan" };
  }

  // Reject (0, 0)
  if (lat === 0 && lon === 0) {
    return { lat, lon, valid: false, corrected: false, reason: "zero_zero" };
  }

  // Reject identical lat/lon only within metropolitan France's latitude range (41-52)
  // where it's clearly a copy-paste data error.
  // Points like (2.0, 2.0) or (7.0, 7.0) exist in the real world but not in France.
  if (lat === lon && lat !== 0 && lat >= 41 && lat <= 52) {
    return { lat, lon, valid: false, corrected: false, reason: "identical_lat_lon" };
  }

  // Detect swapped lat/lon for mainland France:
  // France metropolitan lat ~41-52, lon ~-6-10
  // Only apply when the original coords clearly don't fit any valid location
  // (e.g. lon=48 is impossible as a longitude for France, so it must be a latitude)
  // but first exclude overseas territories where lon 41-52 IS valid:
  // - Mayotte: lat ~-13, lon ~45 — skip swap if lat is in overseas lat ranges
  if (
    lon >= 41 && lon <= 52 && lat >= -6 && lat <= 10 &&
    !(lat >= -22 && lat <= -12) // Don't swap if lat is in Réunion/Mayotte range
  ) {
    return { lat: lon, lon: lat, valid: true, corrected: true, reason: "swapped_lat_lon" };
  }

  // Validate ranges:
  // Metropolitan France: lat 41-52, lon -6 to 10
  // Overseas territories: varied latitudes/longitudes
  // Accept wide range for overseas (Réunion, Mayotte, Guadeloupe, Martinique, Guyane, Nouvelle-Calédonie, Polynésie)
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { lat, lon, valid: false, corrected: false, reason: "out_of_range" };
  }

  return { lat, lon, valid: true, corrected: false, reason: null };
}
