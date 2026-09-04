import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
// The query API (functions) lives in market-events.ts; the curated table + its shape live in the
// market-events-data.ts leaf. The "seeded table" block below tests that leaf directly, so it imports
// MARKET_EVENTS + the shape straight from the data module (closing the spec-gap on the leaf honestly).
import { allEvents, earningsAsEvents, eventsWithin } from "../../src/domain/market-events.js";
import { MARKET_EVENTS, type MarketEvent } from "../../src/domain/market-events-data.js";

const prints: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "IR: test" },
  { symbol: "MRVL", date: "2026-08-27", status: "estimate", source: "8-K cadence" },
];

const curated: readonly MarketEvent[] = [
  {
    id: "cpi-2026-09-11",
    kind: "macro-print",
    title: "CPI",
    date: "2026-09-11",
    status: "confirmed",
    source: "BLS: test",
    impact: "high",
    symbols: [],
  },
];

describe("market events", () => {
  describe("earningsAsEvents — the adapter that keeps one source of truth for print dates", () => {
    it("derives a stable id, earnings kind, and the symbol", () => {
      const [nvda] = earningsAsEvents(prints);
      expect(nvda?.id).toBe("nvda-2026-08-26-print");
      expect(nvda?.kind).toBe("earnings");
      expect(nvda?.symbols).toEqual(["NVDA"]);
    });

    it("passes status and source through untouched — the confirmed/estimate asymmetry survives", () => {
      const [nvda, mrvl] = earningsAsEvents(prints);
      expect(nvda?.status).toBe("confirmed");
      expect(nvda?.source).toBe("IR: test");
      expect(mrvl?.status).toBe("estimate");
    });

    it("defaults every print to critical impact — the 10-25%-swing class", () => {
      for (const e of earningsAsEvents(prints)) expect(e.impact).toBe("critical");
    });
  });

  describe("allEvents", () => {
    it("merges curated and derived events, sorted by date", () => {
      const ids = allEvents("2026-08-01T00:00:00Z", curated, prints).map((e) => e.id);
      expect(ids).toEqual(["nvda-2026-08-26-print", "mrvl-2026-08-27-print", "cpi-2026-09-11"]);
    });

    it("drops past events — a stale entry cannot trigger anything", () => {
      const ids = allEvents("2026-09-01T00:00:00Z", curated, prints).map((e) => e.id);
      expect(ids).toEqual(["cpi-2026-09-11"]);
    });
  });

  describe("eventsWithin — the morning-brief horizon", () => {
    it("keeps only events inside the window", () => {
      const ids = eventsWithin("2026-08-25T00:00:00Z", 3, curated, prints).map((e) => e.id);
      expect(ids).toEqual(["nvda-2026-08-26-print", "mrvl-2026-08-27-print"]);
    });
  });

  describe("the seeded table", () => {
    it("holds no hand-entered earnings, and empty symbols means market-wide", () => {
      for (const e of MARKET_EVENTS) {
        expect(e.kind).not.toBe("earnings");
        if (e.kind === "macro-print") expect(e.symbols).toEqual([]);
      }
    });

    it("every confirmed entry cites a trusted source prefix — the date policy's teeth", () => {
      for (const e of MARKET_EVENTS) {
        if (e.status === "confirmed")
          expect(e.source).toMatch(/^(IR|CAL|BLS|FED|PJM|SEC|TSY|OCC|BEA|CENSUS|ISM|CB|UMICH):/);
        else expect(e.source).toMatch(/^(EST|NEWS):/);
      }
    });
  });
});
