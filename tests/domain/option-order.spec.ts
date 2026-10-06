import {
  instrumentKey,
  isBareContractOrder,
  isOptionOrder,
  optionOrderProblems,
  positionIntentOf,
} from "../../src/domain/option-order.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";

/** One rule for what a bot option order may look like — the builder, the guard and the wire parser
 *  all ask this, so each structure is pinned here valid AND broken. */

const PUT = "CRWV261106P00085000";
const CALL = "CRWV261106C00100000";
const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

const coveredCall = (over: Parameters<typeof anOptionIntent>[0] = {}) =>
  anOptionIntent({
    ...over,
    option: {
      structure: "covered-call",
      legs: [{ occSymbol: CALL, side: "sell", ratio: 1 }],
      limitPrice: 1.5,
      band: { low: 1.4, high: 1.6, at: "2026-10-05T14:30:00Z" },
      ...over.option,
    },
  });

const debitSpread = (over: Parameters<typeof anOptionIntent>[0] = {}) =>
  anOptionIntent({
    symbol: "NVDA",
    side: "buy",
    ...over,
    option: {
      structure: "call-debit-spread",
      legs: [
        { occSymbol: LOW, side: "buy", ratio: 1 },
        { occSymbol: HIGH, side: "sell", ratio: 1 },
      ],
      limitPrice: 3.4,
      band: { low: 3.2, high: 3.6, at: "2026-10-05T14:30:00Z" },
      ...over.option,
    },
  });

const closeOne = (over: Parameters<typeof anOptionIntent>[0] = {}) =>
  anOptionIntent({
    side: "buy",
    ...over,
    option: {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
      limitPrice: 0.4,
      ...over.option,
    },
  });

const closeVertical = (over: Parameters<typeof anOptionIntent>[0] = {}) =>
  anOptionIntent({
    symbol: "NVDA",
    side: "sell",
    ...over,
    option: {
      effect: "close",
      structure: "close",
      legs: [
        { occSymbol: LOW, side: "sell", ratio: 1 },
        { occSymbol: HIGH, side: "buy", ratio: 1 },
      ],
      limitPrice: -2.8,
      ...over.option,
    },
  });

