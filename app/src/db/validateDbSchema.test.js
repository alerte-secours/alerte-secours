const { assertDbHasTable } = require("./validateDbSchema");

describe("db/validateDbSchema", () => {
  test("passes when table exists", async () => {
    const db = {
      getFirstAsync: jest.fn(async () => ({ name: "defibs" })),
    };
    await expect(assertDbHasTable(db, "defibs")).resolves.toBeUndefined();
  });

  test("throws a clear error when table is missing", async () => {
    const db = {
      getFirstAsync: jest.fn(async () => null),
    };
    await expect(assertDbHasTable(db, "defibs")).rejects.toThrow(
      /missing defibs table/i,
    );
  });
});
