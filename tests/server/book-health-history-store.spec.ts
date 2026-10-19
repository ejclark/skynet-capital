import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type HealthSample,
  MAX_SAMPLES,
  SAMPLE_BUCKET_MS,
} from "../../src/observatory/book-health-history.js";
import {
  BookHealthHistoryStore,
  bookHealthHistoryPathFrom,
  MAX_ACCOUNTS,
  parseBookHealthHistory,
} from "../../src/server/book-health-history-store.js";

const T0 = Date.parse("2026-10-10T00:00:00.000Z");
const sample = (hours: number): HealthSample => ({
  at: new Date(T0 + hours * SAMPLE_BUCKET_MS).toISOString(),
  f: [{ k: "idle|||", l: "signal", s: 0.7 }],
});

let dir: string;
let path: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "bhh-"));
  path = join(dir, "book-health-history.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("BookHealthHistoryStore", () => {
  it("lives beside the controls file, with no new env var", () => {
    expect(bookHealthHistoryPathFrom("/data/bot-controls.json")).toBe(
      "/data/book-health-history.json",
    );
  });

  it("round-trips an account's samples through the file", () => {
    const store = new BookHealthHistoryStore(path);
    store.record("sauron", sample(0));
    store.record("sauron", sample(1));
    expect(new BookHealthHistoryStore(path).samples("sauron")).toEqual([sample(0), sample(1)]);
    expect(store.samples("nobody")).toEqual([]);
  });

  it("bounds one account's samples however long it runs", () => {
    const store = new BookHealthHistoryStore(path);
    for (let h = 0; h < MAX_SAMPLES + 30; h++) store.record("sauron", sample(h));
    expect(store.samples("sauron")).toHaveLength(MAX_SAMPLES);
    expect(JSON.parse(readFileSync(path, "utf8")).accounts.sauron).toHaveLength(MAX_SAMPLES);
  });

  it("bounds the accounts it keeps, dropping the least recently sampled", () => {
    const store = new BookHealthHistoryStore(path);
    store.record("stale", sample(0));
    for (let i = 0; i < MAX_ACCOUNTS; i++) store.record(`a${i}`, sample(1 + i));
    const accounts = JSON.parse(readFileSync(path, "utf8")).accounts as Record<string, unknown>;
    expect(Object.keys(accounts)).toHaveLength(MAX_ACCOUNTS);
    expect(accounts.stale).toBeUndefined();
  });

  it("degrades a malformed file to empty, loudly, and never throws", () => {
    writeFileSync(path, '{"accounts":{"sauron":[{"at":"x","f":[]}]}}');
    const errors: string[] = [];
    const store = new BookHealthHistoryStore(path, (m) => errors.push(m));
    expect(store.samples("sauron")).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("parseBookHealthHistory", () => {
  it("rejects a sample whose finding has an unknown level or a non-number severity", () => {
    const parse = (f: unknown) =>
      parseBookHealthHistory({ accounts: { a: [{ at: sample(0).at, f: [f] }] } });
    expect(parse({ k: "idle|||", l: "panic", s: 1 })).toBeUndefined();
    expect(parse({ k: "idle|||", l: "gate", s: "1" })).toBeUndefined();
    expect(parse({ k: "idle|||", l: "gate", s: 1 })).toBeDefined();
  });
});
