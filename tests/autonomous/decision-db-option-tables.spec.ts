import { DatabaseSync } from "node:sqlite";
import {
  OPTION_TABLES_SQL,
  type OptionTables,
  openOptionTables,
} from "../../src/autonomous/decision-db-options.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** The option half of the decision store, driven directly against a bare database holding only
 *  the `intents` columns it joins through — `decision-db-options.spec.ts` covers the same tables
 *  end to end through `DecisionDb`; this pins the side tables' own contract: what a write stores,
 *  what a read hands back, and the things a write must never do (throw, duplicate, mislabel). */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 2 },
    ],
    limitPrice: 3.4,
    band: { low: 3.2, high: 3.6, at: "2026-10-27T15:00:00.000Z" },
  },
});

type Outcome = Parameters<OptionTables["write"]>[2];

const outcomeFor = (
  intent: OrderIntent,
  result: Partial<Omit<OrderResult, "intent">> = {},
  clientOrderId?: string,
): Outcome => ({
  intent: clientOrderId ? { ...intent, clientOrderId } : intent,
  action: "placed",
  result: { intent, status: "working", ...result } as OrderResult,
});

describe("openOptionTables", () => {
  let db: DatabaseSync;
  let tables: OptionTables;
  let nextIntent: number;

  /** One `intents` row, as `decision-db.ts` would have written it just before the option rows. */
  const addIntent = (decisionId: number, orderId?: string): number => {
    nextIntent += 1;
    db.prepare("INSERT INTO intents (id, decision_id, order_id) VALUES (?, ?, ?)").run(
      nextIntent,
      decisionId,
      orderId ?? null,
    );
    return nextIntent;
  };

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE intents (id INTEGER PRIMARY KEY, decision_id INTEGER, order_id TEXT)");
    db.exec(OPTION_TABLES_SQL);
    tables = openOptionTables(db);
    nextIntent = 0;
  });
  afterEach(() => db.close());

  describe("when a decision has no option intents", () => {
    it("reads back an empty map", () => {
      addIntent(1);
      expect(tables.forDecision(1).size).toBe(0);
    });

    it("stores nothing for a share order", () => {
      const id = addIntent(1);
      tables.write(
        id,
        { symbol: "CRWV", side: "buy", quantity: 5, type: "market", reason: "x" },
        undefined,
      );
      expect(tables.forDecision(1).size).toBe(0);
    });
  });

  describe("when an option intent is written", () => {
    it("reads back its structure, legs in order, ratios, limit and quoted band", () => {
      const id = addIntent(1);
      tables.write(id, spread, undefined);
      const stored = tables.forDecision(1).get(id);
      expect(stored?.option).toMatchObject({
        effect: "open",
        structure: "call-debit-spread",
        limitPrice: 3.4,
        band: { low: 3.2, high: 3.6, at: "2026-10-27T15:00:00.000Z" },
        legs: [
          { occSymbol: LOW, side: "buy", ratio: 1 },
          { occSymbol: HIGH, side: "sell", ratio: 2 },
        ],
      });
    });

    it("carries no client order id, fills or leg orders when there is no matched outcome", () => {
      const id = addIntent(1);
      tables.write(id, spread, undefined);
      const stored = tables.forDecision(1).get(id);
      expect(stored).not.toHaveProperty("clientOrderId");
      expect(stored).not.toHaveProperty("legFills");
      expect(stored).not.toHaveProperty("legOrders");
    });

    it("takes the client order id from the matched outcome's submitted intent", () => {
      const id = addIntent(1, "parent-1");
      tables.write(id, spread, outcomeFor(spread, { orderId: "parent-1" }, "skynet-abc"));
      expect(tables.forDecision(1).get(id)?.clientOrderId).toBe("skynet-abc");
    });

    it("keeps one option per intent, for every intent of the decision", () => {
      const a = addIntent(1);
      const b = addIntent(1);
      tables.write(a, spread, undefined);
      tables.write(b, anOptionIntent(), undefined);
      const read = tables.forDecision(1);
      expect([...read.keys()]).toEqual([a, b]);
      expect(read.get(a)?.option.legs).toHaveLength(2);
      expect(read.get(b)?.option.legs).toHaveLength(1);
    });

    it("never leaks one decision's options into another's read", () => {
      const mine = addIntent(1);
      const theirs = addIntent(2);
      tables.write(mine, spread, undefined);
      tables.write(theirs, anOptionIntent(), undefined);
      expect([...tables.forDecision(1).keys()]).toEqual([mine]);
      expect([...tables.forDecision(2).keys()]).toEqual([theirs]);
    });

    it("keeps the first row when the same intent is replayed", () => {
      const id = addIntent(1);
      tables.write(id, spread, undefined);
      tables.write(id, anOptionIntent({ option: { limitPrice: 9.99, legs: [] } }), undefined);
      const stored = tables.forDecision(1).get(id);
      expect(stored?.option.limitPrice).toBe(3.4);
      expect(stored?.option.legs).toHaveLength(2);
    });
  });

  describe("when the stored row is missing optional detail", () => {
    it("omits the band unless low, high and its timestamp are all present", () => {
      const noAt = addIntent(1);
      const noLow = addIntent(1);
      const none = addIntent(1);
      tables.write(
        noAt,
        anOptionIntent({ option: { band: { low: 1, high: 2 } as never } }),
        undefined,
      );
      tables.write(
        noLow,
        anOptionIntent({ option: { band: { high: 2, at: "2026-10-05T14:30:00Z" } as never } }),
        undefined,
      );
      tables.write(none, anOptionIntent({ option: { band: undefined } }), undefined);
      const read = tables.forDecision(1);
      for (const id of [noAt, noLow, none]) {
        expect(read.get(id)?.option).not.toHaveProperty("band");
      }
    });

    it("reads an intended assignment back, and nothing for any other value", () => {
      const intended = addIntent(1);
      const other = addIntent(1);
      tables.write(intended, anOptionIntent({ option: { assignment: "intended" } }), undefined);
      tables.write(
        other,
        anOptionIntent({ option: { assignment: "accidental" as never } }),
        undefined,
      );
      const read = tables.forDecision(1);
      expect(read.get(intended)?.option.assignment).toBe("intended");
      expect(read.get(other)?.option).not.toHaveProperty("assignment");
    });

    it("round-trips a selection object", () => {
      const id = addIntent(1);
      const selection = { rule: "short ~0.30 delta", spot: 181.4, dte: 17, candidates: 9 };
      tables.write(id, anOptionIntent({ option: { selection } }), undefined);
      expect(tables.forDecision(1).get(id)?.option.selection).toEqual(selection);
    });

    it.each([
      ["a JSON null", "null"],
      ["a bare number", "42"],
      ["a bare string", '"just text"'],
      ["unparseable text", "{oops"],
      ["an empty string", ""],
    ])("drops a stored selection that is %s, keeping the rest of the option", (_label, json) => {
      const id = addIntent(1);
      tables.write(id, spread, undefined);
      db.prepare("UPDATE intent_options SET selection_json = ?").run(json);
      const stored = tables.forDecision(1).get(id);
      expect(stored?.option).not.toHaveProperty("selection");
      expect(stored?.option.legs).toHaveLength(2);
    });
  });

  describe("when a limit price is not a usable number", () => {
    it.each([
      ["NaN", Number.NaN],
      ["Infinity", Number.POSITIVE_INFINITY],
    ])("stores %s without throwing and reads it back as not-a-number", (_label, limitPrice) => {
      const id = addIntent(1);
      expect(() =>
        tables.write(id, anOptionIntent({ option: { limitPrice } }), undefined),
      ).not.toThrow();
      expect(tables.forDecision(1).get(id)?.option.limitPrice).toBeNaN();
    });
  });

  describe("when the option is malformed", () => {
    it("still stores it AS an option, with placeholder effect and structure", () => {
      const id = addIntent(1);
      const broken = {
        ...anOptionIntent(),
        option: { legs: "not-an-array", limitPrice: 1 },
      } as unknown as OrderIntent;
      expect(() => tables.write(id, broken, undefined)).not.toThrow();
      const stored = tables.forDecision(1).get(id);
      expect(stored?.option.effect).toBe("unknown");
      expect(stored?.option.structure).toBe("unknown");
      expect(stored?.option.legs).toEqual([]);
    });

    it("stores a leg whose ratio is not a whole number with a ratio of zero", () => {
      const id = addIntent(1);
      tables.write(
        id,
        anOptionIntent({
          option: { legs: [{ occSymbol: LOW, side: "buy", ratio: 1.5 }] },
        }),
        undefined,
      );
      expect(tables.forDecision(1).get(id)?.option.legs).toEqual([
        { occSymbol: LOW, side: "buy", ratio: 0 },
      ]);
    });
  });

  describe("when the matched outcome reports leg fills", () => {
    it("records a fill per leg that filled, and none for a leg that did not", () => {
      const id = addIntent(1, "parent-1");
      tables.write(
        id,
        spread,
        outcomeFor(spread, {
          orderId: "parent-1",
          status: "filled",
          legFills: [{ occSymbol: LOW, filledQuantity: 2, filledPrice: 5.1 }],
        }),
      );
      expect(tables.forDecision(1).get(id)?.legFills).toEqual([
        { occSymbol: LOW, filledQuantity: 2, filledPrice: 5.1 },
      ]);
    });

    it("keeps a fill's quantity when the broker gave no price", () => {
      const id = addIntent(1, "parent-1");
      tables.write(
        id,
        spread,
        outcomeFor(spread, {
          orderId: "parent-1",
          legFills: [{ occSymbol: HIGH, filledQuantity: 3 }],
        }),
      );
      const [fill] = tables.forDecision(1).get(id)?.legFills ?? [];
      expect(fill).toEqual({ occSymbol: HIGH, filledQuantity: 3 });
      expect(fill).not.toHaveProperty("filledPrice");
    });

    it("ignores a fill for a contract the intent never named", () => {
      const id = addIntent(1, "parent-1");
      tables.write(
        id,
        spread,
        outcomeFor(spread, {
          orderId: "parent-1",
          legFills: [{ occSymbol: "NVDA261113C00999000", filledQuantity: 1, filledPrice: 1 }],
        }),
      );
      expect(tables.forDecision(1).get(id)).not.toHaveProperty("legFills");
    });
  });

  describe("when a spread's legs are reported under their own order ids", () => {
    const legOrders = [
      { occSymbol: LOW, orderId: "leg-low" },
      { occSymbol: HIGH, orderId: "leg-high" },
    ];

    it("hands each leg order id back on the option, in the leg order", () => {
      const id = addIntent(1, "parent-1");
      tables.write(id, spread, outcomeFor(spread, { orderId: "parent-1", legOrders }));
      expect(tables.forDecision(1).get(id)?.legOrders).toEqual(legOrders);
    });

    it("finds a leg by its own id, naming the spread it belongs to", () => {
      const id = addIntent(1, "parent-1");
      tables.write(id, spread, outcomeFor(spread, { orderId: "parent-1", legOrders }));
      expect(tables.findLeg("leg-high")).toEqual({
        legOrderId: "leg-high",
        parentOrderId: "parent-1",
        occSymbol: HIGH,
        side: "sell",
        ratio: 2,
      });
    });

    it("finds nothing for an id no spread placed", () => {
      expect(tables.findLeg("never-seen")).toBeUndefined();
    });

    it("maps nothing when the result has no order id of its own", () => {
      const id = addIntent(1);
      tables.write(id, spread, outcomeFor(spread, { legOrders }));
      expect(tables.findLeg("leg-low")).toBeUndefined();
    });

    it("maps nothing for an id equal to the parent's, or for a contract the legs never named", () => {
      const id = addIntent(1, "parent-1");
      tables.write(
        id,
        spread,
        outcomeFor(spread, {
          orderId: "parent-1",
          legOrders: [
            { occSymbol: LOW, orderId: "parent-1" },
            { occSymbol: "NVDA261113C00999000", orderId: "stranger" },
          ],
        }),
      );
      expect(tables.findLeg("parent-1")).toBeUndefined();
      expect(tables.findLeg("stranger")).toBeUndefined();
    });

    it("lets a late settlement map the leg ids of a spread recorded before they were known", () => {
      const id = addIntent(1, "parent-1");
      tables.write(id, spread, outcomeFor(spread, { orderId: "parent-1" }));
      expect(tables.forDecision(1).get(id)).not.toHaveProperty("legOrders");

      tables.writeLegOrders({ orderId: "parent-1", legOrders }, spread.option?.legs ?? []);

      expect(tables.findLeg("leg-low")?.parentOrderId).toBe("parent-1");
      expect(tables.forDecision(1).get(id)?.legOrders).toEqual(legOrders);
    });

    it("maps a replayed record's leg ids only once", () => {
      const id = addIntent(1, "parent-1");
      const outcome = outcomeFor(spread, { orderId: "parent-1", legOrders });
      tables.write(id, spread, outcome);
      tables.write(id, spread, outcome);
      const rows = db.prepare("SELECT COUNT(*) AS n FROM option_order_legs").get() as { n: number };
      expect(rows.n).toBe(2);
    });
  });

  describe("when the tables are created again", () => {
    it("leaves existing rows untouched", () => {
      const id = addIntent(1);
      tables.write(id, spread, undefined);
      db.exec(OPTION_TABLES_SQL);
      const reopened = openOptionTables(db);
      expect(reopened.forDecision(1).get(id)?.option.structure).toBe("call-debit-spread");
    });
  });
});
