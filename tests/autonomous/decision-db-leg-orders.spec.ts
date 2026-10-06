import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord, IntentOutcome } from "../../src/autonomous/decision-record.js";
import {
  DECISION_BATCH_KIND_V2,
  parseDecisionBatch,
  recordWireKind,
} from "../../src/autonomous/decision-wire.js";
import { parseLegOrders } from "../../src/autonomous/decision-wire-options.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** A spread's leg orders (#4650): Alpaca reports a spread's fills one per leg, each under the LEG's
 *  own order id. The store maps each leg id back to the spread's order, on the bots side and on the
 *  dashboard's replicated copy alike, so a leg fill can find the decision that placed it — whatever
 *  the order's result said when it was written. */

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

const LEG_ORDERS = [
  { occSymbol: LOW, orderId: "leg-low" },
  { occSymbol: HIGH, orderId: "leg-high" },
];

function spreadRecord(at: number, result: Omit<OrderResult, "intent">): DecisionRecord {
  const submitted = { ...spread, clientOrderId: `sk1-sauron-NVDA-k9x2-${at}` };
  return {
    at,
    personaId: "sauron",
    mode: "live",
    rawIntents: [spread],
    guardedIntents: [spread],
    outcomes: [placed(submitted, result)],
  };
}

const filled = (legOrders = LEG_ORDERS): Omit<OrderResult, "intent"> => ({
  status: "filled",
  orderId: "mleg-1",
  filledQuantity: 1,
  filledPrice: 3.35,
  legFills: [
    { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
    { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
  ],
  legOrders,
});

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
    db.record(spreadRecord(1, filled()));

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

  it("maps the legs of an order whose result was written before anything filled", () => {
    // A cancel the broker never confirmed (`working`): the order may still fill, and its fills
    // arrive under these leg ids long after this record was written.
    db.record(spreadRecord(1, { status: "working", orderId: "mleg-1", legOrders: LEG_ORDERS }));
    db.record(
      spreadRecord(2, {
        status: "unfilled",
        orderId: "mleg-2",
        legOrders: [
          { occSymbol: LOW, orderId: "leg-low-2" },
          { occSymbol: HIGH, orderId: "leg-high-2" },
        ],
      }),
    );
    expect(db.findSpreadLeg("leg-low")?.parentOrderId).toBe("mleg-1");
    expect(db.findSpreadLeg("leg-high")?.parentOrderId).toBe("mleg-1");
    expect(db.findSpreadLeg("leg-high-2")?.parentOrderId).toBe("mleg-2");
    // Nothing filled, so no fill is invented: the result carries no leg fills.
    expect(db.findByOrderId("mleg-1")?.record.outcomes[0]?.result).not.toHaveProperty("legFills");
  });

  it("round-trips the leg ids on the record, so replication carries them", () => {
    const records = [
      spreadRecord(1, filled()),
      spreadRecord(2, {
        status: "working",
        orderId: "mleg-2",
        legOrders: [
          { occSymbol: LOW, orderId: "leg-low-2" },
          { occSymbol: HIGH, orderId: "leg-high-2" },
        ],
      }),
    ];
    for (const record of records) db.record(record);
    db.close();
    db = openDecisionDb(dbPath);

    expect(db.listSince("sauron", 0)).toEqual(records);
    // Every record carrying leg ids crosses the wire as the kind a dashboard that knows them reads.
    expect(records.map(recordWireKind)).toEqual([DECISION_BATCH_KIND_V2, DECISION_BATCH_KIND_V2]);
  });

  it("lands the leg map on the dashboard's copy: bots read-back → wire → app store", () => {
    db.record(spreadRecord(1, filled()));
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
      spreadRecord(
        1,
        filled([
          { occSymbol: LOW, orderId: "mleg-1" },
          { occSymbol: "NVDA261113C00210000", orderId: "stray" },
        ]),
      ),
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
    db.record(spreadRecord(2, filled()));
    expect(db.findSpreadLeg("leg-low")?.parentOrderId).toBe("mleg-1");
  });
});

describe("parseLegOrders — a spread's leg order ids on the wire", () => {
  it("keeps each well-formed leg id and drops a malformed one alone", () => {
    expect(
      parseLegOrders([
        { occSymbol: LOW, orderId: "leg-low" },
        { occSymbol: HIGH, orderId: 42 },
        { occSymbol: HIGH, orderId: "" },
        "junk",
      ]),
    ).toEqual([{ occSymbol: LOW, orderId: "leg-low" }]);
  });

  it("reads nothing usable as absent, never an empty list", () => {
    expect(parseLegOrders([{ occSymbol: HIGH }])).toBeUndefined();
    expect(parseLegOrders(undefined)).toBeUndefined();
  });
});
