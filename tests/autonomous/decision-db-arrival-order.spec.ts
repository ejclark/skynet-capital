import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * The dashboard's copy receives the newest decisions first, then pages older history (#4775). An
 * older fill landing after a newer close was already scored re-pairs that close; the trips it wrote
 * must be replaced, never kept beside the new — or the dashboard's realized P/L counts the close
 * twice and disagrees with the bots' own store, which records in order.
 */

const T = (n: number) => Date.parse("2026-10-07T14:00:00.000Z") + n * 60_000;
const PUT = "CRWV261106P00085000";

const share = (side: "buy" | "sell"): OrderIntent => ({
  symbol: "AAPL",
  side,
  quantity: 10,
  type: "market",
  reason: side,
  playbookId: "S1-AAPL",
});

const cycle = (
  at: number,
  intent: OrderIntent,
  result: Omit<OrderResult, "intent">,
): DecisionRecord => ({
  at,
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [{ intent, action: "placed", result: { intent, ...result } }],
});
const filled = (orderId: string, price: number, quantity = 10) => ({
  status: "filled" as const,
  orderId,
  filledQuantity: quantity,
  filledPrice: price,
});

// In order: T0→T2 +$30, T1→T4 +$30, T3 still open — $60 realized, two trips.
const TAPE: readonly DecisionRecord[] = [
  cycle(T(0), share("buy"), filled("o0", 100)),
  cycle(T(1), share("buy"), filled("o1", 101)),
  cycle(T(2), share("sell"), filled("o2", 103)),
  cycle(T(3), share("buy"), filled("o3", 102)),
  cycle(T(4), share("sell"), filled("o4", 104)),
];

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

describe("DecisionDb — decisions arriving out of order (#4775)", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "arrival-order-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("shares: an older buy landing behind a scored close re-pairs it, never counts it twice", () => {
    db.record(cycle(T(2), share("buy"), filled("b2", 102)));
    db.record(cycle(T(3), share("sell"), filled("s3", 103)));
    expect(db.realizedPlForPlaybook("sauron", "S1-AAPL")).toBe(10);

    db.record(cycle(T(0), share("buy"), filled("b0", 100)));

    // FIFO truth: the T0 lot is the one the T3 sell closes (+$30); the T2 lot is still open.
    expect(db.realizedPlForPlaybook("sauron", "S1-AAPL")).toBe(30);
    expect(db.listRetrospectives("sauron")).toHaveLength(1);
  });

  it("options: an older sold put landing behind a scored buy-back is the one it closes", () => {
    const sold = anOptionIntent();
    const buyBack = anOptionIntent({
      side: "buy",
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
        limitPrice: 1,
      },
    });
    const leg = (price: number) => [{ occSymbol: PUT, filledQuantity: 1, filledPrice: price }];
    db.record(cycle(T(2), sold, { ...filled("p2", 2, 1), legFills: leg(2) }));
    db.record(cycle(T(3), buyBack, { ...filled("p3", 1, 1), legFills: leg(1) }));
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(100);

    db.record(cycle(T(1), sold, { ...filled("p1", 2.1, 1), legFills: leg(2.1) }));

    // The T1 put ($210) is closed for $100; the T2 put is still open.
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(110);
    expect(db.listRetrospectives("sauron")).toHaveLength(1);
  });

  it("matches the in-order store whatever order the tape arrives in — every permutation", () => {
    for (const record of TAPE) db.record(record);
    const truth = {
      realized: db.realizedPlForPlaybook("sauron", "S1-AAPL"),
      trips: db.listRetrospectives("sauron").length,
    };
    expect(truth).toEqual({ realized: 60, trips: 2 });

    for (const [n, order] of permutations(TAPE).entries()) {
      const copy = openDecisionDb(join(dir, `copy-${n}.db`));
      for (const record of order) copy.record(record);
      const got = {
        realized: copy.realizedPlForPlaybook("sauron", "S1-AAPL"),
        trips: copy.listRetrospectives("sauron").length,
      };
      copy.close();
      expect({ order: order.map((r) => r.at), ...got }).toEqual({
        order: order.map((r) => r.at),
        ...truth,
      });
    }
  });
});
