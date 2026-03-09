import BackgroundGeolocation from "react-native-background-geolocation";

import {
  BASE_GEOLOCATION_CONFIG,
  BASE_GEOLOCATION_INVARIANTS,
} from "~/location/backgroundGeolocationConfig";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const isPlainObject = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);

const mergeSection = (base, invariants, override) => ({
  ...(isPlainObject(base) ? base : {}),
  ...(isPlainObject(invariants) ? invariants : {}),
  ...(isPlainObject(override) ? override : {}),
});

/**
 * Build a deterministic `BackgroundGeolocation.setConfig()` payload.
 *
 * Goal: never rely on native deep-merge behavior for nested objects.
 *
 * Rules:
 * - When a top-level section is touched (`geolocation|app|http|persistence`), send a complete
 *   section built from the base config + invariants + overrides.
 * - Preserve existing runtime `http.headers` unless explicitly overridden.
 *   - `headers: {}` is treated as an explicit clear.
 * - Preserve existing runtime `persistence.extras` unless explicitly overridden.
 *   - `extras: {}` is treated as an explicit clear.
 */
export default async function buildBackgroundGeolocationSetConfigPayload(
  partialConfig = {},
) {
  const partial = isPlainObject(partialConfig) ? partialConfig : {};

  let state = null;
  try {
    state = await BackgroundGeolocation.getState();
  } catch {
    state = null;
  }

  const prevHttpHeaders = isPlainObject(state?.http?.headers)
    ? state.http.headers
    : {};

  const prevPersistenceExtras = isPlainObject(state?.persistence?.extras)
    ? state.persistence.extras
    : {};

  const payload = {};

  if (isPlainObject(partial.geolocation)) {
    payload.geolocation = mergeSection(
      BASE_GEOLOCATION_CONFIG.geolocation,
      null,
      partial.geolocation,
    );
  }

  if (isPlainObject(partial.app)) {
    payload.app = mergeSection(
      BASE_GEOLOCATION_CONFIG.app,
      BASE_GEOLOCATION_INVARIANTS.app,
      partial.app,
    );
  }

  if (isPlainObject(partial.http)) {
    const http = mergeSection(
      BASE_GEOLOCATION_CONFIG.http,
      BASE_GEOLOCATION_INVARIANTS.http,
      partial.http,
    );

    if (hasOwn(partial.http, "headers")) {
      const nextHeaders = isPlainObject(partial.http.headers)
        ? partial.http.headers
        : {};

      // Explicit reset: allow clearing headers (eg anonymous mode).
      if (Object.keys(nextHeaders).length === 0) {
        http.headers = {};
      } else {
        http.headers = { ...prevHttpHeaders, ...nextHeaders };
      }
    } else if (Object.keys(prevHttpHeaders).length > 0) {
      // Preserve existing runtime headers (important when re-applying invariants).
      http.headers = prevHttpHeaders;
    }

    payload.http = http;
  }

  if (isPlainObject(partial.persistence)) {
    const persistence = mergeSection(
      BASE_GEOLOCATION_CONFIG.persistence,
      BASE_GEOLOCATION_INVARIANTS.persistence,
      partial.persistence,
    );

    if (hasOwn(partial.persistence, "extras")) {
      const nextExtras = isPlainObject(partial.persistence.extras)
        ? partial.persistence.extras
        : {};

      // Explicit reset: allow clearing extras.
      if (Object.keys(nextExtras).length === 0) {
        persistence.extras = {};
      } else {
        persistence.extras = { ...prevPersistenceExtras, ...nextExtras };
      }
    } else if (Object.keys(prevPersistenceExtras).length > 0) {
      // Preserve existing runtime extras (important when re-applying invariants).
      persistence.extras = prevPersistenceExtras;
    }

    payload.persistence = persistence;
  }

  // Pass-through any additional config sections (eg `activity` in tracking profiles).
  for (const key of Object.keys(partial)) {
    if (key === "geolocation") continue;
    if (key === "app") continue;
    if (key === "http") continue;
    if (key === "persistence") continue;
    payload[key] = partial[key];
  }

  return payload;
}
