import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonlKeyedStore } from "../../src/storage/jsonl-store.js";

type Entry = { key: string; value: number };

const fileFor = (dir: string) => (key: string) => join(dir, `${key}.jsonl`);

describe("JsonlKeyedStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "jsonl-store-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe("when appending and listing entries for a single key", () => {
    it("round-trips appended entries in write order", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      await store.append("alpha", { key: "alpha", value: 1 });
      await store.append("alpha", { key: "alpha", value: 2 });

      expect(await store.list("alpha")).toEqual([
        { key: "alpha", value: 1 },
        { key: "alpha", value: 2 },
      ]);
    });

    it("creates the directory on first append if it does not exist", async () => {
      const store = new JsonlKeyedStore<Entry>(join(dir, "nested"), fileFor(join(dir, "nested")));
      await store.append("alpha", { key: "alpha", value: 1 });

      expect(await store.list("alpha")).toEqual([{ key: "alpha", value: 1 }]);
    });
  });

  describe("when multiple keys share the store", () => {
    it("isolates each key to its own file", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      await store.append("alpha", { key: "alpha", value: 1 });
      await store.append("beta", { key: "beta", value: 2 });

      expect(await store.list("alpha")).toEqual([{ key: "alpha", value: 1 }]);
      expect(await store.list("beta")).toEqual([{ key: "beta", value: 2 }]);
    });

    it("returns entries across all keys when listing without a key", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      await store.append("alpha", { key: "alpha", value: 1 });
      await store.append("beta", { key: "beta", value: 2 });
      await store.append("alpha", { key: "alpha", value: 3 });

      const all = await store.list();
      expect(all).toHaveLength(3);
      expect(all).toEqual(
        expect.arrayContaining([
          { key: "alpha", value: 1 },
          { key: "beta", value: 2 },
          { key: "alpha", value: 3 },
        ]),
      );
    });

    it("ignores non-.jsonl files under the directory when listing all keys", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      await store.append("alpha", { key: "alpha", value: 1 });
      writeFileSync(join(dir, "notes.txt"), "not jsonl\n", "utf8");

      expect(await store.list()).toEqual([{ key: "alpha", value: 1 }]);
    });
  });

  describe("when the underlying directory or file is missing", () => {
    it("returns an empty list for a key whose file was never written", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      expect(await store.list("nobody")).toEqual([]);
    });

    it("returns an empty list for an empty directory", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      expect(await store.list()).toEqual([]);
    });

    it("returns an empty list when the directory itself does not exist", async () => {
      const missing = join(dir, "does-not-exist");
      const store = new JsonlKeyedStore<Entry>(missing, fileFor(missing));
      expect(await store.list()).toEqual([]);
    });
  });

  describe("when a key's file has trailing or blank lines", () => {
    it("skips empty lines rather than failing to parse them", async () => {
      mkdirSync(dir, { recursive: true });
      const file = fileFor(dir)("alpha");
      writeFileSync(file, `${JSON.stringify({ key: "alpha", value: 1 })}\n\n`, "utf8");

      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      expect(await store.list("alpha")).toEqual([{ key: "alpha", value: 1 }]);
    });
  });

  describe("when one key's file outgrows the engine's argument limit (#4612 slice 3, #4615)", () => {
    // Spreading a file's rows into push() passes every row as a separate argument, and V8 throws
    // RangeError past ~121k of them. History rehydration lists every file at boot, so one history
    // file that long turned every restart into `exit 1` — a crash loop, not a slow page.
    const LINES = 130_000;
    const writeLines = (key: string) =>
      writeFileSync(
        fileFor(dir)(key),
        `${Array.from({ length: LINES }, (_, i) => JSON.stringify({ key, value: i })).join("\n")}\n`,
        "utf8",
      );

    it("lists every row of that key without throwing", async () => {
      writeLines("alpha");
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));

      const rows = await store.list("alpha");

      expect(rows).toHaveLength(LINES);
      expect(rows[0]).toEqual({ key: "alpha", value: 0 });
      expect(rows[LINES - 1]).toEqual({ key: "alpha", value: LINES - 1 });
    });

    it("lists it alongside the other keys when listing the whole store", async () => {
      writeLines("alpha");
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      await store.append("beta", { key: "beta", value: 1 });

      expect(await store.list()).toHaveLength(LINES + 1);
    });
  });

  describe("when a crash or a full disk tore the last line mid-append", () => {
    // The torn line is the NEWEST one — exactly what history rehydration reads at boot. One torn byte
    // must not fail a startup, a profile page, or a board-wide metric.
    it("skips the malformed line and returns the intact entries", async () => {
      mkdirSync(dir, { recursive: true });
      const file = fileFor(dir)("alpha");
      writeFileSync(
        file,
        `${JSON.stringify({ key: "alpha", value: 1 })}\n{"key":"alpha","val`,
        "utf8",
      );

      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      expect(await store.list("alpha")).toEqual([{ key: "alpha", value: 1 }]);
    });

    it("keeps one torn file from poisoning a listing across all keys", async () => {
      const store = new JsonlKeyedStore<Entry>(dir, fileFor(dir));
      await store.append("beta", { key: "beta", value: 2 });
      writeFileSync(fileFor(dir)("alpha"), '{"key":"alpha","val', "utf8");

      expect(await store.list()).toEqual([{ key: "beta", value: 2 }]);
    });
  });
});
