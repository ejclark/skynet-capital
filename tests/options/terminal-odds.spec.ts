import {
  probabilityAbove,
  probabilityBelow,
  probabilityOfTouch,
  type TerminalProbabilityInput,
  terminalCdf,
  terminalTerms,
} from "../../src/options/terminal-odds.js";

/**
 * Reference probabilities are Φ evaluated with a double-precision `erfc` — an independent
 * algorithm from the module's Abramowitz–Stegun Φ (|error| ≲ 7.5e-8 absolute), so 6 decimals is
 * the honest bar. The touch identity and the complement identity hold exactly by construction.
 */

/** One year out, 20% vol, zero rate — the case whose d₂ is exactly −0.1. */
const ONE_YEAR: TerminalProbabilityInput = {
  spot: 100,
  target: 100,
  daysForward: 365,
  volatility: 0.2,
  rate: 0,
};
/** r = σ²/2 makes the log-drift exactly zero, where P(touch) = 2 × P(finish beyond). */
const DRIFTLESS = { spot: 100, daysForward: 365, volatility: 0.2, rate: 0.02 } as const;

describe("probabilityBelow / probabilityAbove", () => {
  it("puts a one-year at-the-money finish at Φ(−0.1) above", () => {
    expect(probabilityAbove(ONE_YEAR)).toBeCloseTo(0.460172162723, 6);
    expect(probabilityBelow(ONE_YEAR)).toBeCloseTo(0.539827837277, 6);
  });

  it("keeps above and below exact complements at every target", () => {
    for (const target of [40, 80, 100, 130, 400]) {
      const above = probabilityAbove({ ...ONE_YEAR, target }) ?? 0;
      const below = probabilityBelow({ ...ONE_YEAR, target }) ?? 0;
      expect(above + below).toBe(1);
    }
  });

  it("falls monotonically as the target rises", () => {
    let previous = 1;
    for (const target of [60, 90, 100, 115, 160]) {
      const above = probabilityAbove({ ...ONE_YEAR, target }) ?? 0;
      expect(above).toBeLessThan(previous);
      previous = above;
    }
  });

  it("stays inside [0,1] out to the far tails", () => {
    for (const target of [0.01, 1, 100, 5000, 1e6]) {
      const above = probabilityAbove({ ...ONE_YEAR, target }) ?? -1;
      expect(above).toBeGreaterThanOrEqual(0);
      expect(above).toBeLessThanOrEqual(1);
    }
  });
});

describe("terminalTerms / terminalCdf", () => {
  it("annualizes on the calendar and carries the risk-neutral log-drift", () => {
    const terms = terminalTerms(100, 365, 0.2, 0.05);
    expect(terms?.years).toBe(1);
    expect(terms?.sigmaRootT).toBeCloseTo(0.2, 12);
    expect(terms?.driftT).toBeCloseTo(0.05 - 0.02, 12);
  });

  it("agrees with probabilityBelow on the same distribution", () => {
    const terms = terminalTerms(100, 365, 0.2, 0);
    if (!terms) throw new Error("expected terms");
    expect(terminalCdf(100, terms, 100)).toBeCloseTo(probabilityBelow(ONE_YEAR) ?? 0, 12);
  });

  it("declines a distribution it cannot describe", () => {
    expect(terminalTerms(0, 30, 0.2, 0)).toBeUndefined();
    expect(terminalTerms(100, -1, 0.2, 0)).toBeUndefined();
    expect(terminalTerms(100, 30, -0.2, 0)).toBeUndefined();
    expect(terminalTerms(100, 30, 0.2, Number.NaN)).toBeUndefined();
  });
});

