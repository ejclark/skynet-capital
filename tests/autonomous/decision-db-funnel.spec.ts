import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import { FUNNEL_FOLD_SQL } from "../../src/autonomous/decision-db-funnel.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";

/**
 * The Decisions funnel, folded (#4619 part five): a persona's counts are folded once and then
 * advanced by only the intents recorded since. Every spec here holds the fold to the same answer a
 * fresh store — one whole grouped read — gives for the same data.
 */

const T0 = Date.parse("2026-10-07T14:30:00.000Z");
const MIN = 60_000;
const SETTLED = "2026-10-07T14:31:00.000Z";

const buy = (symbol = "NVDA"): OrderIntent => ({
  symbol,
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "momentum breakout",
});

/** One cycle: an observed intent, a refused one, and a placed one ending in `result`. */
const cycle = (
  at: number,
  result: Omit<OrderResult, "intent">,
  personaId = "sauron",
): DecisionRecord => {
  const placed = buy("NVDA");
  const observed = buy("AMD");
  const refused = buy("TSLA");
  return {
    at,
    personaId,
    mode: "live",
    rawIntents: [observed, refused, placed],
    guardedIntents: [observed, placed],
    outcomes: [
      { intent: observed, action: "observed" },
      { intent: placed, action: "placed", result: { intent: placed, ...result } },
    ],
    refusals: [{ intent: refused, reason: "insufficient-cash" }],
  };
};

const filled = (orderId: string): Omit<OrderResult, "intent"> => ({
  status: "filled",
  orderId,
  filledQuantity: 10,
  filledPrice: 100,
});
const working = (orderId: string): Omit<OrderResult, "intent"> => ({
  status: "working",
  reason: "queued for the open",
  orderId,
});

describe("DecisionDb.funnelFor, folded (#4619)", () => {
  let dir: string;
  let path: string;
  let db: DecisionDb;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-funnel-"));
    path = join(dir, "decisions.db");
    db = openDecisionDb(path);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** The funnel a store that never folded anything reads: one whole grouped pass. */
  const fresh = (personaId = "sauron") => {
    const other = openDecisionDb(path);
    try {
      return other.funnelFor(personaId);
    } finally {
      other.close();
    }
  };

  it("counts what was recorded after the first read, matching a whole read", () => {
    db.record(cycle(T0, filled("o-1")));
    expect(db.funnelFor("sauron")).toMatchObject({ cycles: 1, rawIntents: 3, filled: 1 });

    db.record(cycle(T0 + MIN, filled("o-2")));
    db.record(cycle(T0 + 2 * MIN, filled("o-3")));
    const folded = db.funnelFor("sauron");
    expect(folded).toEqual({
      cycles: 3,
      rawIntents: 9,
      survivedGuards: 6,
      placed: 3,
      filled: 3,
      closed: 0,
      refusalsByReason: { "insufficient-cash": 3 },
    });
    expect(folded).toEqual(fresh());
  });

  it("counts an older decision paged in after newer ones (#4775)", () => {
    db.record(cycle(T0 + 10 * MIN, filled("o-new")));
    db.funnelFor("sauron");
    db.record(cycle(T0, filled("o-old")));
    expect(db.funnelFor("sauron")).toMatchObject({ cycles: 2, placed: 2, filled: 2 });
    expect(db.funnelFor("sauron")).toEqual(fresh());
  });

  it("never counts another persona's intents, before or after the first read", () => {
    db.record(cycle(T0, filled("o-1")));
    db.record(cycle(T0, filled("b-1"), "beta-scout"));
    db.funnelFor("sauron");
    db.record(cycle(T0 + MIN, filled("b-2"), "beta-scout"));
    expect(db.funnelFor("sauron")).toMatchObject({ cycles: 1, rawIntents: 3, filled: 1 });
    expect(db.funnelFor("beta-scout")).toMatchObject({ cycles: 2, rawIntents: 6, filled: 2 });
    expect(db.funnelFor("beta-scout")).toEqual(fresh("beta-scout"));
  });

  it("turns a working order into a fill once its settlement lands after the fold", () => {
    db.record(cycle(T0, working("w-1")));
    expect(db.funnelFor("sauron")).toMatchObject({ placed: 1, filled: 0 });

    db.recordSettlements([
      {
        orderId: "w-1",
        status: "filled",
        filledQuantity: 10,
        filledPrice: 100,
        settledAt: SETTLED,
      },
    ]);
    expect(db.funnelFor("sauron")).toMatchObject({ placed: 1, filled: 1 });
    // Read again: the settled intent was folded once, not once per read.
    expect(db.funnelFor("sauron")).toMatchObject({ rawIntents: 3, placed: 1, filled: 1 });
    expect(db.funnelFor("sauron")).toEqual(fresh());
  });

  it("keeps a working order unfilled when its settlement says nothing filled", () => {
    db.record(cycle(T0, working("w-1")));
    db.record(cycle(T0 + MIN, working("w-2")));
    db.funnelFor("sauron");
    db.recordSettlements([
      { orderId: "w-1", status: "unfilled", filledQuantity: 0, settledAt: SETTLED },
    ]);
    expect(db.funnelFor("sauron")).toMatchObject({ placed: 2, filled: 0 });
    expect(db.funnelFor("sauron")).toEqual(fresh());
  });

  it("counts a fill whose settlement was already stored before the first read", () => {
    db.record(cycle(T0, working("w-1")));
    db.recordSettlements([
      {
        orderId: "w-1",
        status: "filled",
        filledQuantity: 10,
        filledPrice: 100,
        settledAt: SETTLED,
      },
    ]);
    expect(db.funnelFor("sauron")).toMatchObject({ placed: 1, filled: 1 });
  });

  it("walks the persona's own decisions first, then only the intents added since", () => {
    const raw = new DatabaseSync(path);
    try {
      const plan = (sql: string, ...args: (string | number)[]) =>
        (raw.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as { detail: string }[]).map(
          (r) => r.detail,
        );
      expect(plan(FUNNEL_FOLD_SQL.first, "sauron", 10)[0]).toMatch(
        /SEARCH d USING (COVERING )?INDEX decisions_persona_at/,
      );
      expect(plan(FUNNEL_FOLD_SQL.next, "sauron", 10, 5)[0]).toMatch(
        /SEARCH i USING INTEGER PRIMARY KEY \(rowid>\? AND rowid<\?\)/,
      );
    } finally {
      raw.close();
    }
  });
});
