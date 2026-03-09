// Hermes-safe H3 wrapper.
//
// Why this exists:
// - `h3-js`'s default entry (`dist/h3-js.js`) is a Node-oriented Emscripten build.
// - Metro (React Native) does not reliably honor the package.json `browser` field,
//   so RN/Hermes may resolve the Node build, which relies on Node Buffer encodings
//   (e.g. "utf-16le") and crashes under Hermes.
//
// This wrapper forces the browser bundle when running under Hermes.

/* eslint-disable global-require */

function isHermes() {
  // https://reactnative.dev/docs/hermes
  return typeof global === "object" && !!global.HermesInternal;
}

function supportsUtf16leTextDecoder() {
  if (typeof global !== "object" || typeof global.TextDecoder !== "function") {
    return false;
  }
  try {
    // Hermes' built-in TextDecoder historically supports only utf-8.
    // `h3-js` bundles try to instantiate a UTF-16LE decoder at module init.
    // If unsupported, Hermes throws: RangeError: Unknown encoding: utf-16le
    // Detect support and fall back to the non-TextDecoder path when needed.
    // eslint-disable-next-line no-new
    new global.TextDecoder("utf-16le");
    return true;
  } catch {
    return false;
  }
}

// Keep the choice static at module init so exports are stable.
let h3;

if (isHermes()) {
  // Force browser bundle (no Node fs/path/Buffer branches).
  // Additionally, if Hermes' TextDecoder doesn't support utf-16le, temporarily
  // hide it so h3-js uses its pure-JS decoding fallback instead.
  const hasUtf16 = supportsUtf16leTextDecoder();
  const originalTextDecoder = global.TextDecoder;
  if (!hasUtf16) {
    global.TextDecoder = undefined;
  }
  try {
    h3 = require("h3-js/dist/browser/h3-js");
  } finally {
    if (!hasUtf16) {
      global.TextDecoder = originalTextDecoder;
    }
  }
} else {
  // Jest/node tests can keep using the default build.
  h3 = require("h3-js");
}

export const latLngToCell = h3.latLngToCell;
export const gridDisk = h3.gridDisk;

// Export the full namespace for any other future usage.
export default h3;
