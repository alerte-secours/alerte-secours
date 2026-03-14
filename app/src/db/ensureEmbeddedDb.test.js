const { ensureEmbeddedDb } = require("./ensureEmbeddedDb");

describe("db/ensureEmbeddedDb", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("copies asset into documentDirectory/SQLite when file is missing", async () => {
    const calls = {
      makeDirectoryAsync: [],
      copyAsync: [],
      getInfoAsync: [],
    };

    jest.doMock(
      "expo-file-system",
      () => ({
        documentDirectory: "file:///docs/",
        getInfoAsync: jest.fn(async (uri) => {
          calls.getInfoAsync.push(uri);
          if (uri === "file:///docs/SQLite") return { exists: false };
          if (uri === "file:///docs/SQLite/useful-places.db")
            return { exists: false };
          return { exists: false };
        }),
        makeDirectoryAsync: jest.fn(async (uri) => {
          calls.makeDirectoryAsync.push(uri);
        }),
        copyAsync: jest.fn(async (args) => {
          calls.copyAsync.push(args);
        }),
      }),
      { virtual: true },
    );

    const downloadAsync = jest.fn(async () => undefined);
    jest.doMock(
      "expo-asset",
      () => ({
        Asset: {
          fromModule: jest.fn(() => ({
            downloadAsync,
            localUri: "file:///bundle/useful-places.db",
          })),
        },
      }),
      { virtual: true },
    );

    const res = await ensureEmbeddedDb({ assetModule: 123 });

    expect(res.dbUri).toBe("file:///docs/SQLite/useful-places.db");
    expect(res.copied).toBe(true);
    expect(calls.makeDirectoryAsync).toEqual(["file:///docs/SQLite"]);
    expect(calls.copyAsync).toEqual([
      {
        from: "file:///bundle/useful-places.db",
        to: "file:///docs/SQLite/useful-places.db",
      },
    ]);
    expect(downloadAsync).toHaveBeenCalled();
  });

  test("does not copy when destination already exists and is non-empty", async () => {
    const calls = { copyAsync: [] };
    jest.doMock(
      "expo-file-system",
      () => ({
        documentDirectory: "file:///docs/",
        getInfoAsync: jest.fn(async (uri) => {
          if (uri === "file:///docs/SQLite") return { exists: true };
          if (uri === "file:///docs/SQLite/useful-places.db") {
            return { exists: true, size: 42 };
          }
          return { exists: true };
        }),
        makeDirectoryAsync: jest.fn(async () => undefined),
        copyAsync: jest.fn(async (args) => {
          calls.copyAsync.push(args);
        }),
      }),
      { virtual: true },
    );
    jest.doMock(
      "expo-asset",
      () => ({
        Asset: {
          fromModule: jest.fn(() => ({
            downloadAsync: jest.fn(async () => undefined),
            localUri: "file:///bundle/useful-places.db",
          })),
        },
      }),
      { virtual: true },
    );

    const res = await ensureEmbeddedDb({ assetModule: 123 });
    expect(res.copied).toBe(false);
    expect(calls.copyAsync).toEqual([]);
  });
});
