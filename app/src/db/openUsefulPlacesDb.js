// Open the useful_places SQLite database.
//
// Follows the same pattern as openDb.js but for the unified useful_places DB.
// Reuses the same backend selection logic as the geodae DB opener.

export const DB_NAME = "useful-places.db";

let _dbPromise = null;

function describeError(error) {
  if (!error) return { message: null, stack: null, cause: null };
  return {
    message: error?.message ?? String(error),
    stack: error?.stack ?? null,
    cause: error?.cause?.message ?? error?.cause ?? null,
  };
}

function logError(label, error) {
  const details = describeError(error);
  console.warn(`[USEFUL_PLACES_DB] ${label} message:`, details.message);
  if (details.cause) {
    console.warn(`[USEFUL_PLACES_DB] ${label} cause:`, details.cause);
  }
  if (details.stack) {
    console.warn(`[USEFUL_PLACES_DB] ${label} stack:\n${details.stack}`);
  }
}

/**
 * Open the useful_places database.
 * Uses the same backend strategy as the main geodae DB.
 * If the DB file is stale/empty (missing useful_places table), forces re-staging
 * from the embedded asset and retries once.
 */
export async function openUsefulPlacesDb() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    if (__DEV__) console.warn("[USEFUL_PLACES_DB] opening", DB_NAME);

    // Stage the embedded DB
    // eslint-disable-next-line global-require
    const { ensureEmbeddedDb } = require("./ensureEmbeddedDb");

    let retried = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const staged = await ensureEmbeddedDb({
        dbName: DB_NAME,
        overwrite: attempt > 0, // force overwrite on retry
      });

      if (__DEV__)
        console.warn("[USEFUL_PLACES_DB] staged", {
          copied: staged.copied,
          attempt,
        });

      // Try op-sqlite first
      try {
        // eslint-disable-next-line global-require
        const opSqliteMod = require("@op-engineering/op-sqlite");
        const open = opSqliteMod?.open ?? opSqliteMod?.default?.open;
        if (typeof open === "function") {
          // eslint-disable-next-line global-require
          const FileSystemModule = require("expo-file-system");
          const FileSystem = FileSystemModule?.default ?? FileSystemModule;
          const sqliteDir = `${FileSystem.documentDirectory}SQLite`;

          const db = open({ name: DB_NAME, location: sqliteDir });

          // eslint-disable-next-line global-require
          const { wrapOpSqlite } = require("./wrapDbHandle");
          const wrapper = wrapOpSqlite(db);

          try {
            // Validate schema
            // eslint-disable-next-line global-require
            const { assertDbHasTable } = require("./validateDbSchema");
            await assertDbHasTable(wrapper, "useful_places");

            const sampleRow = await wrapper.getFirstAsync(
              "SELECT 1 FROM useful_places LIMIT 1",
            );
            if (__DEV__) console.warn("[USEFUL_PLACES_DB] op-sqlite ready");
            if (!sampleRow) {
              const emptyErr = new Error("useful_places table is empty");
              emptyErr.isDbValidationError = true;
              throw emptyErr;
            }
          } catch (validationErr) {
            // Close handle before propagating to avoid leak
            try {
              db.close();
            } catch {
              /* ignore */
            }
            throw validationErr;
          }

          // Read-only optimizations (DELETE avoids WAL/SHM sidecar files)
          await wrapper.execAsync("PRAGMA journal_mode = DELETE");
          await wrapper.execAsync("PRAGMA cache_size = -8000");

          return wrapper;
        }
      } catch (err) {
        logError("op-sqlite failed", err);
        // If validation failed (missing table or empty DB) and we haven't retried, force re-stage
        if (!retried && err?.isDbValidationError) {
          console.warn(
            "[USEFUL_PLACES_DB] stale DB detected, forcing re-stage from embedded asset",
          );
          retried = true;
          continue;
        }
        // Re-throw non-retryable errors so they are not silently swallowed
        throw err;
      }

      // Fallback to expo-sqlite
      try {
        // eslint-disable-next-line global-require
        const expoSqliteMod = require("expo-sqlite");
        const expoSqlite = expoSqliteMod?.default ?? expoSqliteMod;

        let db;
        if (typeof expoSqlite.openDatabaseAsync === "function") {
          db = await expoSqlite.openDatabaseAsync(DB_NAME);
        } else if (typeof expoSqlite.openDatabase === "function") {
          db = expoSqlite.openDatabase(DB_NAME);
        }

        if (!db) throw new Error("expo-sqlite could not open DB");

        // Create async facade if needed (legacy expo-sqlite)
        if (typeof db.getAllAsync !== "function") {
          // eslint-disable-next-line global-require
          const { wrapLegacyExpoSqlite } = require("./wrapDbHandle");
          db = wrapLegacyExpoSqlite(db);
        }

        try {
          // Validate
          // eslint-disable-next-line global-require
          const { assertDbHasTable } = require("./validateDbSchema");
          await assertDbHasTable(db, "useful_places");

          const sampleRow = await db.getFirstAsync(
            "SELECT 1 FROM useful_places LIMIT 1",
          );
          if (__DEV__) console.warn("[USEFUL_PLACES_DB] expo-sqlite ready");
          if (!sampleRow) {
            const emptyErr = new Error("useful_places table is empty");
            emptyErr.isDbValidationError = true;
            throw emptyErr;
          }
        } catch (validationErr) {
          // Close handle before propagating to avoid leak
          if (typeof db.close === "function") {
            try {
              db.close();
            } catch {
              /* ignore */
            }
          }
          throw validationErr;
        }

        await db.execAsync("PRAGMA journal_mode = DELETE");
        await db.execAsync("PRAGMA cache_size = -8000");

        return db;
      } catch (err) {
        logError("expo-sqlite failed", err);
        // If validation failed (missing table or empty DB) and we haven't retried, force re-stage
        if (!retried && err?.isDbValidationError) {
          console.warn(
            "[USEFUL_PLACES_DB] stale DB detected, forcing re-stage from embedded asset",
          );
          retried = true;
          continue;
        }
        throw err;
      }
    }

    throw new Error("[USEFUL_PLACES_DB] Failed to open after retry");
  })().catch((err) => {
    // Clear singleton so future calls can retry instead of returning a
    // permanently rejected promise.
    _dbPromise = null;
    throw err;
  });

  return _dbPromise;
}

export function resetUsefulPlacesDbPromise() {
  _dbPromise = null;
}
