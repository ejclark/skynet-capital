import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { optionFillCost, optionFillCostWords } from "../../src/observatory/option-fill-cost.js";
import { anOptionIntent } from "../support/builders.js";

/** #4642 criterion 8: a bot's option fill in dollars. The broker's price is per share, so the cash
 *  that moved is ×100 per contract — and a spread nets its legs into the one number that moved. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

const filled = (intent: OrderIntent, over: Partial<OrderResult> = {}): OrderResult => ({
  intent,
  status: "filled",
  filledQuantity: intent.quantity,
  ...over,
});

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

describe("optionFillCost", () => {
  it("reads a sold put's fill as the premium received, ×100 per contract", () => {
    const sold = anOptionIntent();
    const cost = optionFillCost(sold, filled(sold, { filledPrice: 2.05 }));
    expect(cost).toEqual({
      dollars: 205,
      direction: "received",
      quantity: 1,
      perShare: 2.05,
      spread: false,
    });
    expect(cost && optionFillCostWords(cost)).toBe(
      "$205.00 received — 1 contract × 100 shares × $2.05",
    );
  });

  it("reads a bought-back contract as paid, from its leg's own fill", () => {
    const buyBack = anOptionIntent({
      side: "buy",
      quantity: 2,
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: "CRWV261106P00085000", side: "buy", ratio: 1 }],
        limitPrice: 0.4,
      },
    });
    const result = filled(buyBack, {
      filledPrice: 0.35,
      legFills: [{ occSymbol: "CRWV261106P00085000", filledQuantity: 2, filledPrice: 0.35 }],
    });
    const cost = optionFillCost(buyBack, result);
    expect(cost && optionFillCostWords(cost)).toBe(
      "$70.00 paid — 2 contracts × 100 shares × $0.35",
    );
  });

  it("nets a debit spread's legs into what it paid", () => {
    const result = filled(spread, {
      legFills: [
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
        { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
      ],
    });
    const cost = optionFillCost(spread, result);
    expect(cost && optionFillCostWords(cost)).toBe(
      "$335.00 paid — 1 spread × 100 shares × $3.35 net",
    );
  });

  it("nets a spread's close into what it received, whatever sign the parent price carries", () => {
    const close = anOptionIntent({
      symbol: "NVDA",
      side: "sell",
      option: {
        effect: "close",
        structure: "close",
        legs: [
          { occSymbol: HIGH, side: "buy", ratio: 1 },
          { occSymbol: LOW, side: "sell", ratio: 1 },
        ],
        limitPrice: -2.8,
      },
    });
    // The legs say which way the cash went; a parent price printed positive must not flip it.
    const result = filled(close, {
      filledPrice: 2.9,
      legFills: [
        { occSymbol: HIGH, filledQuantity: 1, filledPrice: 4.1 },
        { occSymbol: LOW, filledQuantity: 1, filledPrice: 7 },
      ],
    });
    expect(optionFillCost(close, result)).toMatchObject({ dollars: 290, direction: "received" });
  });

  it("falls back to the broker's signed net when a spread's legs carry no prices", () => {
    expect(optionFillCost(spread, filled(spread, { filledPrice: 3.35 }))).toMatchObject({
      dollars: 335,
      direction: "paid",
    });
    expect(optionFillCost(spread, filled(spread, { filledPrice: -1.2 }))).toMatchObject({
      dollars: 120,
      direction: "received",
    });
  });

  it("counts a partial fill's contracts, not the order's", () => {
    const sold = anOptionIntent({ quantity: 3 });
    expect(
      optionFillCost(sold, filled(sold, { filledQuantity: 2, filledPrice: 1.5 })),
    ).toMatchObject({ dollars: 300, quantity: 2 });
  });

  it("says nothing for an order that did not fill, a fill with no price, or a share order", () => {
    const sold = anOptionIntent();
    expect(optionFillCost(sold, { intent: sold, status: "unfilled" })).toBeUndefined();
    expect(optionFillCost(sold, { intent: sold, status: "working" })).toBeUndefined();
    expect(optionFillCost(sold, filled(sold))).toBeUndefined();
    expect(optionFillCost(sold, undefined)).toBeUndefined();
    const shares: OrderIntent = {
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "r",
    };
    expect(optionFillCost(shares, filled(shares, { filledPrice: 180 }))).toBeUndefined();
  });
});
