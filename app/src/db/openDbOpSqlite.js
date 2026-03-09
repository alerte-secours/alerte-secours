// Open the pre-built geodae SQLite database (Bare RN variant).
// Requires: @op-engineering/op-sqlite
// Install: npm install @op-engineering/op-sqlite
// Place geodae.db in:
//   Android: android/app/src/main/assets/geodae.db
//   iOS:     add geodae.db to Xcode project "Copy Bundle Resources"
//
// NOTE: This module is intentionally written in CommonJS to make Metro/Hermes
// `require('./openDbOpSqlite')` resolution stable across CJS/ESM interop.

function requireOpSqliteOpen() {
  // Lazy require to keep this module loadable in Jest/node.
  // (op-sqlite ships a node/ dist that is ESM and not Jest-CJS friendly.)
  // eslint-disable-next-line global-require
  const mod = require("@op-engineering/op-sqlite");
  const open = mod?.open ?? mod?.default?.open;
  if (typeof open !== "function") {
    const keys =
      mod && (typeof mod === "object" || typeof mod === "function")
        ? Object.keys(mod)
        : [];
    throw new TypeError(
      `[DAE_DB] op-sqlite require() did not expose an open() function (keys=[${keys.join(
        ", ",
      )}])`,
    );
  }
  return open;
}

const DB_NAME = "geodae.db";

let _rawDb = null;
let _dbPromise = null;

function describeDbShape(db) {
  if (!db) return { type: typeof db, keys: [] };
  const t = typeof db;
  if (t !== "object" && t !== "function") return { type: t, keys: [] };
  try {
    return { type: t, keys: Object.keys(db) };
  } catch {
    return { type: t, keys: [] };
  }
}

/**
 * Adapt an op-sqlite DB instance to the async API expected by repo code.
 *
 * Required interface (subset of expo-sqlite modern API):
 *  - execAsync(sql)
 *  - getAllAsync(sql, params)
 *  - getFirstAsync(sql, params)
 *
 * op-sqlite exposes: execute()/executeAsync() returning { rows: [...] }.
 *
 * @param {any} opDb
 */
function adaptDbToRepoInterface(opDb) {
  if (!opDb) {
    throw new TypeError(
      "[DAE_DB] op-sqlite adapter: DB instance is null/undefined",
    );
  }

  // Idempotency: if caller already passes an expo-sqlite-like DB, keep it.
  if (
    typeof opDb.execAsync === "function" &&
    typeof opDb.getAllAsync === "function" &&
    typeof opDb.getFirstAsync === "function"
  ) {
    return opDb;
  }

  const executeAsync =
    (typeof opDb.executeAsync === "function" && opDb.executeAsync.bind(opDb)) ||
    (typeof opDb.execute === "function" && opDb.execute.bind(opDb));
  const executeSync =
    typeof opDb.executeSync === "function" ? opDb.executeSync.bind(opDb) : null;

  if (!executeAsync && !executeSync) {
    const shape = describeDbShape(opDb);
    throw new TypeError(
      [
        "[DAE_DB] op-sqlite adapter: cannot adapt DB.",
        "Expected executeAsync()/execute() or executeSync() methods.",
        `db typeof=${shape.type} keys=[${shape.keys.join(", ")}]`,
      ].join(" "),
    );
  }

  const runQueryAsync = async (sql, params) => {
    try {
      if (executeAsync) {
        return params != null
          ? await executeAsync(sql, params)
          : await executeAsync(sql);
      }
      // Sync fallback (best effort): wrap in a Promise for repo compatibility.
      return params != null ? executeSync(sql, params) : executeSync(sql);
    } catch (e) {
      // Make it actionable for end users/devs.
      const err = new Error(
        `[DAE_DB] Query failed (op-sqlite). ${e?.message ?? String(e)}`,
      );
      err.cause = e;
      err.sql = sql;
      err.params = params;
      throw err;
    }
  };

  return {
    async execAsync(sql) {
      await runQueryAsync(sql);
    },
    async getAllAsync(sql, params = []) {
      const res = await runQueryAsync(sql, params);
      const rows = res?.rows;
      // op-sqlite returns rows as array of objects.
      if (Array.isArray(rows)) return rows;
      // Defensive: if a driver returns no rows field for non-SELECT.
      return [];
    },
    async getFirstAsync(sql, params = []) {
      const rows = await this.getAllAsync(sql, params);
      return rows[0] ?? null;
    },
    // Keep a reference to the underlying DB for debugging / escape hatches.
    _opDb: opDb,
  };
}

