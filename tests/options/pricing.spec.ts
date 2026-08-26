import {
  type ImpliedVolInput,
  impliedVolatility,
  type OptionGreeks,
  type OptionPricingInput,
  type OptionValuation,
  priceOption,
  standardNormalCdf,
} from "../../src/options/pricing.js";

/**
 * Reference premiums come from the exact Black–Scholes formula (double-precision `erf`), so
 * prices are asserted to 4 decimals: Φ here is the Abramowitz–Stegun approximation, good to
 * ~7.5e-8 absolute, which lands a premium within ~1e-5 of the true value. Greeks built on φ
 * (gamma, vega) are analytic and hold to far more places.
 */

/** Hull, _Options, Futures and Other Derivatives_ — the worked European call/put example. */
const HULL = { spot: 42, strike: 40, daysToExpiry: 182.5, volatility: 0.2, rate: 0.1 } as const;
/** A round at-the-money 30-day contract — the shape most of the app will actually price. */
const ATM = { spot: 100, strike: 100, daysToExpiry: 30, volatility: 0.25, rate: 0.05 } as const;

function valuationOf(input: OptionPricingInput): OptionValuation {
  const valuation = priceOption(input);
  if (!valuation) throw new Error(`expected a valuation for ${JSON.stringify(input)}`);
  return valuation;
}

function everyGreekIsFinite(greeks: OptionGreeks): boolean {
  return [greeks.delta, greeks.gamma, greeks.theta, greeks.vega, greeks.rho].every((value) =>
    Number.isFinite(value),
  );
}

/** Price a contract, then ask the solver to recover the volatility we priced it at. */
function recoveredVolatility(contract: OptionPricingInput): number | undefined {
  const request: ImpliedVolInput = {
    spot: contract.spot,
    strike: contract.strike,
    daysToExpiry: contract.daysToExpiry,
    rate: contract.rate,
    type: contract.type,
    marketPrice: valuationOf(contract).price,
  };
  return impliedVolatility(request);
}

describe("priceOption — textbook anchors", () => {
  it("matches Hull's worked call: S=42, K=40, T=0.5y, r=10%, sigma=20%", () => {
    const call = valuationOf({ ...HULL, type: "call" });
    expect(call.price).toBeCloseTo(4.759422, 4);
    expect(call.delta).toBeCloseTo(0.779131, 6);
    expect(call.gamma).toBeCloseTo(0.049963, 6);
    expect(call.vega).toBeCloseTo(0.088134, 6);
    expect(call.theta).toBeCloseTo(-0.012491, 6);
    expect(call.rho).toBeCloseTo(0.13982, 6);
  });

  it("matches Hull's worked put on the same contract", () => {
    const put = valuationOf({ ...HULL, type: "put" });
    expect(put.price).toBeCloseTo(0.808599, 4);
    expect(put.delta).toBeCloseTo(-0.220869, 6);
    expect(put.gamma).toBeCloseTo(0.049963, 6);
    expect(put.vega).toBeCloseTo(0.088134, 6);
    expect(put.theta).toBeCloseTo(-0.002066, 6);
    expect(put.rho).toBeCloseTo(-0.050425, 6);
  });

  it("prices a 30-day at-the-money pair", () => {
    const call = valuationOf({ ...ATM, type: "call" });
    const put = valuationOf({ ...ATM, type: "put" });
    expect(call.price).toBeCloseTo(3.0626, 4);
    expect(put.price).toBeCloseTo(2.652485, 4);
    expect(call.delta).toBeCloseTo(0.537118, 6);
    expect(put.delta).toBeCloseTo(-0.462882, 6);
    expect(call.gamma).toBeCloseTo(0.055421, 6);
    expect(call.vega).toBeCloseTo(0.113878, 6);
    expect(call.theta).toBeCloseTo(-0.054387, 6);
    expect(put.theta).toBeCloseTo(-0.040745, 6);
  });

  it("defaults the risk-free rate to zero when it is omitted", () => {
    const withoutRate = valuationOf({ ...ATM, rate: undefined, type: "call" });
    const withZeroRate = valuationOf({ ...ATM, rate: 0, type: "call" });
    expect(withoutRate.price).toBe(withZeroRate.price);
  });
});

