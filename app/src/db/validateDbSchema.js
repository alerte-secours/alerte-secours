// Schema validation for the embedded geodae.db.

/**
 * Validate that the embedded DB looks like the pre-populated database.
 *
 * This is a cheap query and catches cases where we accidentally opened a new/
 * empty DB file (which then fails later with "no such table: defibs").
 *
 * @param {Object} db
 * @param {string} [tableName]
 */
async function assertDbHasTable(db, tableName = "defibs") {
  if (!db || typeof db.getFirstAsync !== "function") {
    throw new TypeError(
      "[DAE_DB] Cannot validate schema: db.getFirstAsync() missing",
    );
  }

  const row = await db.getFirstAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1;",
    [tableName],
  );

  if (!row || row.name !== tableName) {
    throw new Error(
      `[DAE_DB] Embedded DB missing ${tableName} table (likely opened empty DB)`,
    );
  }
}

module.exports = {
  __esModule: true,
  assertDbHasTable,
};
