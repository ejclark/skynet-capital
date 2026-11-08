import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_QUEUED } from "../../src/domain/discovery-queue.js";
import {
  DiscoveryQueueStore,
  discoveryPerPass,
  discoveryQueueFilePath,
  parseDiscoveryQueue,
} from "../../src/server/discovery-queue-store.js";

/** The discovery queue on the volume (#6952 slice 2b): total reads, round-trips, a bounded parse. */

const ask = (subject: string) => ({
  id: `name:${subject}`,
  kind: "name",
  subject,
  askedAt: "2026-11-08T12:00:00.000Z",
  askers: ["m1"],
});

describe("parseDiscoveryQueue", () => {
  it("keeps well-formed asks and drops malformed, mismatched and duplicate ones", () => {
    const parsed = parseDiscoveryQueue([
      ask("PLTR"),
      { ...ask("RIVN"), id: "name:OTHER" },
      { ...ask("LCID"), kind: "planet" },
      { ...ask("SOFI"), askers: [1] },
      ask("PLTR"),
      "junk",
    ]);
    expect(parsed?.map((a) => a.subject)).toEqual(["PLTR"]);
  });

  it("is undefined for a non-list and never longer than MAX_QUEUED", () => {
    expect(parseDiscoveryQueue({})).toBeUndefined();
    const many = Array.from({ length: MAX_QUEUED + 6 }, (_, i) => ask(`Z${i}`));
    expect(parseDiscoveryQueue(many)).toHaveLength(MAX_QUEUED);
  });
});

describe("DiscoveryQueueStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "skynet-discovery-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("starts empty, round-trips a write, and survives a corrupt file as empty", () => {
    const file = join(dir, "discovery-queue.json");
    const errors: string[] = [];
    const store = new DiscoveryQueueStore(file, (m) => errors.push(m));
    expect(store.load()).toEqual([]);
    store.write([ask("PLTR")] as never);
    expect(new DiscoveryQueueStore(file).load().map((a) => a.id)).toEqual(["name:PLTR"]);
    writeFileSync(file, "{not json");
    expect(store.load()).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("sits beside the subscriptions file, with no new env var", () => {
    expect(discoveryQueueFilePath({ SKYNET_SUBSCRIPTIONS_FILE: "/data/subs.json" })).toBe(
      "/data/discovery-queue.json",
    );
    expect(discoveryQueueFilePath({})).toBe("data/discovery-queue.json");
  });
});

describe("discoveryPerPass", () => {
  it("reads normal's research number from work-mode.json, the one place it lives", () => {
    expect(discoveryPerPass()).toBeGreaterThanOrEqual(1);
  });

  it("answers 1, the longer wait, when the file is missing or unusable", () => {
    expect(discoveryPerPass(dir0())).toBe(1);
    const d = dir0();
    writeFileSync(join(d, "work-mode.json"), JSON.stringify({ positions: { normal: {} } }));
    expect(discoveryPerPass(d)).toBe(1);
  });
});

function dir0(): string {
  return mkdtempSync(join(tmpdir(), "skynet-discovery-pp-"));
}
