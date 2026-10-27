import { type OrderSettlement, settledResult } from "../../src/domain/order-settlement.js";
import type { OrderResult } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** A result read through its late settlement (#4650): only a `working` result is ever replaced. */

const PUT = "CRWV261106P00085000";
const intent = { ...anOptionIntent(), quantity: 3 };
const settlement: OrderSettlement = {
  orderId: "opt-1",
  status: "filled",
  filledQuantity: 1,
  filledPrice: 2.05,
  legs: [
    { occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 },
    { occSymbol: "CRWV261106P00080000", filledQuantity: 1, filledPrice: 1 },
  ],
  settledAt: "2026-10-07T14:31:00.000Z",
};

describe("settledResult", () => {
  it("reads a working result as what it became — the true quantity, and only the contracts the decision named", () => {
    const working: OrderResult = { intent, status: "working", orderId: "opt-1", reason: "x" };
    expect(settledResult(working, settlement)).toEqual({
      intent,
      status: "filled",
      orderId: "opt-1",
      filledQuantity: 1,
      filledPrice: 2.05,
      legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
    });
  });

  it("takes the broker's id when the decision never learned it, and says nothing filled for an order that never traded", () => {
    const lost: OrderResult = { intent, status: "working" };
    expect(
      settledResult(lost, { ...settlement, status: "unfilled", filledQuantity: 0, legs: [] }),
    ).toEqual({ intent, status: "unfilled", orderId: "opt-1" });
  });

  it("gives a spread the settlement's leg ids when its result never learned them, and keeps its own when it did", () => {
    const LOW = "NVDA261113C00185000";
    const HIGH = "NVDA261113C00200000";
    const spread = anOptionIntent({
      symbol: "NVDA",
      side: "buy",
      option: {
        structure: "call-debit-spread",
        legs: [
          { occSymbol: LOW, side: "buy", ratio: 1 },
          { occSymbol: HIGH, side: "sell", ratio: 1 },
        ],
        limitPrice: 3.4,
      },
    });
    const late: OrderSettlement = {
      orderId: "par-1",
      status: "filled",
      filledQuantity: 1,
      legs: [
        { occSymbol: LOW, orderId: "leg-a", filledQuantity: 1 },
        { occSymbol: HIGH, orderId: "leg-b", filledQuantity: 1 },
        { occSymbol: "NVDA261113C00999000", orderId: "stray", filledQuantity: 1 },
      ],
      settledAt: "2026-10-07T14:31:00.000Z",
    };
    expect(settledResult({ intent: spread, status: "working" }, late).legOrders).toEqual([
      { occSymbol: LOW, orderId: "leg-a" },
      { occSymbol: HIGH, orderId: "leg-b" },
    ]);
    const known = [{ occSymbol: LOW, orderId: "own" }];
    expect(
      settledResult({ intent: spread, status: "working", legOrders: known }, late).legOrders,
    ).toBe(known);
  });

  it("returns any other result untouched, and a working one with nothing settled as it was", () => {
    const filled: OrderResult = { intent, status: "filled", orderId: "opt-1", filledQuantity: 3 };
    expect(settledResult(filled, settlement)).toBe(filled);
    const working: OrderResult = { intent, status: "working", orderId: "opt-1" };
    expect(settledResult(working, undefined)).toBe(working);
  });
});
