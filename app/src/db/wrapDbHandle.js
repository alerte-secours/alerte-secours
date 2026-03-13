// Shared helpers to normalize op-sqlite and legacy expo-sqlite DB handles
// into a common async API surface: { getAllAsync, getFirstAsync, execAsync, close }

/**
 * Wrap an op-sqlite DB handle into the common async API.
 */
export function wrapOpSqlite(db) {
  const execQuery = async (sql, params = []) => {
    const exec =
      typeof db.executeAsync === "function"
        ? db.executeAsync.bind(db)
        : db.execute?.bind(db);
    if (!exec) throw new Error("No execute method on DB handle");
    const res = params.length ? await exec(sql, params) : await exec(sql);
    return res?.rows ?? [];
  };

  return {
    getAllAsync: execQuery,
    getFirstAsync: async (sql, params = []) => {
      const rows = await execQuery(sql, params);
      return rows[0] ?? null;
    },
    execAsync: async (sql) => {
      const exec =
        typeof db.executeAsync === "function"
          ? db.executeAsync.bind(db)
          : db.execute?.bind(db);
      if (exec) await exec(sql);
    },
    close: () => {
      if (typeof db.close === "function") db.close();
    },
  };
}

/**
 * Wrap a legacy expo-sqlite DB handle (callback-based transaction API)
 * into the common async API.
 */
export function wrapLegacyExpoSqlite(legacyDb) {
  const queryAllAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      const runner =
        typeof legacyDb.readTransaction === "function"
          ? legacyDb.readTransaction.bind(legacyDb)
          : legacyDb.transaction.bind(legacyDb);
      runner((tx) => {
        tx.executeSql(
          sql,
          params,
          (_tx, result) => {
            const rows = [];
            const len = result?.rows?.length ?? 0;
            for (let i = 0; i < len; i++) rows.push(result.rows.item(i));
            resolve(rows);
          },
          (_tx, err) => {
            reject(err);
            return true;
          },
        );
      });
    });

  return {
    getAllAsync: queryAllAsync,
    getFirstAsync: async (sql, params = []) => {
      const rows = await queryAllAsync(sql, params);
      return rows[0] ?? null;
    },
    execAsync: (sql) =>
      new Promise((resolve, reject) => {
        legacyDb.transaction((tx) => {
          tx.executeSql(
            sql,
            [],
            () => resolve(),
            (_tx, err) => {
              reject(err);
              return true;
            },
          );
        });
      }),
    close: () => {
      if (typeof legacyDb.closeAsync === "function") {
        legacyDb.closeAsync().catch(() => {});
      } else if (typeof legacyDb.close === "function") {
        legacyDb.close();
      }
    },
  };
}
