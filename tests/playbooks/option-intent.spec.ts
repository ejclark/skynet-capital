import { optionOrderProblems } from "../../src/domain/option-order.js";
import { optionCloseIntent, optionOpenIntent } from "../../src/playbooks/option-intent.js";

const BAND = { low: 2, high: 2.2, at: "2026-10-07T15:00:00Z" };
const PUT = "CRWV261106P00085000";
const CALL_95 = "CRWV261106C00095000";
const CALL_100 = "CRWV261106C00100000";

describe("optionOpenIntent", () => {
  it("builds one well-formed unit of a cash-secured put, on the underlying, as a limit", () => {
    const intent = optionOpenIntent({
      underlying: "CRWV",
      structure: "cash-secured-put",
      legs: [{ occSymbol: PUT, side: "sell" }],
      limitPrice: 2.1,
      band: BAND,
      assignment: "intended",
      reason: "sell a put a month out",
      selection: { rule: "wheel", targetDelta: 0.2 },
    });
    expect(intent).toEqual({
      symbol: "CRWV",
      side: "sell",
      quantity: 1,
      type: "limit",
      reason: "sell a put a month out",
      option: {
        effect: "open",
        structure: "cash-secured-put",
        legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }],
        limitPrice: 2.1,
        band: BAND,
        assignment: "intended",
        selection: { rule: "wheel", targetDelta: 0.2 },
      },
    });
    expect(intent && optionOrderProblems(intent)).toEqual([]);
  });

  it("a debit spread is a buy at its net debit", () => {
    const intent = optionOpenIntent({
      underlying: "CRWV",
      structure: "call-debit-spread",
      legs: [
        { occSymbol: CALL_95, side: "buy" },
        { occSymbol: CALL_100, side: "sell" },
      ],
      limitPrice: 1.9,
      band: { ...BAND, low: 1.7, high: 2.1 },
      reason: "pre-print drift",
    });
    expect(intent).toMatchObject({ side: "buy", quantity: 1, option: { limitPrice: 1.9 } });
  });

  it("emits nothing rather than a malformed order", () => {
    const base = {
      underlying: "CRWV",
      structure: "cash-secured-put" as const,
      legs: [{ occSymbol: PUT, side: "sell" as const }],
      limitPrice: 2.1,
      band: BAND,
      reason: "t",
    };
    expect(optionOpenIntent({ ...base, limitPrice: 0 })).toBeUndefined();
    expect(optionOpenIntent({ ...base, legs: [{ occSymbol: PUT, side: "buy" }] })).toBeUndefined();
    expect(optionOpenIntent({ ...base, underlying: "NVDA" })).toBeUndefined(); // leg root ≠ symbol
    expect(
      optionOpenIntent({
        ...base,
        structure: "call-debit-spread",
        legs: [
          { occSymbol: CALL_100, side: "buy" },
          { occSymbol: CALL_95, side: "sell" },
        ],
      }),
    ).toBeUndefined(); // bought the HIGHER call
  });
});

describe("optionCloseIntent", () => {
  it("closes one leg at its own side, or a vertical signed by its net", () => {
    expect(
      optionCloseIntent({
        underlying: "CRWV",
        legs: [{ occSymbol: PUT, side: "buy" }],
        quantity: 2,
        limitPrice: 0.4,
        reason: "close",
      }),
    ).toMatchObject({ side: "buy", quantity: 2, option: { effect: "close", structure: "close" } });
    expect(
      optionCloseIntent({
        underlying: "CRWV",
        legs: [
          { occSymbol: CALL_95, side: "sell" },
          { occSymbol: CALL_100, side: "buy" },
        ],
        quantity: 1,
        limitPrice: -0.65,
        reason: "close",
      }),
    ).toMatchObject({ side: "sell", option: { limitPrice: -0.65 } });
  });

  it("carries a band only when it was priced against one, and emits nothing at a zero net", () => {
    const close = optionCloseIntent({
      underlying: "CRWV",
      legs: [{ occSymbol: PUT, side: "buy" }],
      quantity: 1,
      limitPrice: 0.4,
      reason: "close",
    });
    expect(close?.option?.band).toBeUndefined();
    expect(
      optionCloseIntent({
        underlying: "CRWV",
        legs: [
          { occSymbol: CALL_95, side: "sell" },
          { occSymbol: CALL_100, side: "buy" },
        ],
        quantity: 1,
        limitPrice: 0,
        reason: "close",
      }),
    ).toBeUndefined();
  });
});
