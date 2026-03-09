// Expo SQLite wrapper (require-safe, Metro/Hermes friendly).
//
// Requirements from runtime backend selection:
// - Must NOT crash at module evaluation time when ExpoSQLite native module is missing.
// - Must be safe to load via `require('./openDbExpoSqlite')` under Metro/Hermes.
// - Must export a callable `openDbExpoSqlite()` function via CommonJS exports.
//
// IMPORTANT: Do NOT use top-level `import` from expo-sqlite here.

function describeKeys(x) {
  if (!x) return [];
  const t = typeof x;
  if (t !== "object" && t !== "function") return [];
  try {
    return Object.keys(x);
  } catch {
    return [];
  }
}

function requireExpoSqlite() {
  // Lazily require so missing native module does not crash at module evaluation time.
  // eslint-disable-next-line global-require
  const mod = require("expo-sqlite");
  const candidate = mod?.default ?? mod;

  const openDatabaseAsync =
    candidate?.openDatabaseAsync ??
    mod?.openDatabaseAsync ??
    mod?.default?.openDatabaseAsync;
  const openDatabase =
    candidate?.openDatabase ?? mod?.openDatabase ?? mod?.default?.openDatabase;

  return {
    mod,
    candidate,
    openDatabaseAsync,
    openDatabase,
  };
}

/**
 * Open an expo-sqlite database using whichever API exists.
 *
 * @param {string} dbName
 * @returns {Promise<any>} SQLiteDatabase (new API) or legacy Database (sync open)
 */
async function openDbExpoSqlite(dbName) {
  const api = requireExpoSqlite();

  if (typeof api.openDatabaseAsync === "function") {
    return api.openDatabaseAsync(dbName);
  }
  if (typeof api.openDatabase === "function") {
    // Legacy expo-sqlite API (sync open)
    return api.openDatabase(dbName);
  }

  const modKeys = describeKeys(api.mod);
  const defaultKeys = describeKeys(api.mod?.default);
  const candidateKeys = describeKeys(api.candidate);

  const err = new TypeError(
    [
      "expo-sqlite require() did not expose openDatabaseAsync nor openDatabase.",
      `module typeof=${typeof api.mod} keys=[${modKeys.join(", ")}].`,
      `default typeof=${typeof api.mod?.default} keys=[${defaultKeys.join(
        ", ",
      )}].`,
      `candidate typeof=${typeof api.candidate} keys=[${candidateKeys.join(
        ", ",
      )}].`,
    ].join(" "),
  );
  err.expoSqliteModuleKeys = modKeys;
  err.expoSqliteDefaultKeys = defaultKeys;
  err.expoSqliteCandidateKeys = candidateKeys;
  throw err;
}

// Explicit CommonJS export shape (so require() always returns a non-null object).
module.exports = {
  __esModule: true,
  openDbExpoSqlite,
  openDb: openDbExpoSqlite,
  default: openDbExpoSqlite,
};
