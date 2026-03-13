/**
 * Convert EPSG:3857 (Web Mercator) coordinates to WGS84 (EPSG:4326).
 *
 * @param {number} x - EPSG:3857 X coordinate
 * @param {number} y - EPSG:3857 Y coordinate
 * @returns {{ lat: number, lon: number }}
 */
export function epsg3857ToWgs84(x, y) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  return { lat, lon };
}

/**
 * Parse a WKT POINT string and convert from EPSG:3857 to WGS84.
 * Expected format: "POINT (x y)"
 *
 * @param {string} wkt - WKT POINT string
 * @returns {{ lat: number, lon: number }|null}
 */
export function parsePointEpsg3857(wkt) {
  if (!wkt) return null;
  const match = /POINT\s*\(\s*([^\s]+)\s+([^\s)]+)\s*\)/.exec(wkt);
  if (!match) return null;
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return epsg3857ToWgs84(x, y);
}
