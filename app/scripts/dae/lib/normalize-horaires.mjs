// Re-export from the shared geodae-pipeline library.
// This file exists for backwards compatibility with geodae-to-csv.js.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { normalizeHoraires } = require("../../../../libs/geodae-pipeline/src/normalize-horaires");
export { normalizeHoraires };
