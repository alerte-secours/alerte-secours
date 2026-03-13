// Open the pre-built geodae SQLite database.
//
// IMPORTANT: This module must not crash at load time when a native SQLite
// backend is missing (Hermes: "Cannot find native module 'ExpoSQLite'").
//
// Strategy:
//  1) Prefer @op-engineering/op-sqlite (bare RN) via ./openDbOpSqlite
//  2) Fallback to expo-sqlite (Expo) ONLY if it can be required
//  3) If nothing works, callers should use getDbSafe() and handle { db: null }

const DB_NAME = "geodae.db";

let _dbPromise = null;
let _backendPromise = null;
let _selectedBackendName = null;

function describeModuleShape(mod) {
  const t = typeof mod;
  const keys =
    mod && (t === "object" || t === "function") ? Object.keys(mod) : [];
  return { type: t, keys };
}

function pickOpener(mod, name) {
  // Deterministic picking to reduce CJS/ESM/Metro export-shape ambiguity.
  // Priority is explicit and matches wrapper contract.
  const opener =
    mod?.openDbOpSqlite ??
    mod?.openDbExpoSqlite ??
    mod?.openDb ??
    mod?.default ??
    mod;

  if (typeof opener === "function") return opener;

  const { type, keys } = describeModuleShape(mod);
  throw new TypeError(
    [
      `Backend module did not export a callable opener (backend=${name}).`,
      `module typeof=${type} keys=[${keys.join(", ")}].`,
      `picked typeof=${typeof opener}.`,
    ].join(" "),
  );
}

export default function getDb() {
  if (!_dbPromise) {
    _dbPromise = getDbImpl();
  }
  return _dbPromise;
}

/**
 * Close the current DB connection and clear all cached state.
 * After calling this, the next `getDb()` / `getDbSafe()` call will re-open
 * the DB from disk — picking up any file that was swapped in the meantime.
 */
export function resetDb() {
  // Close the op-sqlite backend if it was loaded.
  try {
    // eslint-disable-next-line global-require
    const { resetDbOpSqlite } = require("./openDbOpSqlite");
    if (typeof resetDbOpSqlite === "function") {
      resetDbOpSqlite();
    }
  } catch {
    // op-sqlite not available — nothing to close.
  }

  _dbPromise = null;
  _backendPromise = null;
  _selectedBackendName = null;
}

/**
 * Non-throwing DB opener.
 *
 * v1 requirement: DB open failures must not crash the app. Downstream UI can
 * display an error/empty state and keep overlays disabled.
 *
 * @returns {Promise<{ db: import('expo-sqlite').SQLiteDatabase | null, error: Error | null }>}
 */
export async function getDbSafe() {
  try {
    const db = await getDb();
    return { db, error: null };
  } catch (error) {
    // Actionable runtime logging — include backend attempts + underlying error/stack.
    // Keep behavior unchanged: do not crash, keep returning { db: null, error }.
    const prefix = "[DAE_DB] Failed to open embedded DAE DB";

    const logErrorDetails = (label, err) => {
      if (!err) {
        console.warn(`${prefix} ${label} <no error object>`);
        return;
      }

      const msg = err?.message;
      const stack = err?.stack;

      // Log the raw error object first (best for Hermes / native errors).
      console.warn(`${prefix} ${label} raw:`, err);
      console.warn(`${prefix} ${label} message:`, msg);
      if (stack) console.warn(`${prefix} ${label} stack:\n${stack}`);

      const cause = err?.cause;
      if (cause) {
        console.warn(`${prefix} ${label} cause raw:`, cause);
        console.warn(`${prefix} ${label} cause message:`, cause?.message);
        if (cause?.stack) {
          console.warn(`${prefix} ${label} cause stack:\n${cause.stack}`);
        }
      }
    };

    // Primary error thrown by getDb()/selectBackend.
    if (_selectedBackendName) {
      console.warn(`${prefix} selected backend:`, _selectedBackendName);
    }
    logErrorDetails("(primary)", error);

    // Nested backend selection errors (attached by selectBackend()).
    const backends = error?.backends;
    if (Array.isArray(backends) && backends.length > 0) {
      for (const entry of backends) {
        const backend = entry?.backend ?? "<unknown-backend>";
        console.warn(`${prefix} backend attempted:`, backend);
        logErrorDetails(`(backend=${backend})`, entry?.error);
      }
    }

    return { db: null, error };
  }
}

async function getDbImpl() {
  const backend = await selectBackend();
  return backend.getDb();
}

