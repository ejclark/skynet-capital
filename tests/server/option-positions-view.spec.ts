import { optionPositionsView } from "../../src/server/option-positions-view.js";

/**
 * Option positions as data (#3407 P2 slice 3): OCC parsed into strike / expiry / days, in-the-
 * money against the underlying's spot, per-position greeks scaled to the signed holding, and a
 * book that names every contract it could not cover instead of counting it as zero.
 */

const NOW = new Date("2026-09-21T14:00:00Z");
const longPut = { symbol: "MSFT260918P00420000", quantity: 2, marketValue: 2_400 };
const shortCall = { symbol: "AAPL261218C00150000", quantity: -1, marketValue: -250 };
const shares = { symbol: "AAPL", quantity: 100, marketValue: 15_000 };

describe("optionPositionsView", () => {
  it("parses each contract, computes days and in-the-money, and scales greeks to the holding", () => {
    const view = optionPositionsView(
      [longPut, shortCall, shares],
      new Map([
        [
          "MSFT260918P00420000",
          { greeks: { delta: -0.42, theta: -0.19 }, impliedVol: 0.31, bid: 11, ask: 11.4 },
        ],
        ["AAPL261218C00150000", { greeks: { delta: 0.55, gamma: 0.02, theta: -0.05, vega: 0.1 } }],
      ]),
      new Map([
        ["MSFT", 428.6],
        ["AAPL", 145],
      ]),
      NOW,
    );
    expect(view.rows).toHaveLength(2); // shares are not option positions
    const [put, call] = view.rows;
    expect(put).toMatchObject({
      underlying: "MSFT",
      type: "put",
      strike: 420,
      expiration: "2026-09-18",
      contracts: 2,
      inTheMoney: false, // spot 428.6 above a 420 put
      spot: 428.6,
      impliedVol: 0.31,
      bid: 11,
      ask: 11.4,
    });
    expect(put?.daysToExpiry).toBe(0.01); // already expired on the clock — floored, never negative
    expect(put?.positionGreeks).toEqual({ delta: -84, theta: -38 }); // × 2 contracts × 100
    expect(call).toMatchObject({ inTheMoney: false, contracts: -1 }); // 145 < 150 call
    expect(call?.positionGreeks).toEqual({ delta: -55, gamma: -2, theta: 5, vega: -10 });
    expect(call?.daysToExpiry).toBeCloseTo(88.25, 1);
    expect(view.representative).toBe(true);
    expect(view.book).toMatchObject({ covered: 2, total: 2, uncovered: [] });
    expect(view.book.delta).toBeCloseTo(-84 - 55);
  });

  it("names a contract the feed didn't quote and marks the book unrepresentative", () => {
    const view = optionPositionsView(
      [longPut, shortCall],
      new Map([["MSFT260918P00420000", { greeks: { delta: -0.42 } }]]),
      new Map(),
      NOW,
    );
    expect(view.rows[1]?.positionGreeks).toBeUndefined();
    expect(view.rows[1]?.inTheMoney).toBeUndefined(); // no spot, no claim
    expect(view.representative).toBe(false);
    expect(view.book.uncovered).toEqual(["AAPL261218C00150000"]);
  });

  it("skips a zero-quantity row and a non-option symbol", () => {
    const view = optionPositionsView(
      [{ ...longPut, quantity: 0 }, shares],
      new Map(),
      new Map(),
      NOW,
    );
    expect(view.rows).toEqual([]);
    expect(view.book.total).toBe(0);
  });
});
