import { priceOption } from "../../src/options/pricing.js";
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

  describe("a contract the feed quoted no greeks for (#5960)", () => {
    // Sauron's CRWV $80 short put, marked at $5.50 a share: no snapshot came back for it.
    const shortPut = { symbol: "CRWV261106P00080000", quantity: -1, marketValue: -550 };
    const spots = new Map([["CRWV", 82]]);

    it("estimates θ and Δ from the vol that reproduces its own mark, kept out of the book", () => {
      const view = optionPositionsView([shortPut], new Map(), spots, NOW);
      const [row] = view.rows;
      expect(row?.positionGreeks).toBeUndefined(); // never dressed as a quote
      expect(row?.noEstimate).toBeUndefined();
      expect(row?.estimate?.volatilityFrom).toBe("mark");
      const vol = row?.estimate?.volatility ?? 0;
      const repriced = priceOption({
        spot: 82,
        strike: 80,
        daysToExpiry: row?.daysToExpiry ?? 0,
        volatility: vol,
        type: "put",
      });
      expect(repriced?.price).toBeCloseTo(5.5, 6); // the vol is the one the mark implies
      // Written: time pays it and a rise in CRWV helps it, so both are positive.
      expect(row?.estimate?.positionGreeks.theta).toBeGreaterThan(0);
      expect(row?.estimate?.positionGreeks.delta).toBeGreaterThan(0);
      expect(row?.estimate?.positionGreeks.delta).toBeCloseTo(-(repriced?.delta ?? 0) * 100, 2);
      expect(view.book.uncovered).toEqual([shortPut.symbol]);
      expect(view.representative).toBe(false);
    });

    it("prefers the feed's implied vol when it sent one without greeks", () => {
      const view = optionPositionsView(
        [shortPut],
        new Map([[shortPut.symbol, { impliedVol: 0.9 }]]),
        spots,
        NOW,
      );
      expect(view.rows[0]?.estimate).toMatchObject({ volatility: 0.9, volatilityFrom: "feed" });
    });

    it("says the stock's price was missing rather than estimating without it", () => {
      const view = optionPositionsView([shortPut], new Map(), new Map(), NOW);
      expect(view.rows[0]?.estimate).toBeUndefined();
      expect(view.rows[0]?.noEstimate).toBe("no-spot");
    });

    it("says the volatility was missing when the mark implies none", () => {
      // A $0 mark solves to no volatility: there is nothing honest to price with.
      const view = optionPositionsView([{ ...shortPut, marketValue: 0 }], new Map(), spots, NOW);
      expect(view.rows[0]?.noEstimate).toBe("no-volatility");
    });

    it("never estimates over a quote", () => {
      const view = optionPositionsView(
        [shortPut],
        new Map([[shortPut.symbol, { greeks: { delta: -0.3, theta: -0.1 } }]]),
        spots,
        NOW,
      );
      expect(view.rows[0]?.positionGreeks).toEqual({ delta: 30, theta: 10 });
      expect(view.rows[0]?.estimate).toBeUndefined();
      expect(view.rows[0]?.noEstimate).toBeUndefined();
    });
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