async function selectBackend() {
  if (_backendPromise) return _backendPromise;

  _backendPromise = (async () => {
    const errors = [];

    // 1) Prefer op-sqlite backend when available.
    try {
      let opBackendModule;
      try {
        console.warn(
          "[DAE_DB] op-sqlite: requiring backend module ./openDbOpSqlite...",
        );
        // eslint-disable-next-line global-require
        opBackendModule = require("./openDbOpSqlite");

        const opModuleType = typeof opBackendModule;
        const opModuleKeys =
          opBackendModule &&
          (typeof opBackendModule === "object" ||
            typeof opBackendModule === "function")
            ? Object.keys(opBackendModule)
            : [];
        console.warn(
          "[DAE_DB] op-sqlite: require ./openDbOpSqlite success",
          `type=${opModuleType} keys=[${opModuleKeys.join(", ")}]`,
        );
      } catch (requireError) {
        console.warn(
          "[DAE_DB] op-sqlite: require ./openDbOpSqlite FAILED:",
          requireError?.message,
        );
        const err = new Error("Failed to require ./openDbOpSqlite");
        // Preserve the underlying Metro/Hermes resolution failure.
        err.cause = requireError;
        throw err;
      }

      if (opBackendModule == null) {
        throw new TypeError(
          "./openDbOpSqlite required successfully but returned null/undefined",
        );
      }

      const openDbOp = pickOpener(opBackendModule, "op-sqlite");
      console.warn(
        "[DAE_DB] op-sqlite: picked opener",
        `typeof=${typeof openDbOp}`,
      );
      const db = await openDbOp(); // validates open + schema
      if (!db) throw new Error("op-sqlite backend returned a null DB instance");
      _selectedBackendName = "op-sqlite";
      return { name: "op-sqlite", getDb: () => db };
    } catch (error) {
      errors.push({ backend: "op-sqlite", error });
    }

    // 2) Fallback to expo-sqlite backend ONLY if it can be required.
    try {
      const expoBackend = createExpoSqliteBackend();
      // Validate open; createExpoSqliteBackend() is already safe to call.
      await expoBackend.getDb();
      _selectedBackendName = expoBackend?.name ?? "expo-sqlite";
      return expoBackend;
    } catch (error) {
      errors.push({ backend: "expo-sqlite", error });
    }

    const err = new Error(
      "No SQLite backend available (tried: @op-engineering/op-sqlite, expo-sqlite)",
    );
    // Attach details for debugging; callers should treat this as non-fatal.
    // (Avoid AggregateError for broader Hermes compatibility.)
    err.backends = errors;
    throw err;
  })();

  return _backendPromise;
}

function createExpoSqliteBackend() {
  // All requires are inside the factory so a missing ExpoSQLite native module
  // does not crash at module evaluation time.

  let openDbExpoSqlite;
  let wrapperModule;
  try {
    // Expo SQLite wrapper uses static imports to make Metro/Hermes interop stable.
    // eslint-disable-next-line global-require
    wrapperModule = require("./openDbExpoSqlite");
    const expoModuleType = typeof wrapperModule;
    const expoModuleKeys =
      wrapperModule &&
      (typeof wrapperModule === "object" || typeof wrapperModule === "function")
        ? Object.keys(wrapperModule)
        : [];
    console.warn(
      "[DAE_DB] expo-sqlite: require ./openDbExpoSqlite success",
      `type=${expoModuleType} keys=[${expoModuleKeys.join(", ")}]`,
    );
    openDbExpoSqlite = pickOpener(wrapperModule, "expo-sqlite");
  } catch (requireError) {
    const err = new Error("Failed to require ./openDbExpoSqlite");
    err.cause = requireError;
    throw err;
  }

  // Log what we actually picked (helps confirm Metro export shapes in the wild).
  if (wrapperModule != null) {
    console.warn(
      "[DAE_DB] expo-sqlite: picked opener",
      `typeof=${typeof openDbExpoSqlite}`,
    );
  }

  let _expoDbPromise = null;

  function createLegacyAsyncFacade(legacyDb) {
    // eslint-disable-next-line global-require
    const { wrapLegacyExpoSqlite } = require("./wrapDbHandle");
    return wrapLegacyExpoSqlite(legacyDb);
  }

  async function initDbExpo() {
    // eslint-disable-next-line global-require
    const { ensureEmbeddedDb } = require("./ensureEmbeddedDb");
    // Stage the DB into the Expo SQLite dir before opening.
    await ensureEmbeddedDb({ dbName: DB_NAME });

    let db;
    // openDbExpoSqlite() can be async (openDatabaseAsync) or sync (openDatabase).
    db = await openDbExpoSqlite(DB_NAME);

    // Expo Go / older expo-sqlite: provide an async facade compatible with
    // the subset of methods used in this repo (execAsync + getAllAsync).
    if (db && typeof db.execAsync !== "function") {
      db = createLegacyAsyncFacade(db);
    }

    // Read-only optimizations
    await db.execAsync("PRAGMA journal_mode = WAL");
    await db.execAsync("PRAGMA cache_size = -8000"); // 8 MB

    // eslint-disable-next-line global-require
    const { assertDbHasTable } = require("./validateDbSchema");
    await assertDbHasTable(db, "defibs");

    return db;
  }

  return {
    name: "expo-sqlite",
    getDb() {
      if (!_expoDbPromise) {
        _expoDbPromise = initDbExpo();
      }
      return _expoDbPromise;
    },
  };
}
