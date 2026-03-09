const { adaptDbToRepoInterface } = require("./openDbOpSqlite");

describe("db/openDbOpSqlite adapter", () => {
  test("creates execAsync/getAllAsync/getFirstAsync from executeAsync", async () => {
    const executeAsync = jest.fn(async (sql, params) => {
      if (sql === "SELECT 1") return { rows: [{ a: 1 }] };
      if (sql === "SELECT empty") return { rows: [] };
      return { rows: [] };
    });

    const db = adaptDbToRepoInterface({ executeAsync });

    expect(typeof db.execAsync).toBe("function");
    expect(typeof db.getAllAsync).toBe("function");
    expect(typeof db.getFirstAsync).toBe("function");

    await db.execAsync("PRAGMA cache_size = -8000");
    expect(executeAsync).toHaveBeenCalled();

    const rows = await db.getAllAsync("SELECT 1", []);
    expect(rows).toEqual([{ a: 1 }]);

    const first = await db.getFirstAsync("SELECT empty", []);
    expect(first).toBe(null);
  });

  test("throws a clear error when no execute method exists", () => {
    expect(() => adaptDbToRepoInterface({})).toThrow(
      /op-sqlite adapter: cannot adapt DB/i,
    );
  });
});
