import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";
import { reasoningForOrder } from "../../src/observatory/wire-reasoning.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * Late fills of `working` orders (#4650, plan #4642 slice 8). A day limit whose cancel was not
 * confirmed, or a share order queued for the open, is recorded `working`; the broker may fill it
 * afterwards. The store keeps what it became BESIDE the decision — never over it — and every read
 * that shows or scores the decision reads the settlement in place of the `working` result.
 */

const PUT = "CRWV261106P00085000";
const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const T0 = Date.parse("2026-10-07T14:30:00.000Z");
const CID = "sk1-sauron-CRWV-k9x2-0";

const soldPut = anOptionIntent();
const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});
const shares = (side: "buy" | "sell"): OrderIntent => ({
  symbol: "NVDA",
  side,
  quantity: 10,
  type: "market",
  reason: side === "buy" ? "staged for the open" : "take the gain",
  playbookId: "S1-NVDA",
});

/** One live cycle that placed `intent` with `result` (its intent filled in). */
const cycle = (
  at: number,
  intent: OrderIntent,
  result: Omit<OrderResult, "intent">,
  mode: "live" | "observe" = "live",
): DecisionRecord => {
  const submitted = intent.option ? { ...intent, clientOrderId: `${CID}-${at}` } : intent;
  return {
    at,
    personaId: "sauron",
    mode,
    rawIntents: [intent],
    guardedIntents: [intent],
    outcomes: [{ intent: submitted, action: "placed", result: { intent: submitted, ...result } }],
  };
};

const working = (orderId?: string): Omit<OrderResult, "intent"> => ({
  status: "working",
  reason: "cancel not confirmed — rechecked next cycle",
  ...(orderId ? { orderId } : {}),
});

const putFilled = (over: Partial<OrderSettlement> = {}): OrderSettlement => ({
  orderId: "opt-1",
  clientOrderId: `${CID}-${T0}`,
  status: "filled",
  filledQuantity: 1,
  filledPrice: 2.05,
  legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
  settledAt: "2026-10-07T14:31:00.000Z",
  ...over,
});

const expiry = { id: "act-1", type: "OPEXP" as const, symbol: PUT, quantity: 1 };
const expired = [{ ...expiry, at: "2026-11-06T23:59:59.999Z" }];

const resultOf = (db: DecisionDb, at = T0): OrderResult | undefined =>
  db.listByPersona("sauron").find((r) => r.at === at)?.outcomes[0]?.result;

