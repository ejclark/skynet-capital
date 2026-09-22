import {
  daysToExpiryFrom,
  payoffAtExpiry,
  singleLegOdds,
} from "../../src/options/single-leg-odds.js";

/**
 * Single-leg odds (#3407 P2 slice 2): chance of profit is the lognormal mass on the profitable
 * side of the play's breakeven; expected value is the payoff integrated against that density.
 * Sanity checks are arithmetic a desk can verify by hand, not fitted numbers.
 */

const base = { strike: 100, premium: 5, spot: 100, daysToExpiry: 365, volatility: 0.2 };

describe("payoffAtExpiry", () => {
  it("prices each play at expiry per share", () => {
    expect(payoffAtExpiry("201", 100, 5, 100, 90)).toBe(-5); // sold put: keep 5, owe 10
    expect(payoffAtExpiry("201", 100, 5, 100, 120)).toBe(5);
    expect(payoffAtExpiry("202", 100, 5, 100, 120)).toBe(5); // covered call capped at strike
    expect(payoffAtExpiry("202", 100, 5, 100, 80)).toBe(-15);
    expect(payoffAtExpiry("301", 100, 5, 100, 80)).toBe(15); // long put
    expect(payoffAtExpiry("302", 100, 5, 100, 120)).toBe(15); // long call
    expect(payoffAtExpiry("302", 100, 5, 100, 90)).toBe(-5);
  });
});

describe("singleLegOdds", () => {
  it("a sold put and a bought put at the same strike have complementary chances of profit", () => {
    const sold = singleLegOdds({ ...base, code: "201" });
    const bought = singleLegOdds({ ...base, code: "301" });
    expect(sold?.chanceOfProfit).toBeGreaterThan(0.5); // premium moves the breakeven below spot
    expect(sold?.chanceOfProfit).toBeLessThan(1);
    expect((sold?.chanceOfProfit ?? 0) + (bought?.chanceOfProfit ?? 0)).toBeCloseTo(1, 6);
  });

  it("expected values of the two sides of the same contract are equal and opposite", () => {
    const sold = singleLegOdds({ ...base, code: "201" });
    const bought = singleLegOdds({ ...base, code: "301" });
    expect(sold?.expectedValuePerShare).toBeCloseTo(-(bought?.expectedValuePerShare ?? 0), 6);
  });

  it("with no time left the odds collapse to certainty at the forward", () => {
    const itm = singleLegOdds({ ...base, code: "302", strike: 90, daysToExpiry: 0 });
    expect(itm).toEqual({ chanceOfProfit: 1, expectedValuePerShare: 5 }); // 100 − 90 − 5
    const otm = singleLegOdds({ ...base, code: "302", strike: 110, daysToExpiry: 0 });
    expect(otm).toEqual({ chanceOfProfit: 0, expectedValuePerShare: -5 });
  });

  it("a fairly priced long call has an expected value near its risk-neutral zero", () => {
    // Black–Scholes ATM 1y 20% vol, zero rate ≈ 7.97 — pay that and the EV at expiry ≈ 0.
    const fair = singleLegOdds({ ...base, code: "302", premium: 7.97 });
    expect(Math.abs(fair?.expectedValuePerShare ?? 99)).toBeLessThan(0.05);
  });

  it("declines to answer on junk rather than guessing", () => {
    expect(singleLegOdds({ ...base, code: "302", spot: 0 })).toBeUndefined();
    expect(singleLegOdds({ ...base, code: "302", volatility: Number.NaN })).toBeUndefined();
    expect(singleLegOdds({ ...base, code: "301", premium: 200 })).toBeUndefined(); // breakeven < 0
  });
});

describe("daysToExpiryFrom", () => {
  it("counts calendar days to the 4 pm ET expiry and floors a same-day contract above zero", () => {
    const now = new Date("2026-09-18T14:00:00Z");
    expect(daysToExpiryFrom("2026-09-25", now)).toBeCloseTo(7.25, 2);
    expect(daysToExpiryFrom("2026-09-18", now)).toBeCloseTo(0.25, 2);
    expect(daysToExpiryFrom("2026-09-17", now)).toBe(0.01);
    expect(daysToExpiryFrom("nope", now)).toBeUndefined();
  });
});
