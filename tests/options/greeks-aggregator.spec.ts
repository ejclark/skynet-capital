import {
  aggregateGreeks,
  betaWeightDelta,
  type ContractGreeks,
  isRepresentative,
} from "../../src/options/greeks-aggregator.js";

/**
 * Portfolio greeks, tested through what the number claims rather than how it is summed.
 *
 * The invariant these cases exist to pin: an aggregate must never speak for a position it could
 * not measure. A book half-covered by greeks produces arithmetic that is fine and a headline that
 * lies, so the uncovered legs are named and `isRepresentative` refuses the figure.
 */

const NVDA_CALL = "NVDA260918C00180000";
const NVDA_PUT = "NVDA260918P00170000";
const KO_CALL = "KO260918C00070000";

const greeks: Record<string, ContractGreeks> = {
  [NVDA_CALL]: { delta: 0.5, gamma: 0.01, theta: -0.2, vega: 0.3 },
  [NVDA_PUT]: { delta: -0.4, gamma: 0.02, theta: -0.1, vega: 0.25 },
  [KO_CALL]: { delta: 0.6, gamma: 0.005, theta: -0.05, vega: 0.1 },
};
const lookup = (s: string): ContractGreeks | undefined => greeks[s];

describe("portfolio greeks — the arithmetic", () => {
  it("scales an option leg by its contract multiplier", () => {
    const agg = aggregateGreeks([{ symbol: NVDA_CALL, quantity: 2 }], lookup);
    expect(agg.delta).toBeCloseTo(100, 9); // 2 contracts × 100 × 0.5
    expect(agg.gamma).toBeCloseTo(2, 9);
    expect(agg.vega).toBeCloseTo(60, 9);
  });

  it("carries a short leg negative, so an offsetting book nets toward flat", () => {
    const agg = aggregateGreeks(
      [
        { symbol: NVDA_CALL, quantity: 1 },
        { symbol: NVDA_CALL, quantity: -1 },
      ],
      lookup,
    );
    expect(agg.delta).toBeCloseTo(0, 9);
    expect(agg.covered).toBe(2);
  });

  it("counts stock as one delta per share and no other greek", () => {
    const agg = aggregateGreeks([{ symbol: "NVDA", quantity: 300 }], lookup);
    expect(agg.delta).toBeCloseTo(300, 9);
    expect(agg.gamma).toBe(0);
    expect(agg.vega).toBe(0);
  });

  it("nets a covered call's stock against its short call", () => {
    // 100 shares (+100 delta) against one short 0.5-delta call (−50) = +50 net.
    const agg = aggregateGreeks(
      [
        { symbol: "NVDA", quantity: 100 },
        { symbol: NVDA_CALL, quantity: -1 },
      ],
      lookup,
    );
    expect(agg.delta).toBeCloseTo(50, 9);
  });

  it("ignores a zero-quantity holding rather than counting it as covered", () => {
    const agg = aggregateGreeks([{ symbol: NVDA_CALL, quantity: 0 }], lookup);
    expect(agg.total).toBe(0);
    expect(agg.covered).toBe(0);
  });
});

