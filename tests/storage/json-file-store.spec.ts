import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonFileStore } from "../../src/storage/json-file-store.js";

interface Demo {
  readonly items: readonly string[];
}

describe("json file store — the plain-JSON durable-state primitive", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "json-file-"));
    path = join(dir, "state.json");
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const store = (errors: string[] = []) =>
    new JsonFileStore<Demo>({
      path,
      parse: (raw) =>
        typeof raw === "object" &&
        raw !== null &&
        Array.isArray((raw as Demo).items) &&
        (raw as Demo).items.every((i) => typeof i === "string")
          ? { items: (raw as Demo).items }
          : undefined,
      empty: { items: [] },
      label: "demo",
      onReadError: (m) => errors.push(m),
    });

  it("answers empty for a missing file and round-trips a write", () => {
    expect(store().load()).toEqual({ items: [] });
    store().write({ items: ["a"] });
    expect(store().load()).toEqual({ items: ["a"] });
  });

  it("degrades malformed JSON and wrong shapes to empty, loudly, never a throw", () => {
    const errors: string[] = [];
    writeFileSync(path, "{nope", "utf8");
    expect(store(errors).load()).toEqual({ items: [] });
    writeFileSync(path, JSON.stringify({ items: [7] }), "utf8");
    expect(store(errors).load()).toEqual({ items: [] });
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("[demo]");
  });

  it("loadIfReadable: a missing file is empty, an unreadable one is undefined — for a writer that must not overwrite it", () => {
    const errors: string[] = [];
    expect(store(errors).loadIfReadable()).toEqual({ items: [] });
    writeFileSync(path, "{nope", "utf8");
    expect(store(errors).loadIfReadable()).toBeUndefined();
    writeFileSync(path, JSON.stringify({ items: [7] }), "utf8");
    expect(store(errors).loadIfReadable()).toBeUndefined();
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("left untouched");
    store().write({ items: ["a"] });
    expect(store(errors).loadIfReadable()).toEqual({ items: ["a"] });
  });

  it("loadIfReadable: a parse that silently drops part of the file is unreadable too — load still degrades", () => {
    const errors: string[] = [];
    const lenient = new JsonFileStore<Demo>({
      path,
      // Keeps the string items, drops the rest — a total parser's usual posture.
      parse: (raw) => ({
        items: ((raw as Demo).items ?? []).filter((i): i is string => typeof i === "string"),
      }),
      empty: { items: [] },
      label: "demo",
      onReadError: (m) => errors.push(m),
    });
    writeFileSync(path, JSON.stringify({ items: ["a", 7] }), "utf8");

    expect(lenient.load()).toEqual({ items: ["a"] });
    expect(lenient.loadIfReadable()).toBeUndefined();
    expect(errors).toEqual([expect.stringContaining("parsed only in part")]);
    writeFileSync(path, JSON.stringify({ items: ["a", "b"] }), "utf8");
    expect(lenient.loadIfReadable()).toEqual({ items: ["a", "b"] });
  });

  it("writes atomically — the file on disk is always whole JSON, and creates parent dirs", () => {
    const nested = new JsonFileStore<Demo>({
      path: join(dir, "deep/down/state.json"),
      parse: (raw) => raw as Demo,
      empty: { items: [] },
      label: "demo",
    });
    nested.write({ items: ["x"] });
    expect(() => JSON.parse(readFileSync(join(dir, "deep/down/state.json"), "utf8"))).not.toThrow();
  });

  it("serialize: a write sees the file as it is now, so a store can keep what its parse leaves out", () => {
    const seen: unknown[] = [];
    const keeping = new JsonFileStore<Demo>({
      path,
      parse: (raw) => ({ items: ((raw as Demo).items ?? []).filter((i) => typeof i === "string") }),
      empty: { items: [] },
      label: "demo",
      serialize: (state, onDisk) => {
        seen.push(onDisk);
        return { ...(onDisk as object), ...state };
      },
    });
    keeping.write({ items: ["a"] });
    writeFileSync(path, JSON.stringify({ items: ["a"], extra: 1 }), "utf8");
    keeping.write({ items: ["b"] });
    writeFileSync(path, "{torn", "utf8");
    keeping.write({ items: ["c"] });

    expect(seen).toEqual([undefined, { items: ["a"], extra: 1 }, undefined]);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ items: ["c"] });
  });

  it("readsWhole: a store may set loadIfReadable's bar when its rewrite keeps what its parse drops", () => {
    writeFileSync(path, JSON.stringify({ items: ["a"], extra: 1 }), "utf8");
    const withBar = (readsWhole?: (raw: unknown, parsed: Demo) => boolean) =>
      new JsonFileStore<Demo>({
        path,
        parse: (raw) => ({ items: (raw as Demo).items }),
        empty: { items: [] },
        label: "demo",
        ...(readsWhole ? { readsWhole } : {}),
      });
    expect(withBar().loadIfReadable()).toBeUndefined();
    expect(withBar(() => true).loadIfReadable()).toEqual({ items: ["a"] });
  });
});
