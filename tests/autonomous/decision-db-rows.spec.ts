import {
  decisionFrom,
  intentRowToStored,
  paramsForRawIntent,
  type StoredIntentRow,
} from "../../src/autonomous/decision-db-rows.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";

const intent = (over: Partial<OrderIntent> = {}): OrderIntent => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
  ...over,
});

describe("paramsForRawIntent", () => {
  it("attributes an exact-reference refusal, never touching the approved columns", () => {
    const raw = intent();
    const usedOutcomes = new Set<number>();

    const params = paramsForRawIntent(
      raw,
      { outcomes: [], refusals: [{ intent: raw, reason: "position-cap" }] },
      usedOutcomes,
    );

    // [symbol, side, rawQuantity, reason, strategy, expectation, forecastJson, playbookId,
    //  playbookMode, momentum, sentiment, guardReason, approvedQuantity, action, orderId,
    //  resultStatus, filledQuantity, filledPrice]
    expect(params[11]).toBe("position-cap"); // guardReason
    expect(params[12]).toBeNull(); // approvedQuantity
    expect(params[13]).toBeNull(); // action
  });

  it("matches an approved intent by symbol+side — clampBuy/clampSell never return the same reference", () => {
    const raw = intent({ quantity: 100 });
    // The guarded intent is a NEW object (as applyGuardsWithVerdicts always produces), clamped.
    const guarded = { ...raw, quantity: 42 };
    const usedOutcomes = new Set<number>();

    const params = paramsForRawIntent(
      raw,
      {
        outcomes: [
          {
            intent: guarded,
            action: "placed",
            result: { intent: guarded, status: "filled", orderId: "o1" },
          },
        ],
        refusals: [],
      },
      usedOutcomes,
    );

    expect(params[2]).toBe(100); // rawQuantity preserved
    expect(params[11]).toBeNull(); // guardReason
    expect(params[12]).toBe(42); // approvedQuantity — the clamp is visible
    expect(params[13]).toBe("placed"); // action
    expect(params[14]).toBe("o1"); // orderId
  });

  it("claims at most one outcome per raw intent — a second same-symbol-side raw intent matches nothing rather than double-counting", () => {
    const rawA = intent();
    const rawB = intent(); // same symbol+side — the documented rare/degenerate case
    const guarded = { ...rawA, quantity: 10 };
    const usedOutcomes = new Set<number>();
    const entry = {
      outcomes: [{ intent: guarded, action: "placed" as const }],
      refusals: [],
    };

    const paramsA = paramsForRawIntent(rawA, entry, usedOutcomes);
    const paramsB = paramsForRawIntent(rawB, entry, usedOutcomes);

    expect(paramsA[13]).toBe("placed");
    expect(paramsB[13]).toBeNull(); // fails safe: no double count
  });

  it("carries the per-symbol momentum/sentiment from context, never a whole-context blob", () => {
    const raw = intent();
    const params = paramsForRawIntent(
      raw,
      {
        outcomes: [],
        refusals: [],
        context: {
          asOf: "t",
          quotes: {},
          momentum: { NVDA: 0.05 },
          newsSentiment: { NVDA: -0.6 },
        },
      },
      new Set(),
    );
    expect(params[9]).toBe(0.05); // momentum
    expect(params[10]).toBe(-0.6); // sentiment
  });
});

describe("decisionFrom / intentRowToStored — the reconstruction round trip", () => {
  it("splits refused vs approved rows back into refusals/guardedIntents/outcomes", () => {
    const refusedRow: StoredIntentRow = {
      symbol: "NVDA",
      side: "buy",
      rawQuantity: 60,
      reason: "panic claim",
      guardReason: "s2-print",
    };
    const approvedRow: StoredIntentRow = {
      symbol: "MSFT",
      side: "sell",
      rawQuantity: 20,
      reason: "fade",
      approvedQuantity: 15,
      action: "placed",
      orderId: "o-1",
      resultStatus: "filled",
      filledQuantity: 15,
      filledPrice: 400.5,
    };

    const record: DecisionRecord = decisionFrom(1_700_000_000_000, "sauron", "live", null, null, [
      refusedRow,
      approvedRow,
    ]);

    expect(record.rawIntents).toHaveLength(2);
    expect(record.rawIntents[0]).toMatchObject({ symbol: "NVDA", quantity: 60 });
    expect(record.refusals).toEqual([
      { intent: expect.objectContaining({ symbol: "NVDA", quantity: 60 }), reason: "s2-print" },
    ]);
    expect(record.guardedIntents).toEqual([
      expect.objectContaining({ symbol: "MSFT", quantity: 15 }),
    ]);
    expect(record.outcomes[0]).toMatchObject({
      action: "placed",
      result: { orderId: "o-1", status: "filled", filledQuantity: 15, filledPrice: 400.5 },
    });
  });

  it("restores context and halted only when present — never fabricates them", () => {
    const withContext = decisionFrom(
      1,
      "sauron",
      "observe",
      null,
      JSON.stringify({ asOf: "t", quotes: {} }),
      [],
    );
    expect(withContext.context).toEqual({ asOf: "t", quotes: {} });
    expect(withContext).not.toHaveProperty("halted");

    const halted = decisionFrom(1, "sauron", "observe", "manual", null, []);
    expect(halted.halted).toBe("manual");
    expect(halted).not.toHaveProperty("context");
  });

  it("omits refusals entirely when every intent was approved", () => {
    const row: StoredIntentRow = {
      symbol: "NVDA",
      side: "buy",
      rawQuantity: 10,
      reason: "t",
      approvedQuantity: 10,
      action: "observed",
    };
    const record = decisionFrom(1, "sauron", "observe", null, null, [row]);
    expect(record).not.toHaveProperty("refusals");
  });

  it("intentRowToStored round-trips a forecast through JSON", () => {
    const row = intentRowToStored({
      symbol: "NVDA",
      side: "buy",
      raw_quantity: 10,
      reason: "t",
      forecast_json: JSON.stringify({ direction: "up", invalidator: "x" }),
    });
    expect(row.forecast).toEqual({ direction: "up", invalidator: "x" });
  });
});
