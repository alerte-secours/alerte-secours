/**
 * Normalize an address string.
 * - trim
 * - collapse multiple spaces
 * - replace '$' separators with ', ' (police source)
 */
export function normalizeAddress(raw) {
  if (!raw) return null;
  return raw
    .replace(/\$/g, ", ")
    .replace(/\s+/g, " ")
    .trim() || null;
}

/**
 * Build an address from components.
 */
export function buildAddress(...parts) {
  const filtered = parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return filtered.length > 0 ? filtered.join(" ") : null;
}