describe("probabilityOfTouch", () => {
  it("is exactly twice the finish probability when the log-drift is zero", () => {
    const target = 110;
    const touch = probabilityOfTouch({ ...DRIFTLESS, target }) ?? 0;
    const finish = probabilityAbove({ ...DRIFTLESS, target }) ?? 0;
    expect(touch).toBeCloseTo(0.633681954638, 6);
    expect(touch).toBeCloseTo(2 * finish, 9);
  });

  it("mirrors for a barrier below the spot", () => {
    const touch = probabilityOfTouch({ ...DRIFTLESS, target: 90 }) ?? 0;
    const finish = probabilityBelow({ ...DRIFTLESS, target: 90 }) ?? 0;
    expect(touch).toBeCloseTo(2 * finish, 9);
  });

  it("always beats the odds of finishing there — touching is what assigns you", () => {
    for (const target of [85, 95, 105, 120]) {
      const input = { spot: 100, target, daysForward: 45, volatility: 0.3, rate: 0.04 };
      const touch = probabilityOfTouch(input) ?? 0;
      const finish = target > 100 ? (probabilityAbove(input) ?? 0) : (probabilityBelow(input) ?? 0);
      expect(touch).toBeGreaterThan(finish);
      expect(touch).toBeLessThanOrEqual(1);
    }
  });

  it("is a certainty when the barrier is where the underlying already is", () => {
    expect(probabilityOfTouch({ ...DRIFTLESS, target: 100 })).toBe(1);
  });

  it("underflows a far barrier to zero instead of NaN", () => {
    expect(probabilityOfTouch({ spot: 100, target: 1e6, daysForward: 1, volatility: 0.1 })).toBe(0);
  });
});

describe("degenerate inputs return defined boundary values, never NaN", () => {
  it("collapses the terminal odds onto the forward when volatility is zero", () => {
    const still = { spot: 100, daysForward: 365, volatility: 0, rate: 0.05 };
    expect(probabilityAbove({ ...still, target: 90 })).toBe(1);
    expect(probabilityAbove({ ...still, target: 200 })).toBe(0);
    expect(probabilityBelow({ ...still, target: 200 })).toBe(1);
  });

  it("collapses onto the spot itself when the horizon is today", () => {
    const now = { spot: 100, daysForward: 0, volatility: 0.4, rate: 0.05 };
    expect(probabilityAbove({ ...now, target: 99 })).toBe(1);
    expect(probabilityAbove({ ...now, target: 101 })).toBe(0);
  });

  it("touches only what a zero-volatility path actually sweeps through", () => {
    const still = { spot: 100, daysForward: 365, volatility: 0, rate: 0.05 };
    expect(probabilityOfTouch({ ...still, target: 103 })).toBe(1);
    expect(probabilityOfTouch({ ...still, target: 110 })).toBe(0);
    expect(probabilityOfTouch({ ...still, target: 95 })).toBe(0);
  });

  it("never returns NaN across the degenerate corners", () => {
    for (const volatility of [0, 1e-14, 0.25]) {
      for (const daysForward of [0, 1e-9, 30]) {
        for (const target of [1, 100, 400]) {
          const input = { spot: 100, daysForward, volatility, rate: 0.05, target };
          expect(Number.isNaN(probabilityAbove(input) ?? 0)).toBe(false);
          expect(Number.isNaN(probabilityOfTouch(input) ?? 0)).toBe(false);
        }
      }
    }
  });
});

describe("unusable inputs render as ABSENT, never as a zero probability", () => {
  it("declines a distribution it cannot describe", () => {
    expect(probabilityAbove({ ...ONE_YEAR, spot: 0 })).toBeUndefined();
    expect(probabilityAbove({ ...ONE_YEAR, target: 0 })).toBeUndefined();
    expect(probabilityAbove({ ...ONE_YEAR, target: Number.NaN })).toBeUndefined();
    expect(probabilityBelow({ ...ONE_YEAR, volatility: -0.2 })).toBeUndefined();
    expect(probabilityBelow({ ...ONE_YEAR, daysForward: -1 })).toBeUndefined();
    expect(probabilityOfTouch({ ...ONE_YEAR, rate: Number.NaN })).toBeUndefined();
    expect(
      probabilityAbove({ ...ONE_YEAR, daysForward: Number.POSITIVE_INFINITY }),
    ).toBeUndefined();
  });

  it("defaults the risk-free rate to zero when it is omitted", () => {
    const omitted = probabilityAbove({ spot: 100, target: 105, daysForward: 30, volatility: 0.3 });
    const explicit = probabilityAbove({
      spot: 100,
      target: 105,
      daysForward: 30,
      volatility: 0.3,
      rate: 0,
    });
    expect(omitted).toBe(explicit);
  });
});
