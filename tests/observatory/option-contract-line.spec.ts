import type { OrderIntent } from "../../src/domain/types.js";
import { optionContractLine } from "../../src/observatory/option-contract-line.js";
import { anOptionIntent } from "../support/builders.js";

/** A bot's option order, in the one line a member reads in its decision history — never the
 *  "SELL 1 CRWV" a share line would print for a sold put. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";

describe("optionContractLine", () => {
  it("reads a sold put as the contract and its limit", () => {
    expect(optionContractLine(anOptionIntent())).toBe(
      "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
    );
  });

  it("reads a debit spread's strikes low to high, with what it pays", () => {
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
    expect(optionContractLine(spread)).toBe(
      "BUY 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $3.40 debit",
    );
  });

  it("reads a spread's close as CLOSE, with what it receives", () => {
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
    expect(optionContractLine(close)).toBe(
      "CLOSE 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $2.80 credit",
    );
  });

  it("reads a one-leg close as CLOSE, with what it pays", () => {
    const buyBack = anOptionIntent({
      side: "buy",
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: "CRWV261106P00085000", side: "buy", ratio: 1 }],
        limitPrice: 0.4,
      },
    });
    expect(optionContractLine(buyBack)).toBe("CLOSE 1 CRWV $85 PUT · 6 NOV 26 · limit $0.40 debit");
  });

  it("is undefined for shares", () => {
    const shares: OrderIntent = {
      symbol: "CRWV",
      side: "sell",
      quantity: 1,
      type: "market",
      reason: "x",
    };
    expect(optionContractLine(shares)).toBeUndefined();
  });
});
