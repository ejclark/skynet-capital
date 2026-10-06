import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { storeDecisionBatch } from "../../src/autonomous/decision-wire.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * A late fill re-pairs the P/L tape (#4650 review). A `working` order that fills later belongs on
 * the tape at its own decision's place — ahead of lots that may already have been closed. The trips
 * those closes wrote must then be replaced, never kept beside the new ones: two rows for one close
 * counted the sell twice, and the playbook's realized P/L feeds its compounding budget.
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
const working = (orderId: string) => ({ status: "working" as const, orderId });

const settled = (orderId: string, price: number, over: Partial<OrderSettlement> = {}) => ({
  orderId,
  status: "filled" as const,
  filledQuantity: 10,
  filledPrice: price,
  settledAt: "2026-10-07T16:00:00.000Z",
  ...over,
});

describe("DecisionDb — a late settlement re-pairs the tape it lands on", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "settlement-rebuild-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("shares: the closes already scored are re-paired, never counted twice", () => {
    db.record(cycle(T(0), share("buy"), filled("o0", 100)));
    db.record(cycle(T(1), share("buy"), working("o1")));
    db.record(cycle(T(2), share("buy"), filled("o2", 102)));
    db.record(cycle(T(3), share("sell"), filled("o3", 103)));
    db.record(cycle(T(4), share("sell"), filled("o4", 104)));
    expect(db.realizedPlForPlaybook("sauron", "S1-AAPL")).toBe(50);

    db.recordSettlements([settled("o1", 101)]);

    // FIFO truth: o0→o3 +$30, o1→o4 +$30; o2 is still open.
    expect(db.realizedPlForPlaybook("sauron", "S1-AAPL")).toBe(60);
    expect(db.funnelFor("sauron").closed).toBe(2);

    // A later fill on the same tape scores on top of the rebuilt one, nothing twice.
    db.record(cycle(T(5), share("sell"), filled("o5", 105)));
    expect(db.realizedPlForPlaybook("sauron", "S1-AAPL")).toBe(90);
    expect(db.recordSettlements([settled("o1", 101)])).toBe(0);
    expect(db.listRetrospectives("sauron")).toHaveLength(3);
  });

  it("options: a sold put that filled late is the one the buy-back closes", () => {
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
    db.record(cycle(T(1), { ...sold, clientOrderId: "c-1" }, working("p1")));
    db.record(cycle(T(2), sold, { ...filled("p2", 2, 1), legFills: leg(2) }));
    db.record(cycle(T(3), buyBack, { ...filled("p3", 1, 1), legFills: leg(1) }));
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(100);

    db.recordSettlements([settled("p1", 2.1, { filledQuantity: 1, legs: leg(2.1) })]);

    // The t1 put ($210) is closed for $100; the t2 put is still open.
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(110);
    expect(db.listRetrospectives("sauron")).toHaveLength(1);
  });
});

describe("the dashboard's copy catching up after an outage", () => {
  let dir: string;
  let app: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "settlement-catch-up-"));
    app = openDecisionDb(join(dir, "app.db"));
  });
  afterEach(() => {
    app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("scores the close against the late fill once — realized $20, one trip", () => {
    app.record(cycle(T(1), share("buy"), working("w")));
    storeDecisionBatch(app, {
      personaId: "sauron",
      records: [
        cycle(T(2), share("buy"), filled("l", 102)),
        cycle(T(3), share("sell"), filled("c", 103)),
      ],
      settlements: [settled("w", 101)],
    });
    expect(app.realizedPlForPlaybook("sauron", "S1-AAPL")).toBe(20);
    expect(app.listRetrospectives("sauron")).toHaveLength(1);
  });

  it("stores a batch's settlements before its records, so every close is scored on a tape that has them", () => {
    const calls: string[] = [];
    storeDecisionBatch(
      {
        recordBatch: () => {
          calls.push("records");
        },
        recordSettlements: () => {
          calls.push("settlements");
          return 0;
        },
      },
      { personaId: "sauron", records: [], settlements: [settled("w", 101)] },
    );
    expect(calls).toEqual(["settlements", "records"]);
  });
});
