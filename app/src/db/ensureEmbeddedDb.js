// Ensure the embedded pre-populated geodae.db is available on-device.
//
// This copies the bundled asset into Expo's SQLite directory:
//   FileSystem.documentDirectory + 'SQLite/' + DB_NAME
//
// Both backends (expo-sqlite and op-sqlite) can open the DB from that location.
//
// IMPORTANT:
// - All native requires must stay inside functions so this file can be loaded
//   in Jest/node without crashing.

const DEFAULT_DB_NAME = "geodae.db";

function resolveEmbeddedDbModule(dbName) {
  switch (dbName) {
    case "geodae.db":
      // eslint-disable-next-line global-require
      return require("../assets/db/geodae.db");
    case "useful-places.db":
      // eslint-disable-next-line global-require
      return require("../assets/db/useful-places.db");
    default:
      throw new Error(
        `[EMBEDDED_DB] Unsupported embedded DB asset for \"${dbName}\"`,
      );
  }
}

function stripFileScheme(uri) {
  return typeof uri === "string" && uri.startsWith("file://")
    ? uri.slice("file://".length)
    : uri;
}

/**
 * @typedef {Object} EnsureEmbeddedDbResult
 * @property {string} dbName
 * @property {string} sqliteDirUri
 * @property {string} dbUri
 * @property {boolean} copied
 */

/**
 * Copy the embedded DB asset into the Expo SQLite directory (idempotent).
 *
 * @param {Object} [options]
 * @param {string} [options.dbName]
 * @param {any}    [options.assetModule] - Optional override for testing.
 * @param {boolean} [options.overwrite]
 * @returns {Promise<EnsureEmbeddedDbResult>}
 */
async function ensureEmbeddedDb(options = {}) {
  const {
    dbName = DEFAULT_DB_NAME,
    assetModule = null,
    overwrite = false,
  } = options;

  // Lazy require: keeps Jest/node stable.
  // eslint-disable-next-line global-require
  const FileSystemModule = require("expo-file-system");
  const FileSystem = FileSystemModule?.default ?? FileSystemModule;
  // eslint-disable-next-line global-require
  const ExpoAssetModule = require("expo-asset");
  const ExpoAsset = ExpoAssetModule?.default ?? ExpoAssetModule;
  const { Asset } = ExpoAsset;

  if (!FileSystem?.documentDirectory) {
    throw new Error(
      "[EMBEDDED_DB] expo-file-system unavailable (documentDirectory missing) — cannot stage embedded DB",
    );
  }
  if (!Asset?.fromModule) {
    throw new Error(
      "[EMBEDDED_DB] expo-asset unavailable (Asset.fromModule missing) — cannot stage embedded DB",
    );
  }

  const sqliteDirUri = `${FileSystem.documentDirectory}SQLite`;
  const dbUri = `${sqliteDirUri}/${dbName}`;

  // Ensure SQLite directory exists.
  const dirInfo = await FileSystem.getInfoAsync(sqliteDirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDirUri, { intermediates: true });
  }

  const fileInfo = await FileSystem.getInfoAsync(dbUri);
  const shouldCopy =
    overwrite ||
    !fileInfo.exists ||
    (typeof fileInfo.size === "number" && fileInfo.size === 0);

  if (__DEV__) console.warn("[EMBEDDED_DB] ensure", dbName, { shouldCopy });

  if (shouldCopy) {
    let moduleId = assetModule;
    if (moduleId == null) {
      try {
        moduleId = resolveEmbeddedDbModule(dbName);
      } catch (e) {
        const err = new Error(
          `[EMBEDDED_DB] Embedded DB asset not found for ${dbName}. ` +
            "Ensure the asset is committed and rebuild the dev client.",
        );
        err.cause = e;
        throw err;
      }
    }

    if (moduleId == null) {
      // No embedded asset for this DB — skip copy silently.
      // The DB will be provided later via OTA update.
      if (__DEV__) {
        console.warn(
          "[EMBEDDED_DB] No embedded asset bundled for",
          dbName,
          "— skipping copy (will rely on OTA update)",
        );
      }
      return { dbName, sqliteDirUri, dbUri, copied: false };
    }

    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    if (!asset.localUri) {
      throw new Error(
        `[EMBEDDED_DB] ${dbName} asset missing localUri after Asset.downloadAsync()`,
      );
    }

    // Defensive: expo-asset returns file:// URIs; copyAsync wants URIs.
    await FileSystem.copyAsync({ from: asset.localUri, to: dbUri });
    if (__DEV__) console.warn("[EMBEDDED_DB] copied", dbName);

    return { dbName, sqliteDirUri, dbUri, copied: true };
  }

  if (__DEV__) console.warn("[EMBEDDED_DB] reusing existing", dbName);

  return { dbName, sqliteDirUri, dbUri, copied: false };
}

module.exports = {
  __esModule: true,
  DEFAULT_DB_NAME,
  ensureEmbeddedDb,
  stripFileScheme,
};