describe("optionOrderProblems", () => {
  it.each([
    ["a cash-secured put", anOptionIntent()],
    [
      "a cash-secured put held to assignment",
      anOptionIntent({ option: { assignment: "intended" } }),
    ],
    ["a covered call", coveredCall()],
    ["a call debit spread", debitSpread()],
    ["a one-leg close", closeOne()],
    ["a vertical close for a credit", closeVertical()],
    ["a vertical close for a debit", closeVertical({ side: "buy", option: { limitPrice: 0.3 } })],
  ])("accepts %s", (_name, intent) => {
    expect(optionOrderProblems(intent)).toEqual([]);
  });

  it.each([
    [
      "a leg on another root",
      anOptionIntent({
        option: { legs: [{ occSymbol: "CRWD261106P00085000", side: "sell", ratio: 1 }] },
      }),
    ],
    [
      "a lower-case contract",
      anOptionIntent({
        option: { legs: [{ occSymbol: PUT.toLowerCase(), side: "sell", ratio: 1 }] },
      }),
    ],
    ["ratio 2", anOptionIntent({ option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 2 }] } })],
    ["a NaN limit", anOptionIntent({ option: { limitPrice: Number.NaN } })],
    ["an absurd limit", anOptionIntent({ option: { limitPrice: 100_000 } })],
    ["a market order", anOptionIntent({ type: "market" })],
    ["a fractional quantity", anOptionIntent({ quantity: 1.5 })],
    ["zero quantity", anOptionIntent({ quantity: 0 })],
    ["no legs", anOptionIntent({ option: { legs: [] } })],
    [
      "three legs",
      debitSpread({
        option: {
          legs: [...(debitSpread().option?.legs ?? []), { occSymbol: LOW, side: "buy", ratio: 1 }],
        },
      }),
    ],
    [
      "a band with low above high",
      anOptionIntent({ option: { band: { low: 2.2, high: 2, at: "2026-10-05T14:30:00Z" } } }),
    ],
    [
      "a band with no readable time",
      anOptionIntent({ option: { band: { low: 2, high: 2.2, at: "soon" } } }),
    ],
    ["a bought put sold as a cash-secured put", anOptionIntent({ side: "buy" })],
    [
      "a cash-secured put on a call",
      anOptionIntent({ option: { legs: [{ occSymbol: CALL, side: "sell", ratio: 1 }] } }),
    ],
    ["a cash-secured put that closes", anOptionIntent({ option: { effect: "close" } })],
    [
      "a vertical with the strikes the wrong way round",
      debitSpread({
        option: {
          legs: [
            { occSymbol: HIGH, side: "buy", ratio: 1 },
            { occSymbol: LOW, side: "sell", ratio: 1 },
          ],
        },
      }),
    ],
    ["a debit spread priced as a credit", debitSpread({ option: { limitPrice: -3.4 } })],
    [
      "a debit spread across two expiries",
      debitSpread({
        option: {
          legs: [
            { occSymbol: LOW, side: "buy", ratio: 1 },
            { occSymbol: "NVDA261120C00200000", side: "sell", ratio: 1 },
          ],
        },
      }),
    ],
    ["a vertical close on the wrong side for its sign", closeVertical({ side: "buy" })],
    ["a vertical close at zero", closeVertical({ option: { limitPrice: 0 } })],
    [
      "a vertical close with both legs bought",
      closeVertical({
        option: {
          legs: [
            { occSymbol: LOW, side: "buy", ratio: 1 },
            { occSymbol: HIGH, side: "buy", ratio: 1 },
          ],
        },
      }),
    ],
    ["a one-leg close on the other side", closeOne({ side: "sell" })],
    ["a close marked as an open", closeOne({ option: { effect: "open" } })],
    ["assignment intended on a spread", debitSpread({ option: { assignment: "intended" } })],
    ["an unknown structure", anOptionIntent({ option: { structure: "iron-condor" as never } })],
  ])("refuses %s", (_name, intent) => {
    expect(optionOrderProblems(intent).length).toBeGreaterThan(0);
  });

  it("names a share intent as not an option order", () => {
    const shares: OrderIntent = {
      symbol: "NVDA",
      side: "buy",
      quantity: 1,
      type: "market",
      reason: "x",
    };
    expect(optionOrderProblems(shares)).toEqual(["not an option order"]);
  });
});

describe("instrumentKey", () => {
  it("tells shares apart from each set of contracts on the same ticker", () => {
    const shares: OrderIntent = {
      symbol: "CRWV",
      side: "sell",
      quantity: 100,
      type: "market",
      reason: "x",
    };
    const keys = [shares, anOptionIntent(), coveredCall(), closeOne()].map(instrumentKey);

    expect(keys).toEqual([
      "shares",
      `option:open:sell:${PUT}`,
      `option:open:sell:${CALL}`,
      `option:close:buy:${PUT}`,
    ]);
    expect(instrumentKey(debitSpread())).toBe(`option:open:buy:${LOW}+sell:${HIGH}`);
  });

  it("ignores everything but the instrument — quantity and limit do not change it", () => {
    expect(instrumentKey(anOptionIntent({ quantity: 3, option: { limitPrice: 9 } }))).toBe(
      instrumentKey(anOptionIntent()),
    );
  });
});

describe("the small predicates", () => {
  it("knows an option order, and a share-shaped order that names a contract", () => {
    const bare: OrderIntent = {
      symbol: PUT,
      side: "buy",
      quantity: 1,
      type: "market",
      reason: "x",
    };
    expect(isOptionOrder(anOptionIntent())).toBe(true);
    expect(isOptionOrder(bare)).toBe(false);
    expect(isBareContractOrder(bare)).toBe(true);
    expect(isBareContractOrder(anOptionIntent())).toBe(false);
    expect(isBareContractOrder({ ...bare, symbol: "CRWV" })).toBe(false);
  });

  it("spells Alpaca's position intent from effect and side", () => {
    expect(positionIntentOf("open", "sell")).toBe("sell_to_open");
    expect(positionIntentOf("close", "buy")).toBe("buy_to_close");
  });
});
