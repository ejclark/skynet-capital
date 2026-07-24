import type { CycleReport } from "../../src/engine/trading-engine.js";
import {
  InMemoryCycleReportStore,
  type PersistedCycleReport,
} from "../../src/runtime/cycle-report-store.js";

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

describe("InMemoryCycleReportStore", () => {
  it("returns everything saved when no persona filter is given", async () => {
    const store = new InMemoryCycleReportStore();
    await store.save(aReport("news-fader"));
    await store.save(aReport("gold-bug"));

    expect(await store.list()).toHaveLength(2);
  });

  it("filters by persona id", async () => {
    const store = new InMemoryCycleReportStore();
    await store.save(aReport("news-fader"));
    await store.save(aReport("gold-bug"));

    const faderOnly = await store.list("news-fader");

    expect(faderOnly).toHaveLength(1);
    expect(faderOnly[0]?.report.personaId).toBe("news-fader");
  });
});
