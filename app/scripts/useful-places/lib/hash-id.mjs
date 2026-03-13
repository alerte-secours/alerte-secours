import { createHash } from "node:crypto";

/**
 * Generate a deterministic ID from arbitrary fields.
 * @param  {...string} fields
 * @returns {string} 20-char hex hash
 */
export function hashId(...fields) {
  const payload = fields.map((f) => (f ?? "").toString().trim()).join("|");
  return createHash("sha256").update(payload, "utf-8").digest("hex").slice(0, 20);
}