describe("DecisionDb — late fills of working orders", () => {
  let dir: string;
  let path: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-settlements-"));
    path = join(dir, "decisions.db");
    db = openDecisionDb(path);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("WHEN a working option order later fills, its decision reads as filled, with quantity and price", () => {
    db.record(cycle(T0, soldPut, working("opt-1")));
    expect(resultOf(db)?.status).toBe("working");

    expect(db.recordSettlements([putFilled()])).toBe(1);

    expect(resultOf(db)).toMatchObject({
      status: "filled",
      orderId: "opt-1",
      filledQuantity: 1,
      filledPrice: 2.05,
      legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
    });
    // Heartbeat (the cycle view) and Activity (the fill's decision) read the same answer.
    const [view] = decisionCyclesView(db.listByPersona("sauron")).cycles;
    expect(view?.outcomes[0]).toMatchObject({
      resultStatus: "filled",
      fill: "$205.00 received — 1 contract × 100 shares × $2.05",
    });
    expect(view?.outcomes[0]).not.toHaveProperty("resultLabel");
    expect(
      reasoningForOrder("opt-1", { findByOrderId: (id) => db.findByOrderId(id) }),
    ).toMatchObject({ cost: "$205.00 received — 1 contract × 100 shares × $2.05" });
    expect(db.funnelFor("sauron")).toMatchObject({ placed: 1, filled: 1 });
  });

  it("scores the late fill's P/L exactly once, however often its settlement is observed", () => {
    db.record(cycle(T0, soldPut, working("opt-1")));
    db.recordSettlements([putFilled()]);
    db.recordOptionLifecycle("sauron", expired);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);

    // A second settle pass, and a restart that reads it again: stored once, scored once.
    expect(db.recordSettlements([putFilled(), putFilled()])).toBe(0);
    db.close();
    db = openDecisionDb(path);
    expect(db.recordSettlements([putFilled({ settledAt: "2026-10-08T14:31:00.000Z" })])).toBe(0);
    expect(db.recentSettlements()).toHaveLength(1);
    expect(db.listRetrospectives("sauron")).toHaveLength(1);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
  });

  it("WHEN it partly fills then cancels, it reads as partly filled with the true quantity", () => {
    const three = { ...soldPut, quantity: 3 };
    db.record(cycle(T0, three, working("opt-1")));
    db.recordSettlements([
      putFilled({ legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }] }),
    ]);

    expect(resultOf(db)).toMatchObject({ status: "filled", filledQuantity: 1, filledPrice: 2.05 });
    const [view] = decisionCyclesView(db.listByPersona("sauron")).cycles;
    expect(view?.outcomes[0]).toMatchObject({
      contract: "SELL 3 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      fill: "$205.00 received — 1 contract × 100 shares × $2.05",
    });
    // One contract was written, so one expires: $205, never 3 × $205.
    db.recordOptionLifecycle("sauron", expired);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
  });

  it("reads an order that ended with nothing filled as unfilled, and scores nothing", () => {
    db.record(cycle(T0, soldPut, working("opt-1")));
    db.recordSettlements([
      putFilled({ status: "unfilled", filledQuantity: 0, filledPrice: undefined, legs: [] }),
    ]);
    const result = resultOf(db);
    expect(result?.status).toBe("unfilled");
    expect(result).not.toHaveProperty("filledQuantity");
    db.recordOptionLifecycle("sauron", expired);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(0);
  });

  it("WHEN a working spread settles late, its legs join its decision", () => {
    db.record(cycle(T0, spread, working("mleg-1")));
    expect(db.findSpreadLeg("leg-low")).toBeUndefined();

    db.recordSettlements([
      {
        orderId: "mleg-1",
        status: "filled",
        filledQuantity: 1,
        filledPrice: 3.35,
        legs: [
          { occSymbol: LOW, orderId: "leg-low", filledQuantity: 1, filledPrice: 5.1 },
          { occSymbol: HIGH, orderId: "leg-high", filledQuantity: 1, filledPrice: 1.75 },
        ],
        settledAt: "2026-10-07T14:31:00.000Z",
      },
    ]);

    expect(db.findSpreadLeg("leg-low")).toMatchObject({
      parentOrderId: "mleg-1",
      occSymbol: LOW,
      side: "buy",
    });
    expect(db.findSpreadLeg("leg-high")).toMatchObject({ parentOrderId: "mleg-1", side: "sell" });
    expect(resultOf(db)).toMatchObject({
      status: "filled",
      filledQuantity: 1,
      legOrders: [
        { occSymbol: LOW, orderId: "leg-low" },
        { occSymbol: HIGH, orderId: "leg-high" },
      ],
    });
    const [view] = decisionCyclesView(db.listByPersona("sauron")).cycles;
    expect(view?.outcomes[0]?.fill).toBe("$335.00 paid — 1 spread × 100 shares × $3.35 net");
  });

  it("links a settlement that lands before its decision — the dashboard's copy can see them in either order", () => {
    expect(db.recordSettlements([putFilled()])).toBe(1);
    db.record(cycle(T0, soldPut, working("opt-1")));

    expect(resultOf(db)).toMatchObject({ status: "filled", filledQuantity: 1, filledPrice: 2.05 });
    db.recordOptionLifecycle("sauron", expired);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
  });

  it("joins by the bot's own stamp when the decision never learned the broker's order id", () => {
    db.record(cycle(T0, soldPut, working()));
    db.recordSettlements([putFilled({ orderId: "late-1" })]);

    expect(resultOf(db)).toMatchObject({ status: "filled", orderId: "late-1", filledQuantity: 1 });
    expect(db.findByOrderId("late-1")?.intent.option?.legs[0]?.occSymbol).toBe(PUT);
    // One stamp is one order: a second settlement claiming it is never a second fill.
    expect(db.recordSettlements([putFilled({ orderId: "late-2" })])).toBe(0);
    db.recordOptionLifecycle("sauron", expired);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(205);
  });

  it("A decision that settled on time reads exactly as it was written, whatever a settlement says", () => {
    db.record(
      cycle(T0, soldPut, {
        status: "filled",
        orderId: "opt-1",
        filledQuantity: 1,
        filledPrice: 2.1,
        legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.1 }],
      }),
    );
    const before = db.listByPersona("sauron");
    db.recordSettlements([putFilled({ filledPrice: 9.99 })]);
    expect(db.listByPersona("sauron")).toEqual(before);
    db.recordOptionLifecycle("sauron", expired);
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(210);
  });

  it("puts a share order queued for the open on the share tape where it was decided", () => {
    db.record(cycle(T0, shares("buy"), { ...working("sh-1"), reason: "order accepted" }));
    // The exit fills on time; with the entry still `working`, there is nothing it closes.
    db.record(
      cycle(T0 + 86_400_000, shares("sell"), {
        status: "filled",
        orderId: "sh-2",
        filledQuantity: 10,
        filledPrice: 110,
      }),
    );
    expect(db.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(0);

    db.recordSettlements([
      {
        orderId: "sh-1",
        status: "filled",
        filledQuantity: 10,
        filledPrice: 100,
        settledAt: "2026-10-08T13:31:00.000Z",
      },
    ]);
    expect(resultOf(db)).toMatchObject({ status: "filled", filledQuantity: 10, filledPrice: 100 });
    expect(db.realizedPlForPlaybook("sauron", "S1-NVDA")).toBe(100);
  });

  it("lists, for a restart, the live orders still working that nothing has settled", () => {
    db.record(cycle(T0 - 10 * 86_400_000, soldPut, working("too-old")));
    db.record(cycle(T0, soldPut, working("opt-1")));
    db.record(cycle(T0 + 1, shares("buy"), working("sh-1")));
    db.record(cycle(T0 + 2, spread, working("mleg-1")));
    db.record(cycle(T0 + 3, soldPut, working()));
    db.record(cycle(T0 + 4, soldPut, working("observed"), "observe"));
    db.record(cycle(T0 + 5, shares("sell"), { status: "filled", orderId: "sh-2" }));
    db.recordSettlements([
      {
        orderId: "mleg-1",
        status: "unfilled",
        filledQuantity: 0,
        settledAt: "2026-10-07T15:00:00Z",
      },
    ]);

    expect(db.unsettledOrders("sauron", T0 - 86_400_000)).toEqual([
      { orderId: "opt-1", clientOrderId: `${CID}-${T0}`, symbol: "CRWV", option: true },
      { orderId: "sh-1", symbol: "NVDA", option: false },
      { clientOrderId: `${CID}-${T0 + 3}`, symbol: "CRWV", option: true },
    ]);
    expect(db.unsettledOrders("someone-else", 0)).toEqual([]);
  });
});
