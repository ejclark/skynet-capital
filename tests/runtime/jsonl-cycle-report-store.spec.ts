import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CycleReport } from "../../src/engine/trading-engine.js";
import type { PersistedCycleReport } from "../../src/runtime/cycle-report-store.js";
import { JsonlCycleReportStore } from "../../src/runtime/jsonl-cycle-report-store.js";

const aReport = (personaId: string): PersistedCycleReport => ({
  recordedAt: "2026-07-24T14:30:00.000Z",
  report: {
    asOf: "2026-07-24T14:30:00Z",
    personaId,
    rawIntents: [],
    submittedIntents: [],
    results: [],
    equityBefore: 5_000_000,
    equityAfter: 5_000_000,
  } satisfies CycleReport,
});

describe("JsonlCycleReportStore", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-store-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("persists appended reports and reads them back", async () => {
    const store = new JsonlCycleReportStore(dir);
    await store.save(aReport("news-fader"));
    await store.save(aReport("news-fader"));

    const entries = await store.list("news-fader");

    expect(entries).toHaveLength(2);
    expect(entries[0]?.report.personaId).toBe("news-fader");
  });

  it("keeps each persona's stream in its own file", async () => {
    const store = new JsonlCycleReportStore(dir);
    await store.save(aReport("news-fader"));
    await store.save(aReport("gold-bug"));

    expect(await store.list("news-fader")).toHaveLength(1);
    expect(await store.list()).toHaveLength(2);
  });

  it("returns empty for a persona with no history", async () => {
    const store = new JsonlCycleReportStore(dir);
    expect(await store.list("nobody")).toEqual([]);
  });
});
