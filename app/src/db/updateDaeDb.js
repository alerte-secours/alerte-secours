// Over-the-air DAE database update.
//
// Downloads a fresh geodae.db from the Minio/S3 bucket, validates it,
// swaps the on-device copy, and resets the DB connection so subsequent
// queries use the new data.
//
// IMPORTANT:
// - All native requires must stay inside functions so this file can be loaded
//   in Jest/node without crashing.

import env from "~/env";
import { STORAGE_KEYS } from "~/storage/storageKeys";

const DB_NAME = "geodae.db";
const GEODAE_BUCKET = "geodae";
const METADATA_FILE = "metadata.json";

/**
 * Build the public Minio URL for a given bucket/object.
 * @param {string} object - object key within the geodae bucket
 * @returns {string}
 */
function geodaeUrl(object) {
  const base = env.MINIO_URL.replace(/\/+$/, "");
  return `${base}/${GEODAE_BUCKET}/${object}`;
}

/**
 * @typedef {Object} UpdateProgress
 * @property {number} totalBytesWritten
 * @property {number} totalBytesExpectedToWrite
 */

/**
 * @typedef {Object} UpdateResult
 * @property {boolean} success
 * @property {boolean} [alreadyUpToDate]
 * @property {string}  [updatedAt]
 * @property {Error}   [error]
 */

/**
 * Download and install the latest geodae.db from the server.
 *
 * @param {Object}   options
 * @param {function(UpdateProgress): void} [options.onProgress]  - download progress callback
 * @param {function(string): void}         [options.onPhase]     - phase change callback ("checking"|"downloading"|"installing")
 * @returns {Promise<UpdateResult>}
 */
export async function updateDaeDb({ onProgress, onPhase } = {}) {
  // Lazy requires to keep Jest/node stable.
  // eslint-disable-next-line global-require
  const FileSystemModule = require("expo-file-system");
  const FileSystem = FileSystemModule?.default ?? FileSystemModule;

  const sqliteDirUri = `${FileSystem.documentDirectory}SQLite`;
  const dbUri = `${sqliteDirUri}/${DB_NAME}`;
  const tmpUri = `${FileSystem.cacheDirectory}geodae-update-${Date.now()}.db`;

  try {
    // ── Phase 1: Check metadata ──────────────────────────────────────────
    onPhase?.("checking");

    const metadataUrl = geodaeUrl(METADATA_FILE);
    const metaResponse = await fetch(metadataUrl);
    if (!metaResponse.ok) {
      throw new Error(
        `[DAE_UPDATE] Failed to fetch metadata: HTTP ${metaResponse.status}`,
      );
    }
    const metadata = await metaResponse.json();
    const remoteUpdatedAt = metadata.updatedAt;

    if (!remoteUpdatedAt) {
      throw new Error("[DAE_UPDATE] Metadata missing updatedAt field");
    }

    // Compare with stored last update timestamp
    // eslint-disable-next-line global-require
    const memoryAsyncStorageModule = require("~/storage/memoryAsyncStorage");
    const memoryAsyncStorage =
      memoryAsyncStorageModule?.default ?? memoryAsyncStorageModule;
    const storedUpdatedAt = await memoryAsyncStorage.getItem(
      STORAGE_KEYS.DAE_DB_UPDATED_AT,
    );

    if (
      storedUpdatedAt &&
      new Date(remoteUpdatedAt).getTime() <= new Date(storedUpdatedAt).getTime()
    ) {
      return { success: true, alreadyUpToDate: true };
    }

    // ── Phase 2: Download ────────────────────────────────────────────────
    onPhase?.("downloading");

    const dbUrl = geodaeUrl(DB_NAME);
    const downloadResumable = FileSystem.createDownloadResumable(
      dbUrl,
      tmpUri,
      {},
      onProgress,
    );
    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult?.uri) {
      throw new Error("[DAE_UPDATE] Download failed: no URI returned");
    }

    // Verify the downloaded file is non-empty
    const tmpInfo = await FileSystem.getInfoAsync(tmpUri);
    if (!tmpInfo.exists || tmpInfo.size === 0) {
      throw new Error("[DAE_UPDATE] Downloaded file is empty or missing");
    }

    // ── Phase 3: Validate ────────────────────────────────────────────────
    onPhase?.("installing");

    // Quick validation: open the downloaded DB and check schema
    // We use the same validation as the main DB opener.
    // eslint-disable-next-line global-require
    const { assertDbHasTable } = require("./validateDbSchema");

    // Try to open the temp DB with op-sqlite for validation
    let validationDb = null;
    try {
      // eslint-disable-next-line global-require
      const opSqliteMod = require("@op-engineering/op-sqlite");
      const open = opSqliteMod?.open ?? opSqliteMod?.default?.open;
      if (typeof open === "function") {
        // op-sqlite needs the directory and filename separately
        const tmpDir = tmpUri.substring(0, tmpUri.lastIndexOf("/"));
        const tmpName = tmpUri.substring(tmpUri.lastIndexOf("/") + 1);
        validationDb = open({ name: tmpName, location: tmpDir });

        // Wrap for assertDbHasTable compatibility
        const execQuery = async (sql, params = []) => {
          const exec =
            typeof validationDb.executeAsync === "function"
              ? validationDb.executeAsync.bind(validationDb)
              : validationDb.execute?.bind(validationDb);
          if (!exec) throw new Error("No execute method on validation DB");
          const res = params.length ? await exec(sql, params) : await exec(sql);
          return res?.rows ?? [];
        };

        const dbWrapper = {
          getAllAsync: execQuery,
          getFirstAsync: async (sql, params = []) => {
            const rows = await execQuery(sql, params);
            return rows[0] ?? null;
          },
        };

        await assertDbHasTable(dbWrapper, "defibs");
      }
    } catch (validationError) {
      // Clean up temp file
      try {
        await FileSystem.deleteAsync(tmpUri, { idempotent: true });
      } catch {
        // ignore cleanup errors
      }
      const err = new Error("[DAE_UPDATE] Downloaded DB failed validation");
      err.cause = validationError;
      throw err;
    } finally {
      // Close validation DB
      if (validationDb && typeof validationDb.close === "function") {
        try {
          validationDb.close();
        } catch {
          // ignore
        }
      }
    }

    // ── Phase 4: Swap ────────────────────────────────────────────────────
    // IMPORTANT: resetDb() closes the DB and clears cached promises.
    // No concurrent DB queries should be in flight at this point.
    // The caller (store action) is the only code path that triggers this,
    // and it awaits completion before allowing new queries.
    // eslint-disable-next-line global-require
    const { resetDb } = require("./openDb");
    resetDb();

    // Ensure SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(sqliteDirUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDirUri, {
        intermediates: true,
      });
    }

    // Replace the DB file
    await FileSystem.moveAsync({ from: tmpUri, to: dbUri });

    // Persist the update timestamp
    await memoryAsyncStorage.setItem(
      STORAGE_KEYS.DAE_DB_UPDATED_AT,
      remoteUpdatedAt,
    );

    console.warn(
      "[DAE_UPDATE] Successfully updated geodae.db to version:",
      remoteUpdatedAt,
    );

    return { success: true, updatedAt: remoteUpdatedAt };
  } catch (error) {
    // Clean up temp file on any error (FileSystem is in scope from the outer try)
    try {
      await FileSystem.deleteAsync(tmpUri, { idempotent: true });
    } catch {
      // ignore cleanup errors
    }

    console.warn("[DAE_UPDATE] Update failed:", error?.message, error);
    return { success: false, error };
  }
}
