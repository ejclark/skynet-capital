import {
  computeEquity,
  heldQuantity,
  positionFor,
  positionValue,
} from "../../src/domain/portfolio.js";
import { aPortfolio, aPosition, aQuote } from "../support/builders.js";

describe("positionFor", () => {
  it("finds the holding matching the symbol", () => {
    const spy = aPosition({ symbol: "SPY", quantity: 10, avgPrice: 400 });
    const portfolio = aPortfolio({ positions: [spy, aPosition({ symbol: "QQQ" })] });

    expect(positionFor(portfolio, "SPY")).toEqual(spy);
  });

  it("returns undefined when the persona is flat on that symbol", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "QQQ" })] });

    expect(positionFor(portfolio, "SPY")).toBeUndefined();
  });

  it("returns undefined for an empty portfolio", () => {
    const portfolio = aPortfolio({ positions: [] });

    expect(positionFor(portfolio, "SPY")).toBeUndefined();
  });
});

describe("heldQuantity", () => {
  it("reports the quantity of an existing long position", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "SPY", quantity: 25 })] });

    expect(heldQuantity(portfolio, "SPY")).toBe(25);
  });

  it("reports a negative quantity for a short position", () => {
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "SPY", quantity: -50 })] });

    expect(heldQuantity(portfolio, "SPY")).toBe(-50);
  });

  it("is 0 when flat on a symbol", () => {
    const portfolio = aPortfolio({ positions: [] });

    expect(heldQuantity(portfolio, "SPY")).toBe(0);
  });
});

describe("computeEquity", () => {
  it("is just cash when there are no positions", () => {
    const portfolio = aPortfolio({ cash: 10_000, positions: [] });

    expect(computeEquity(portfolio, {})).toBe(10_000);
  });

  it("marks a long position to the live quote", () => {
    const portfolio = aPortfolio({
      cash: 1_000,
      positions: [aPosition({ symbol: "SPY", quantity: 10, avgPrice: 400 })],
    });
    const quotes = { SPY: aQuote({ symbol: "SPY", last: 450 }) };

    // 1,000 cash + 10 shares * $450 mark
    expect(computeEquity(portfolio, quotes)).toBe(1_000 + 10 * 450);
  });

  it("falls back to the position's average price when no live quote exists", () => {
    const portfolio = aPortfolio({
      cash: 1_000,
      positions: [aPosition({ symbol: "SPY", quantity: 10, avgPrice: 400 })],
    });

    expect(computeEquity(portfolio, {})).toBe(1_000 + 10 * 400);
  });

  it("subtracts value for a short position marked against a live quote", () => {
    const portfolio = aPortfolio({
      cash: 50_000,
      positions: [aPosition({ symbol: "SPY", quantity: -10, avgPrice: 400 })],
    });
    const quotes = { SPY: aQuote({ symbol: "SPY", last: 450 }) };

    // short 10 shares that rallied to $450 costs equity, even though avg entry was $400
    expect(computeEquity(portfolio, quotes)).toBe(50_000 - 10 * 450);
  });

  it("treats a zero-quantity position as contributing nothing regardless of price", () => {
    const portfolio = aPortfolio({
      cash: 1_000,
      positions: [aPosition({ symbol: "SPY", quantity: 0, avgPrice: 400 })],
    });
    const quotes = { SPY: aQuote({ symbol: "SPY", last: 999 }) };

    expect(computeEquity(portfolio, quotes)).toBe(1_000);
  });

  it("sums equity across multiple positions, mixing quoted and unquoted marks", () => {
    const portfolio = aPortfolio({
      cash: 2_000,
      positions: [
        aPosition({ symbol: "SPY", quantity: 5, avgPrice: 400 }),
        aPosition({ symbol: "QQQ", quantity: 3, avgPrice: 350 }),
      ],
    });
    const quotes = { SPY: aQuote({ symbol: "SPY", last: 420 }) };

    // SPY marked live at 420, QQQ falls back to its 350 avg price
    expect(computeEquity(portfolio, quotes)).toBe(2_000 + 5 * 420 + 3 * 350);
  });

  it("ignores quotes for symbols not held in the portfolio", () => {
    const portfolio = aPortfolio({ cash: 500, positions: [] });
    const quotes = { TSLA: aQuote({ symbol: "TSLA", last: 250 }) };

    expect(computeEquity(portfolio, quotes)).toBe(500);
  });
});

describe("option contracts count at 100 shares (#4643)", () => {
  const call = "NVDA261113C00240000";

  it("marks a quoted contract at last × 100 per contract", () => {
    const portfolio = aPortfolio({
      cash: 1_000,
      positions: [aPosition({ symbol: call, quantity: 2, avgPrice: 4.5 })],
    });
    const quotes = { [call]: aQuote({ symbol: call, last: 5 }) };

    // 1,000 cash + 2 contracts × $5.00/share × 100 shares
    expect(computeEquity(portfolio, quotes)).toBe(1_000 + 2 * 5 * 100);
  });

  it("prefers the broker's market value over cost when the contract is unquoted", () => {
    const position = aPosition({ symbol: call, quantity: 1, avgPrice: 4.5, marketValue: 520 });

    expect(positionValue(position, undefined)).toBe(520);
  });

  it("falls back to cost × 100 when there is neither a quote nor a market value", () => {
    const position = aPosition({ symbol: call, quantity: 1, avgPrice: 4.5 });

    expect(positionValue(position, undefined)).toBe(450);
  });

  it("a written (short) contract is a liability of 100 shares per contract", () => {
    const put = "CRWV261106P00076000";
    const position = aPosition({ symbol: put, quantity: -1, avgPrice: 2.31 });

    expect(positionValue(position, 1.5)).toBe(-150);
  });

  it("leaves shares exactly as they were — no multiplier, quote first, then cost", () => {
    const shares = aPosition({ symbol: "NVDA", quantity: 10, avgPrice: 200 });

    expect(positionValue(shares, 210)).toBe(2_100);
    expect(positionValue(shares, undefined)).toBe(2_000);
  });
});
