// Over-the-air useful_places database update.
//
// Downloads a fresh useful-places.db from Minio/S3, validates it,
// swaps the on-device copy, and resets the DB connection.

import env from "~/env";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { DB_NAME } from "./openUsefulPlacesDb";

const USEFUL_PLACES_BUCKET = "useful-places";
const METADATA_FILE = "metadata.json";

// Prevent concurrent updates from both defibs and usefulPlaces stores
let _updateInProgress = null;

function usefulPlacesUrl(object) {
  const base = env.MINIO_URL.replace(/\/+$/, "");
  return `${base}/${USEFUL_PLACES_BUCKET}/${object}`;
}

/**
 * Download and install the latest useful-places.db from the server.
 *
 * @param {Object}   options
 * @param {function} [options.onProgress]
 * @param {function} [options.onPhase]
 * @returns {Promise<{ success: boolean, alreadyUpToDate?: boolean, updatedAt?: string, error?: Error }>}
 */
export async function updateUsefulPlacesDb({ onProgress, onPhase } = {}) {
  if (_updateInProgress) {
    // An update is already running — notify the caller's UI callbacks
    // that we're piggybacking, then wait for the existing update to finish.
    onPhase?.("checking");
    try {
      const result = await _updateInProgress;
      // Signal completion so the caller's UI settles
      if (result.success) onPhase?.("installing");
      return { ...result, alreadyUpdating: true };
    } catch {
      return { success: false, alreadyUpdating: true };
    }
  }

  const promise = _doUpdate({ onProgress, onPhase });
  _updateInProgress = promise;
  try {
    return await promise;
  } finally {
    _updateInProgress = null;
  }
}