describe("portfolio greeks — beta weighting to SPY", () => {
  const betas = (u: string) =>
    ({ NVDA: { beta: 2, asOf: "2026-09-29" }, KO: { beta: 0.5, asOf: "2026-09-29" } })[u];
  const prices = (u: string): number | undefined => ({ NVDA: 180, KO: 70 })[u];
  const book = aggregateGreeks(
    [
      { symbol: NVDA_CALL, quantity: 1 },
      { symbol: KO_CALL, quantity: 1 },
    ],
    lookup,
  );

  it("keeps the raw delta raw and each underlying's delta apart", () => {
    expect(book.delta).toBeCloseTo(110, 9); // 50 + 60 share-equivalents
    expect(book.deltaByUnderlying).toEqual({ NVDA: 50, KO: 60 });
  });

  it("re-expresses delta as SPY shares with the price ratio, so unlike names become additive", () => {
    // NVDA: 50 × 2 × $180 = $18,000. KO: 60 × 0.5 × $70 = $2,100. $20,100 ÷ $600 = 33.5 SPY.
    const w = betaWeightDelta(book.deltaByUnderlying, betas, prices, "SPY", 600);
    expect(w?.dollarDelta).toBeCloseTo(20_100, 9);
    expect(w?.delta).toBeCloseTo(33.5, 9);
    expect(w?.benchmark).toBe("SPY");
    expect(Object.keys(w?.weighted ?? {})).toEqual(["NVDA", "KO"]);
  });

  it("nets a covered call's stock against its short call before weighting", () => {
    const covered = aggregateGreeks(
      [
        { symbol: "NVDA", quantity: 100 },
        { symbol: NVDA_CALL, quantity: -1 },
      ],
      lookup,
    );
    const w = betaWeightDelta(covered.deltaByUnderlying, betas, prices, "SPY", 600);
    expect(w?.dollarDelta).toBeCloseTo(50 * 2 * 180, 9);
  });

  it("leaves a name with no measured beta out of the sum and names it, never assuming 1.0", () => {
    const w = betaWeightDelta(
      book.deltaByUnderlying,
      (u) => (u === "NVDA" ? { beta: 2, asOf: "2026-09-29" } : undefined),
      prices,
      "SPY",
      600,
    );
    expect(w?.dollarDelta).toBeCloseTo(18_000, 9);
    expect(w?.unweighted).toEqual({ KO: 60 });
  });

  it("leaves a name with no price un-weighted too — a beta alone can't be turned into dollars", () => {
    const w = betaWeightDelta(
      book.deltaByUnderlying,
      betas,
      (u) => (u === "KO" ? 70 : undefined),
      "SPY",
      600,
    );
    expect(w?.unweighted).toEqual({ NVDA: 50 });
  });

  it("weights nothing when the benchmark has no price", () => {
    expect(
      betaWeightDelta(book.deltaByUnderlying, betas, prices, "SPY", undefined),
    ).toBeUndefined();
    expect(betaWeightDelta(book.deltaByUnderlying, betas, prices, "SPY", 0)).toBeUndefined();
  });

  it("weights DELTA only — gamma, theta and vega are untouched by it", () => {
    const raw = aggregateGreeks([{ symbol: NVDA_CALL, quantity: 1 }], lookup);
    expect(raw.gamma).toBeCloseTo(1, 9);
    expect(raw.theta).toBeCloseTo(-20, 9);
  });
});

describe("portfolio greeks — what it refuses to claim", () => {
  it("names a position it could not measure instead of scoring it zero", () => {
    const agg = aggregateGreeks(
      [
        { symbol: NVDA_CALL, quantity: 1 },
        { symbol: "AAPL260918C00250000", quantity: 5 },
      ],
      lookup,
    );
    expect(agg.uncovered).toEqual(["AAPL260918C00250000"]);
    expect(agg.covered).toBe(1);
    expect(agg.total).toBe(2);
    // The measured leg is still summed honestly — absence is reported, not propagated.
    expect(agg.delta).toBeCloseTo(50, 9);
  });

  it("refuses to call a partially-covered book representative", () => {
    const partial = aggregateGreeks(
      [
        { symbol: NVDA_CALL, quantity: 1 },
        { symbol: "AAPL260918C00250000", quantity: 5 },
      ],
      lookup,
    );
    expect(isRepresentative(partial)).toBe(false);
  });

  it("refuses an empty book — nothing measured is not the same as flat", () => {
    expect(isRepresentative(aggregateGreeks([], lookup))).toBe(false);
  });

  it("accepts a fully-covered book", () => {
    expect(isRepresentative(aggregateGreeks([{ symbol: NVDA_PUT, quantity: 3 }], lookup))).toBe(
      true,
    );
  });

  it("treats a non-finite greek as zero rather than poisoning the whole aggregate", () => {
    const agg = aggregateGreeks([{ symbol: "X260918C00100000", quantity: 1 }], () => ({
      delta: Number.NaN,
      gamma: 0.01,
    }));
    expect(agg.delta).toBe(0);
    expect(agg.gamma).toBeCloseTo(1, 9);
    expect(Number.isNaN(agg.delta)).toBe(false);
  });
});
