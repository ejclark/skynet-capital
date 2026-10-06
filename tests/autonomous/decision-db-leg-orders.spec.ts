import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord, IntentOutcome } from "../../src/autonomous/decision-record.js";
import { DECISION_BATCH_KIND_V2, parseDecisionBatch } from "../../src/autonomous/decision-wire.js";
import { parseLegFills } from "../../src/autonomous/decision-wire-options.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** A spread's leg orders (#4650): Alpaca reports a spread's fills one per leg, each under the LEG's
 *  own order id. The store maps each leg id back to the spread's order, on the bots side and on the
 *  dashboard's replicated copy alike, so a leg fill can find the decision that placed it. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const INVALIDATOR =
  "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  forecast: { direction: "up", invalidator: INVALIDATOR },
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});

const placed = (intent: OrderIntent, result: Omit<OrderResult, "intent">): IntentOutcome => ({
  intent,
  action: "placed",
  result: { intent, ...result },
});

function spreadRecord(at: number, legFills: OrderResult["legFills"]): DecisionRecord {
  const submitted = { ...spread, clientOrderId: `sk1-sauron-NVDA-k9x2-${at}` };
  return {
    at,
    personaId: "sauron",
    mode: "live",
    rawIntents: [spread],
    guardedIntents: [spread],
    outcomes: [
      placed(submitted, {
        status: "filled",
        orderId: "mleg-1",
        filledQuantity: 1,
        filledPrice: 3.35,
        ...(legFills ? { legFills } : {}),
      }),
    ],
  };
}

const LEG_FILLS = [
  { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1, orderId: "leg-low" },
  { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75, orderId: "leg-high" },
];

describe("DecisionDb — a spread's leg orders", () => {
  let dir: string;
  let dbPath: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-leg-orders-"));
    dbPath = join(dir, "decisions.db");
    db = openDecisionDb(dbPath);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("joins each leg's fill to the decision that placed the spread, its playbook and invalidator with it", () => {
    db.record(spreadRecord(1, LEG_FILLS));

    for (const [legOrderId, occSymbol, side] of [
      ["leg-low", LOW, "buy"],
      ["leg-high", HIGH, "sell"],
    ] as const) {
      const leg = db.findSpreadLeg(legOrderId);
      expect(leg).toEqual({ legOrderId, parentOrderId: "mleg-1", occSymbol, side, ratio: 1 });
      const decision = db.findByOrderId(leg?.parentOrderId ?? "");
      expect(decision?.intent.playbookId).toBe("NVDA-CALL-SPREAD");
      expect(decision?.intent.forecast?.invalidator).toBe(INVALIDATOR);
    }
    // The exact order-id join itself is unchanged: a leg id is not the spread's order.
    expect(db.findByOrderId("leg-low")).toBeUndefined();
  });

  it("round-trips the leg ids on the record, so replication carries them", () => {
    const record = spreadRecord(1, LEG_FILLS);
    db.record(record);
    db.close();
    db = openDecisionDb(dbPath);

    expect(db.listSince("sauron", 0)).toEqual([record]);
    expect(db.listByPersona("sauron")).toEqual([record]);
  });

  it("lands the leg map on the dashboard's copy: bots read-back → wire → app store", () => {
    db.record(spreadRecord(1, LEG_FILLS));
    const appDb = openDecisionDb(join(dir, "app-decisions.db"));
    try {
      // Exactly what the replication client posts: the bots' own read-back, as JSON.
      const body = JSON.parse(
        JSON.stringify({
          kind: DECISION_BATCH_KIND_V2,
          personaId: "sauron",
          records: db.listSince("sauron", 0),
        }),
      );
      const batch = parseDecisionBatch(body);
      expect(batch?.records).toHaveLength(1);
      appDb.recordBatch(batch?.records ?? []);
      expect(appDb.findSpreadLeg("leg-high")?.parentOrderId).toBe("mleg-1");
      expect(appDb.findByOrderId("mleg-1")?.intent.forecast?.invalidator).toBe(INVALIDATOR);
    } finally {
      appDb.close();
    }
  });

  it("maps only a leg the decision placed: never another contract, never the spread's own id", () => {
    db.record(
      spreadRecord(1, [
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1, orderId: "mleg-1" },
        { occSymbol: "NVDA261113C00210000", filledQuantity: 1, filledPrice: 1, orderId: "stray" },
      ]),
    );
    expect(db.findSpreadLeg("mleg-1")).toBeUndefined();
    expect(db.findSpreadLeg("stray")).toBeUndefined();
  });

  it("maps nothing for a one-leg order, whose fill already carries the decision's own id", () => {
    const put = anOptionIntent();
    db.record({
      at: 1,
      personaId: "sauron",
      mode: "live",
      rawIntents: [put],
      guardedIntents: [put],
      outcomes: [
        placed(put, {
          status: "filled",
          orderId: "put-1",
          filledQuantity: 1,
          filledPrice: 2.1,
          legFills: [{ occSymbol: "CRWV261106P00085000", filledQuantity: 1, filledPrice: 2.1 }],
        }),
      ],
    });
    expect(db.findSpreadLeg("put-1")).toBeUndefined();
    expect(db.findByOrderId("put-1")?.intent.option?.structure).toBe("cash-secured-put");
  });

  it("reaches a database created before the leg map existed", () => {
    db.close();
    const raw = new DatabaseSync(dbPath);
    raw.exec("DROP TABLE option_order_legs;");
    raw.close();
    db = openDecisionDb(dbPath);
    db.record(spreadRecord(2, LEG_FILLS));
    expect(db.findSpreadLeg("leg-low")?.parentOrderId).toBe("mleg-1");
  });
});

describe("parseLegFills — a leg's own order id on the wire", () => {
  it("keeps a leg's order id, and drops a malformed one without dropping the fill", () => {
    expect(
      parseLegFills([
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1, orderId: "leg-low" },
        { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75, orderId: 42 },
        { occSymbol: HIGH, filledQuantity: 1, orderId: "" },
      ]),
    ).toEqual([
      { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1, orderId: "leg-low" },
      { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
      { occSymbol: HIGH, filledQuantity: 1 },
    ]);
  });
});