async function openDbOpSqlite() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    // Stage the embedded DB in the Expo SQLite dir first.
    // This prevents op-sqlite from creating/opening an empty DB.
    let sqliteDirUri;
    try {
      // eslint-disable-next-line global-require
      const { ensureEmbeddedDb } = require("./ensureEmbeddedDb");
      const { sqliteDirUri: dir } = await ensureEmbeddedDb({ dbName: DB_NAME });
      sqliteDirUri = dir;
    } catch (e) {
      const err = new Error(
        "[DAE_DB] Failed to stage embedded DB before opening (op-sqlite)",
      );
      err.cause = e;
      throw err;
    }

    // NOTE: op-sqlite open() params are not identical to expo-sqlite.
    // Pass only supported keys to avoid native-side strict validation.
    const open = requireOpSqliteOpen();
    _rawDb = open({ name: DB_NAME, location: sqliteDirUri });
    if (!_rawDb) {
      throw new Error("op-sqlite open() returned a null DB instance");
    }

    // Read-only-ish optimizations.
    // Prefer executeSync when available.
    try {
      if (typeof _rawDb.executeSync === "function") {
        _rawDb.executeSync("PRAGMA cache_size = -8000"); // 8 MB
        _rawDb.executeSync("PRAGMA query_only = ON");
      } else if (typeof _rawDb.execute === "function") {
        // Fire-and-forget; adapter methods will still work regardless.
        _rawDb.execute("PRAGMA cache_size = -8000");
        _rawDb.execute("PRAGMA query_only = ON");
      }
    } catch {
      // Non-fatal: keep DB usable even if pragmas fail.
    }

    const db = adaptDbToRepoInterface(_rawDb);

    // Runtime guard: fail fast with a clear message if adapter didn't produce the expected API.
    if (
      !db ||
      typeof db.execAsync !== "function" ||
      typeof db.getAllAsync !== "function" ||
      typeof db.getFirstAsync !== "function"
    ) {
      const shape = describeDbShape(db);
      throw new TypeError(
        [
          "[DAE_DB] op-sqlite adapter produced an invalid DB facade.",
          `typeof=${shape.type} keys=[${shape.keys.join(", ")}]`,
        ].join(" "),
      );
    }

    // Validate schema early to avoid later "no such table" runtime errors.
    // eslint-disable-next-line global-require
    const { assertDbHasTable } = require("./validateDbSchema");
    await assertDbHasTable(db, "defibs");

    // Helpful for debugging in the wild.
    try {
      if (typeof _rawDb.getDbPath === "function") {
        console.warn("[DAE_DB] op-sqlite opened DB path:", _rawDb.getDbPath());
      }
    } catch {
      // Non-fatal.
    }

    return db;
  })();

  return _dbPromise;
}

/**
 * Close the current DB connection and clear cached promises.
 * After calling this, the next `openDbOpSqlite()` call will re-open the DB.
 */
function resetDbOpSqlite() {
  if (_rawDb) {
    try {
      if (typeof _rawDb.close === "function") {
        _rawDb.close();
      }
    } catch {
      // Non-fatal: DB may already be closed or in an invalid state.
    }
    _rawDb = null;
  }
  _dbPromise = null;
}

// Exports (CJS + ESM-ish):
// Keep `require('./openDbOpSqlite')` returning a non-null *object* so Metro/Hermes
// cannot hand back a nullish / unexpected callable export shape.
module.exports = {
  __esModule: true,
  openDbOpSqlite,
  openDb: openDbOpSqlite,
  default: openDbOpSqlite,
  resetDbOpSqlite,
  // Named export for unit tests.
  adaptDbToRepoInterface,
};
