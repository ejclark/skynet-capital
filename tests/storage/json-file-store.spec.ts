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
});
