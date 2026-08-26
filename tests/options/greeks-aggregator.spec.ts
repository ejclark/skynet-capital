import {
  aggregateGreeks,
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

describe("portfolio greeks — beta weighting", () => {
  const betas = (u: string): number | undefined => ({ NVDA: 2, KO: 0.5 })[u];

  it("re-expresses delta against the benchmark so unlike underlyings become additive", () => {
    // NVDA call: 100 × 0.5 × 2 = 100. KO call: 100 × 0.6 × 0.5 = 30.
    const agg = aggregateGreeks(
      [
        { symbol: NVDA_CALL, quantity: 1 },
        { symbol: KO_CALL, quantity: 1 },
      ],
      lookup,
      betas,
      "SPY",
    );
    expect(agg.delta).toBeCloseTo(130, 9);
    expect(agg.weightedTo).toBe("SPY");
  });

  it("weights DELTA only — a beta-scaled gamma would look additive and mean nothing", () => {
    const raw = aggregateGreeks([{ symbol: NVDA_CALL, quantity: 1 }], lookup);
    const weighted = aggregateGreeks([{ symbol: NVDA_CALL, quantity: 1 }], lookup, betas, "SPY");
    expect(weighted.delta).toBeCloseTo(raw.delta * 2, 9);
    expect(weighted.gamma).toBeCloseTo(raw.gamma, 9);
    expect(weighted.theta).toBeCloseTo(raw.theta, 9);
    expect(weighted.vega).toBeCloseTo(raw.vega, 9);
  });

  it("leaves an underlying with no beta unweighted rather than assuming 1.0 silently", () => {
    const agg = aggregateGreeks([{ symbol: KO_CALL, quantity: 1 }], lookup, () => undefined, "SPY");
    expect(agg.delta).toBeCloseTo(60, 9); // raw, unscaled
    expect(agg.weightedTo).toBeUndefined(); // and it does not claim to be benchmarked
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
