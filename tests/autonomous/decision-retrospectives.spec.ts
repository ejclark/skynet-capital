import {
  type FilledIntentRow,
  pendingRetrospectives,
} from "../../src/autonomous/decision-retrospectives.js";

/**
 * `pendingRetrospectives` (#2287 PR 7) — the retrospective writer's pure core: FIFO-match every
 * filled intent for one (persona, symbol) via `matchRoundTrips`, then emit only the closed trips
 * not already recorded. No SQLite here; `decision-db.spec.ts` covers the DB-backed trigger.
 */

const row = (
  over: Partial<FilledIntentRow> & Pick<FilledIntentRow, "intentId">,
): FilledIntentRow => ({
  orderId: `o-${over.intentId}`,
  symbol: "NVDA",
  side: "buy",
  quantity: 20,
  price: 100,
  at: 1_000,
  reason: "test",
  ...over,
});

describe("pendingRetrospectives", () => {
  it("writes nothing when no position has closed yet", () => {
    const rows = [row({ intentId: 1, side: "buy" })];
    expect(pendingRetrospectives(rows, new Set())).toEqual([]);
  });

  it("writes one row for a closed buy-then-sell, with realized P/L and returnPct from the matcher", () => {
    const rows = [
      row({ intentId: 1, side: "buy", price: 100, at: 1_000 }),
      row({ intentId: 2, side: "sell", price: 120, at: 2_000, reason: "target hit" }),
    ];
    const [insert] = pendingRetrospectives(rows, new Set());
    expect(insert).toMatchObject({
      at: 2_000,
      symbol: "NVDA",
      entryIntentId: 1,
      exitReason: "target hit",
      realized: 400, // (120 - 100) * 20
      returnPct: 20,
    });
  });

  it("computes momentum/sentiment deltas from the entry vs. exit intent, never fabricating one side", () => {
    const rows = [
      row({ intentId: 1, side: "buy", momentum: -0.8, sentiment: -0.6 }),
      row({ intentId: 2, side: "sell", at: 2_000, momentum: 0.1, sentiment: 0.2 }),
    ];
    const [insert] = pendingRetrospectives(rows, new Set());
    expect(insert?.momentumDelta).toBeCloseTo(0.9);
    expect(insert?.sentimentDelta).toBeCloseTo(0.8);

    const missingEntrySignal = [
      row({ intentId: 1, side: "buy" }), // no momentum/sentiment captured
      row({ intentId: 2, side: "sell", at: 2_000, momentum: 0.1, sentiment: 0.2 }),
    ];
    const [withoutEntry] = pendingRetrospectives(missingEntrySignal, new Set());
    expect(withoutEntry?.momentumDelta).toBeNull();
    expect(withoutEntry?.sentimentDelta).toBeNull();
  });

  it("skips a trip whose (entryIntentId, at) key is already recorded — the dedup contract", () => {
    const rows = [
      row({ intentId: 1, side: "buy", at: 1_000 }),
      row({ intentId: 2, side: "sell", at: 2_000 }),
    ];
    const alreadyRecorded = new Set(["1:2000"]);
    expect(pendingRetrospectives(rows, alreadyRecorded)).toEqual([]);
  });

  it("emits one row per partial close, splitting a sell across two entry lots", () => {
    const rows = [
      row({ intentId: 1, side: "buy", quantity: 10, price: 100, at: 1_000 }),
      row({ intentId: 2, side: "buy", quantity: 10, price: 110, at: 1_500, orderId: "o-2" }),
      row({ intentId: 3, side: "sell", quantity: 20, price: 130, at: 2_000, orderId: "o-3" }),
    ];
    const inserts = pendingRetrospectives(rows, new Set());
    expect(inserts).toHaveLength(2);
    expect(inserts[0]).toMatchObject({ entryIntentId: 1, realized: 300 }); // (130-100)*10
    expect(inserts[1]).toMatchObject({ entryIntentId: 2, realized: 200 }); // (130-110)*10
  });

  it("never turns an unpriced fill into a fabricated $0 realized — excludes it like the matcher does", () => {
    const rows = [
      row({ intentId: 1, side: "buy", price: undefined, at: 1_000 }),
      row({ intentId: 2, side: "sell", price: 120, at: 2_000 }),
    ];
    // The unpriced buy never opens a lot, so the sell has nothing to close against — no trip at all,
    // never a trip with a fabricated $0 entry price.
    expect(pendingRetrospectives(rows, new Set())).toEqual([]);
  });
});
