import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAlertDismissals,
  JsonlAlertDismissals,
} from "../../src/adapters/jsonl-alert-dismissals.js";

/**
 * The durable dismissals store: what the in-memory adapter promises (a set, per consumer, empty
 * for a stranger), kept across a fresh instance over the same directory — the deploy case.
 */

describe("JsonlAlertDismissals", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "alert-dismissals-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("survives a new process: a fresh instance over the same dir loads what was dismissed", async () => {
    const first = new JsonlAlertDismissals(dir, () => new Date("2026-09-22T01:00:00Z"));
    await first.dismiss("human-ann", "fp-1");
    await first.dismiss("human-ann", "fp-2");
    const second = new JsonlAlertDismissals(dir);
    expect(await second.loadDismissed("human-ann")).toEqual(["fp-1", "fp-2"]);
    expect(readFileSync(join(dir, "human-ann.jsonl"), "utf8")).toContain(
      '"at":"2026-09-22T01:00:00.000Z"',
    );
  });

  it("collapses a repeat dismissal, scopes per consumer, and loads empty for a stranger", async () => {
    const store = new JsonlAlertDismissals(dir);
    await store.dismiss("human-ann", "fp-1");
    await store.dismiss("human-ann", "fp-1");
    await store.dismiss("human-bob", "fp-9");
    expect(await store.loadDismissed("human-ann")).toEqual(["fp-1"]);
    expect(await store.loadDismissed("human-bob")).toEqual(["fp-9"]);
    expect(await store.loadDismissed("human-nobody")).toEqual([]);
  });

  it("builds from the environment with the volume-pinned default", () => {
    expect(createAlertDismissals({})).toBeInstanceOf(JsonlAlertDismissals);
    expect(createAlertDismissals({ SKYNET_ALERT_DISMISSALS_DIR: dir })).toBeInstanceOf(
      JsonlAlertDismissals,
    );
  });
});
