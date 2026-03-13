// Schema validation for embedded SQLite databases (geodae.db, useful-places.db).

/**
 * Validate that the embedded DB looks like the pre-populated database.
 *
 * This is a cheap query and catches cases where we accidentally opened a new/
 * empty DB file (which then fails later with "no such table: ...").
 *
 * @param {Object} db
 * @param {string} [tableName]
 */
async function assertDbHasTable(db, tableName = "defibs") {
  if (!db || typeof db.getFirstAsync !== "function") {
    const err = new TypeError(
      `[DB_VALIDATE] Cannot validate schema: db.getFirstAsync() missing`,
    );
    err.isDbValidationError = true;
    throw err;
  }

  const row = await db.getFirstAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1;",
    [tableName],
  );

  if (!row || row.name !== tableName) {
    const err = new Error(
      `[DB_VALIDATE] Embedded DB missing ${tableName} table (likely opened empty DB)`,
    );
    err.isDbValidationError = true;
    throw err;
  }
}

module.exports = {
  __esModule: true,
  assertDbHasTable,
};