describe("priceOption — put–call parity", () => {
  it("holds across strikes: call − put === S − K·e^(−rT)", () => {
    for (const strike of [80, 95, 100, 110, 140]) {
      const shared = { spot: 100, strike, daysToExpiry: 90, volatility: 0.28, rate: 0.045 };
      const call = valuationOf({ ...shared, type: "call" });
      const put = valuationOf({ ...shared, type: "put" });
      const forwardGap = 100 - strike * Math.exp(-0.045 * (90 / 365));
      expect(call.price - put.price).toBeCloseTo(forwardGap, 9);
    }
  });

  it("holds on the at-the-money anchor", () => {
    const call = valuationOf({ ...ATM, type: "call" });
    const put = valuationOf({ ...ATM, type: "put" });
    expect(call.price - put.price).toBeCloseTo(0.4101156236, 9);
  });
});

describe("priceOption — Greek shape", () => {
  it("shares gamma and vega between a call and a put on the same contract", () => {
    const call = valuationOf({ ...ATM, type: "call" });
    const put = valuationOf({ ...ATM, type: "put" });
    expect(call.gamma).toBe(put.gamma);
    expect(call.vega).toBe(put.vega);
  });

  it("keeps call delta inside (0,1) and put delta inside (−1,0)", () => {
    for (const strike of [70, 100, 130]) {
      const shared = { spot: 100, strike, daysToExpiry: 45, volatility: 0.3, rate: 0.04 };
      const call = valuationOf({ ...shared, type: "call" });
      const put = valuationOf({ ...shared, type: "put" });
      expect(call.delta).toBeGreaterThan(0);
      expect(call.delta).toBeLessThan(1);
      expect(put.delta).toBeGreaterThan(-1);
      expect(put.delta).toBeLessThan(0);
    }
  });

  it("decays both a long call and a long put (theta is negative)", () => {
    expect(valuationOf({ ...ATM, type: "call" }).theta).toBeLessThan(0);
    expect(valuationOf({ ...ATM, type: "put" }).theta).toBeLessThan(0);
  });

  it("drives call delta to 1 deep in the money and to 0 deep out of it", () => {
    const deepItm = valuationOf({
      spot: 300,
      strike: 100,
      daysToExpiry: 30,
      volatility: 0.3,
      rate: 0.05,
      type: "call",
    });
    const deepOtm = valuationOf({
      spot: 50,
      strike: 300,
      daysToExpiry: 30,
      volatility: 0.3,
      rate: 0.05,
      type: "call",
    });
    expect(deepItm.delta).toBeCloseTo(1, 6);
    expect(deepOtm.delta).toBeCloseTo(0, 6);
  });
});

describe("priceOption — intrinsic and extrinsic", () => {
  it("splits an in-the-money call into intrinsic plus time value", () => {
    const call = valuationOf({
      spot: 110,
      strike: 100,
      daysToExpiry: 60,
      volatility: 0.3,
      rate: 0.05,
      type: "call",
    });
    expect(call.intrinsic).toBe(10);
    expect(call.intrinsic + call.extrinsic).toBeCloseTo(call.price, 9);
    expect(call.extrinsic).toBeGreaterThan(0);
  });

  it("never reports negative time value, even when discounting puts price below intrinsic", () => {
    // A deep in-the-money European put is worth less than intrinsic because exercise is deferred.
    const put = valuationOf({
      spot: 90,
      strike: 100,
      daysToExpiry: 30,
      volatility: 0,
      rate: 0.05,
      type: "put",
    });
    expect(put.price).toBeLessThan(put.intrinsic);
    expect(put.extrinsic).toBe(0);
  });
});