async function _doUpdate({ onProgress, onPhase } = {}) {
  // eslint-disable-next-line global-require
  const FileSystemModule = require("expo-file-system");
  const FileSystem = FileSystemModule?.default ?? FileSystemModule;

  const sqliteDirUri = `${FileSystem.documentDirectory}SQLite`;
  const dbUri = `${sqliteDirUri}/${DB_NAME}`;
  const tmpUri = `${
    FileSystem.cacheDirectory
  }useful-places-update-${Date.now()}.db`;

  try {
    // ── Phase 1: Check metadata ──────────────────────────────────────────
    onPhase?.("checking");

    const metadataUrl = usefulPlacesUrl(METADATA_FILE);
    const metaResponse = await fetch(metadataUrl);
    if (!metaResponse.ok) {
      throw new Error(
        `[USEFUL_PLACES_UPDATE] Failed to fetch metadata: HTTP ${metaResponse.status}`,
      );
    }
    const metadata = await metaResponse.json();
    const remoteUpdatedAt = metadata.updatedAt;

    if (!remoteUpdatedAt) {
      throw new Error(
        "[USEFUL_PLACES_UPDATE] Metadata missing updatedAt field",
      );
    }

    // eslint-disable-next-line global-require
    const memoryAsyncStorageModule = require("~/storage/memoryAsyncStorage");
    const memoryAsyncStorage =
      memoryAsyncStorageModule?.default ?? memoryAsyncStorageModule;
    const storedUpdatedAt = await memoryAsyncStorage.getItem(
      STORAGE_KEYS.USEFUL_PLACES_DB_UPDATED_AT,
    );

    if (
      storedUpdatedAt &&
      new Date(remoteUpdatedAt).getTime() <= new Date(storedUpdatedAt).getTime()
    ) {
      return { success: true, alreadyUpToDate: true };
    }

    // ── Phase 2: Download ────────────────────────────────────────────────
    onPhase?.("downloading");

    const dbUrl = usefulPlacesUrl(DB_NAME);
    const downloadResumable = FileSystem.createDownloadResumable(
      dbUrl,
      tmpUri,
      {},
      onProgress,
    );
    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult?.uri) {
      throw new Error(
        "[USEFUL_PLACES_UPDATE] Download failed: no URI returned",
      );
    }

    const tmpInfo = await FileSystem.getInfoAsync(tmpUri);
    if (!tmpInfo.exists || tmpInfo.size === 0) {
      throw new Error(
        "[USEFUL_PLACES_UPDATE] Downloaded file is empty or missing",
      );
    }

    // ── Phase 3: Validate ────────────────────────────────────────────────
    onPhase?.("installing");

    // eslint-disable-next-line global-require
    const { assertDbHasTable } = require("./validateDbSchema");

    let validationDb = null;
    let validationCopyUri = null;
    try {
      let dbWrapper = null;

      // Strip file:// scheme for op-sqlite which expects filesystem paths
      const stripFileScheme = (uri) =>
        uri.startsWith("file://") ? uri.slice(7) : uri;

      // Try op-sqlite first for validation
      try {
        // eslint-disable-next-line global-require
        const opSqliteMod = require("@op-engineering/op-sqlite");
        const open = opSqliteMod?.open ?? opSqliteMod?.default?.open;
        if (typeof open === "function") {
          // eslint-disable-next-line global-require
          const { wrapOpSqlite } = require("./wrapDbHandle");
          const tmpPath = stripFileScheme(tmpUri);
          const tmpDir = tmpPath.substring(0, tmpPath.lastIndexOf("/"));
          const tmpName = tmpPath.substring(tmpPath.lastIndexOf("/") + 1);
          validationDb = open({ name: tmpName, location: tmpDir });
          dbWrapper = wrapOpSqlite(validationDb);
        }
      } catch {
        // op-sqlite unavailable — close handle if it was opened before failure
        if (validationDb && typeof validationDb.close === "function") {
          try {
            validationDb.close();
          } catch {
            /* ignore */
          }
          validationDb = null;
        }
      }

      // Fallback to expo-sqlite for validation
      if (!dbWrapper) {
        try {
          // eslint-disable-next-line global-require
          const expoSqliteMod = require("expo-sqlite");
          const expoSqlite = expoSqliteMod?.default ?? expoSqliteMod;
          if (typeof expoSqlite.openDatabaseAsync === "function") {
            // Copy temp file to the SQLite directory so expo-sqlite can open it
            const tmpName = `validation-${Date.now()}.db`;
            const validationUri = `${sqliteDirUri}/${tmpName}`;
            const dirInfo2 = await FileSystem.getInfoAsync(sqliteDirUri);
            if (!dirInfo2.exists) {
              await FileSystem.makeDirectoryAsync(sqliteDirUri, {
                intermediates: true,
              });
            }
            await FileSystem.copyAsync({ from: tmpUri, to: validationUri });
            try {
              validationDb = await expoSqlite.openDatabaseAsync(tmpName);
              dbWrapper = validationDb;
            } catch (expoOpenErr) {
              // Clean up validation copy on failure
              await FileSystem.deleteAsync(validationUri, {
                idempotent: true,
              }).catch(() => {});
              throw expoOpenErr;
            }
            // Track for cleanup in finally
            validationCopyUri = validationUri;
          }
        } catch {
          // expo-sqlite also unavailable
        }
      }

      if (!dbWrapper) {
        throw new Error("No SQLite backend available for validation");
      }

      await assertDbHasTable(dbWrapper, "useful_places");

      // Verify required columns exist
      await dbWrapper.getFirstAsync(
        "SELECT id, type, latitude, longitude, h3 FROM useful_places LIMIT 1",
      );
      // Verify DB is not empty
      const countRow = await dbWrapper.getFirstAsync(
        "SELECT count(*) AS count FROM useful_places",
      );
      const rowCount = countRow?.count ?? 0;
      if (rowCount === 0) {
        throw new Error("Downloaded useful_places table is empty");
      }
    } catch (validationError) {
      try {
        await FileSystem.deleteAsync(tmpUri, { idempotent: true });
      } catch {
        /* ignore */
      }
      const err = new Error(
        "[USEFUL_PLACES_UPDATE] Downloaded DB failed validation",
      );
      err.cause = validationError;
      throw err;
    } finally {
      if (validationDb && typeof validationDb.close === "function") {
        try {
          validationDb.close();
        } catch {
          /* ignore */
        }
      }
      // Clean up expo-sqlite validation copy if one was created
      if (validationCopyUri) {
        try {
          await FileSystem.deleteAsync(validationCopyUri, {
            idempotent: true,
          });
        } catch {
          /* ignore */
        }
      }
    }

    // ── Phase 4: Swap ────────────────────────────────────────────────────
    const dirInfo = await FileSystem.getInfoAsync(sqliteDirUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDirUri, {
        intermediates: true,
      });
    }

    // Close the DB handle so no new queries can start.
    // resetUsefulPlacesDbPromise() clears the singleton so the next caller
    // re-opens a fresh connection (which will point at the new file).
    // resetUsefulPlacesDb() calls close() on the op-sqlite/expo handle,
    // which is synchronous and waits for pending operations to finish.
    // eslint-disable-next-line global-require
    const { resetUsefulPlacesDb } = require("./usefulPlacesRepo");
    // eslint-disable-next-line global-require
    const { resetUsefulPlacesDbPromise } = require("./openUsefulPlacesDb");

    resetUsefulPlacesDbPromise();
    resetUsefulPlacesDb();

    await FileSystem.moveAsync({ from: tmpUri, to: dbUri });

    await memoryAsyncStorage.setItem(
      STORAGE_KEYS.USEFUL_PLACES_DB_UPDATED_AT,
      remoteUpdatedAt,
    );

    console.warn(
      "[USEFUL_PLACES_UPDATE] Successfully updated useful-places.db to version:",
      remoteUpdatedAt,
    );

    return { success: true, updatedAt: remoteUpdatedAt };
  } catch (error) {
    try {
      await FileSystem.deleteAsync(tmpUri, { idempotent: true });
    } catch {
      /* ignore */
    }

    console.warn(
      "[USEFUL_PLACES_UPDATE] Update failed:",
      error?.message,
      error,
    );
    return { success: false, error };
  }
}