describe("priceOption — degenerate but valid inputs", () => {
  it("prices an expiring contract at intrinsic with no time value left", () => {
    const call = valuationOf({
      spot: 105,
      strike: 100,
      daysToExpiry: 0,
      volatility: 0.3,
      rate: 0.05,
      type: "call",
    });
    expect(call.price).toBe(5);
    expect(call.extrinsic).toBe(0);
    expect(call.delta).toBe(1);
    expect(call.gamma).toBe(0);
    expect(call.theta).toBe(0);
    expect(call.vega).toBe(0);
    expect(call.rho).toBe(0);
    expect(everyGreekIsFinite(call)).toBe(true);
  });

  it("gives an expiring out-of-the-money contract zero value and zero delta", () => {
    const put = valuationOf({
      spot: 105,
      strike: 100,
      daysToExpiry: 0,
      volatility: 0.3,
      rate: 0.05,
      type: "put",
    });
    expect(put.price).toBe(0);
    expect(put.delta).toBe(0);
    expect(everyGreekIsFinite(put)).toBe(true);
  });

  it("treats an exactly at-the-money expiry as delta zero rather than guessing a side", () => {
    const call = valuationOf({
      spot: 100,
      strike: 100,
      daysToExpiry: 0,
      volatility: 0.3,
      rate: 0.05,
      type: "call",
    });
    expect(call.price).toBe(0);
    expect(call.delta).toBe(0);
  });

  it("prices a past-expiry contract the same as one expiring right now", () => {
    const shared = { spot: 105, strike: 100, volatility: 0.3, rate: 0.05, type: "call" } as const;
    expect(valuationOf({ ...shared, daysToExpiry: -3 })).toEqual(
      valuationOf({ ...shared, daysToExpiry: 0 }),
    );
  });

  it("takes the zero-volatility limit analytically instead of dividing by zero", () => {
    const call = valuationOf({
      spot: 110,
      strike: 100,
      daysToExpiry: 30,
      volatility: 0,
      rate: 0.05,
      type: "call",
    });
    expect(call.price).toBeCloseTo(110 - 100 * Math.exp(-0.05 * (30 / 365)), 9);
    expect(call.delta).toBe(1);
    expect(call.gamma).toBe(0);
    expect(call.vega).toBe(0);
    expect(everyGreekIsFinite(call)).toBe(true);
  });

  it("makes a zero-volatility out-of-the-money call worthless without producing NaN", () => {
    const call = valuationOf({
      spot: 90,
      strike: 100,
      daysToExpiry: 30,
      volatility: 0,
      rate: 0.05,
      type: "call",
    });
    expect(call.price).toBe(0);
    expect(call.delta).toBe(0);
    expect(everyGreekIsFinite(call)).toBe(true);
  });

  it("treats a vanishingly small sigma·sqrt(T) as the same limit", () => {
    const nearZero = valuationOf({
      spot: 110,
      strike: 100,
      daysToExpiry: 30,
      volatility: 1e-14,
      rate: 0.05,
      type: "call",
    });
    expect(everyGreekIsFinite(nearZero)).toBe(true);
    expect(Number.isFinite(nearZero.price)).toBe(true);
    expect(nearZero.gamma).toBe(0);
  });

  it("collapses a nonsensical negative volatility onto the same zero-volatility limit", () => {
    const shared = { spot: 110, strike: 100, daysToExpiry: 30, rate: 0.05, type: "call" } as const;
    expect(valuationOf({ ...shared, volatility: -0.5 })).toEqual(
      valuationOf({ ...shared, volatility: 0 }),
    );
  });
});

describe("priceOption — inputs that cannot describe a contract", () => {
  it("returns undefined rather than a false zero", () => {
    const base = { daysToExpiry: 30, volatility: 0.25, rate: 0.05, type: "call" } as const;
    expect(priceOption({ ...base, spot: 0, strike: 100 })).toBeUndefined();
    expect(priceOption({ ...base, spot: -5, strike: 100 })).toBeUndefined();
    expect(priceOption({ ...base, spot: 100, strike: 0 })).toBeUndefined();
    expect(priceOption({ ...base, spot: 100, strike: -5 })).toBeUndefined();
    expect(priceOption({ ...base, spot: Number.NaN, strike: 100 })).toBeUndefined();
    expect(priceOption({ ...base, spot: Number.POSITIVE_INFINITY, strike: 100 })).toBeUndefined();
  });

  it("returns undefined for non-finite days, volatility or rate", () => {
    const base = { spot: 100, strike: 100, type: "call" } as const;
    expect(
      priceOption({ ...base, daysToExpiry: Number.NaN, volatility: 0.25, rate: 0 }),
    ).toBeUndefined();
    expect(
      priceOption({ ...base, daysToExpiry: Number.POSITIVE_INFINITY, volatility: 0.25, rate: 0 }),
    ).toBeUndefined();
    expect(
      priceOption({ ...base, daysToExpiry: 30, volatility: Number.NaN, rate: 0 }),
    ).toBeUndefined();
    expect(
      priceOption({ ...base, daysToExpiry: 30, volatility: 0.25, rate: Number.NaN }),
    ).toBeUndefined();
  });
});

describe("impliedVolatility — round trip", () => {
  it("recovers the volatility a contract was priced at", () => {
    const contracts: OptionPricingInput[] = [
      { spot: 100, strike: 100, daysToExpiry: 30, volatility: 0.32, rate: 0.05, type: "call" },
      { spot: 100, strike: 100, daysToExpiry: 30, volatility: 0.32, rate: 0.05, type: "put" },
      { spot: 100, strike: 130, daysToExpiry: 45, volatility: 0.32, rate: 0.04, type: "call" },
      { spot: 250, strike: 200, daysToExpiry: 730, volatility: 0.32, rate: 0.03, type: "call" },
      { spot: 80, strike: 120, daysToExpiry: 60, volatility: 0.32, rate: 0.05, type: "put" },
    ];
    for (const contract of contracts) {
      expect(recoveredVolatility(contract)).toBeCloseTo(0.32, 6);
    }
  });

  it("re-prices at the solved volatility back to the observed premium", () => {
    const contract: OptionPricingInput = {
      spot: 187.5,
      strike: 195,
      daysToExpiry: 21,
      volatility: 0.44,
      rate: 0.042,
      type: "call",
    };
    const quote = valuationOf(contract).price;
    const solved = recoveredVolatility(contract);
    if (solved === undefined) throw new Error("expected the solver to converge");
    expect(valuationOf({ ...contract, volatility: solved }).price).toBeCloseTo(quote, 8);
  });

  it("works with the rate defaulted away", () => {
    const solved = recoveredVolatility({
      spot: 100,
      strike: 105,
      daysToExpiry: 30,
      volatility: 0.28,
      type: "call",
    });
    expect(solved).toBeCloseTo(0.28, 6);
  });
});

describe("impliedVolatility — refusals", () => {
  const base = { spot: 100, strike: 100, daysToExpiry: 30, rate: 0.05, type: "call" } as const;

  it("declines a premium above the no-arbitrage ceiling", () => {
    expect(() => impliedVolatility({ ...base, marketPrice: 120 })).not.toThrow();
    expect(impliedVolatility({ ...base, marketPrice: 120 })).toBeUndefined();
  });

  it("declines a premium below the discounted intrinsic floor", () => {
    const itm = { ...base, strike: 50 };
    expect(() => impliedVolatility({ ...itm, marketPrice: 1 })).not.toThrow();
    expect(impliedVolatility({ ...itm, marketPrice: 1 })).toBeUndefined();
  });

  it("declines a premium that would only pin the 500% volatility ceiling", () => {
    expect(impliedVolatility({ ...base, marketPrice: 99 })).toBeUndefined();
  });

  it("declines a zero, negative or non-finite premium", () => {
    expect(impliedVolatility({ ...base, marketPrice: 0 })).toBeUndefined();
    expect(impliedVolatility({ ...base, marketPrice: -1 })).toBeUndefined();
    expect(impliedVolatility({ ...base, marketPrice: Number.NaN })).toBeUndefined();
    expect(() => impliedVolatility({ ...base, marketPrice: Number.NaN })).not.toThrow();
  });

  it("declines an expired contract — there is no volatility left to imply", () => {
    expect(impliedVolatility({ ...base, daysToExpiry: 0, marketPrice: 3 })).toBeUndefined();
    expect(impliedVolatility({ ...base, daysToExpiry: -2, marketPrice: 3 })).toBeUndefined();
  });

  it("declines unusable spot, strike or rate", () => {
    expect(impliedVolatility({ ...base, spot: 0, marketPrice: 3 })).toBeUndefined();
    expect(impliedVolatility({ ...base, strike: -10, marketPrice: 3 })).toBeUndefined();
    expect(
      impliedVolatility({ ...base, spot: Number.POSITIVE_INFINITY, marketPrice: 3 }),
    ).toBeUndefined();
    expect(impliedVolatility({ ...base, rate: Number.NaN, marketPrice: 3 })).toBeUndefined();
  });
});

describe("standardNormalCdf", () => {
  it("is one half at the mean", () => {
    expect(standardNormalCdf(0)).toBeCloseTo(0.5, 8);
  });

  it("puts ~97.5% below 1.96 — the two-sided 95% z-score", () => {
    // Exact Phi(1.96) is 0.9750021049; the approximation is inside its stated 7.5e-8 band.
    expect(standardNormalCdf(1.96)).toBeCloseTo(0.9750021049, 6);
  });

  it("is symmetric: Phi(x) + Phi(−x) === 1", () => {
    for (const x of [0.25, 1, 1.3, 2.5, 4]) {
      expect(standardNormalCdf(x) + standardNormalCdf(-x)).toBeCloseTo(1, 12);
    }
  });

  it("saturates in the tails without producing NaN", () => {
    expect(standardNormalCdf(10)).toBeCloseTo(1, 8);
    expect(standardNormalCdf(-10)).toBeCloseTo(0, 8);
    expect(standardNormalCdf(Number.POSITIVE_INFINITY)).toBe(1);
    expect(standardNormalCdf(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it("propagates NaN rather than inventing a probability", () => {
    expect(Number.isNaN(standardNormalCdf(Number.NaN))).toBe(true);
  });
});
