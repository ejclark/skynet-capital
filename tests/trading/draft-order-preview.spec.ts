import { addLeg, emptyDraft, type NewLeg } from "../../src/trading/draft-order.js";
import { datedCurves, draftPreview, payoffCurve } from "../../src/trading/draft-order-preview.js";

/**
 * Slice 3's pure half: the payoff arithmetic behind the review screen. The interesting cases are
 * the vertical spread (textbook max gain = net credit, max loss = width minus credit) and the
 * naked leg, where the EARS criterion says the review screen must show `"unlimited"` — a string,
 * never a very large number pretending to be one.
 */

const SHORT_CALL: NewLeg = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 1,
  limitPrice: 4.2,
};
const LONG_CALL: NewLeg = { ...SHORT_CALL, strike: 200, action: "buy", limitPrice: 1.1 };

describe("draftPreview", () => {
  it("prices a call credit spread with the textbook numbers", () => {
    const spread = addLeg(addLeg(emptyDraft(), SHORT_CALL), LONG_CALL);
    const preview = draftPreview(spread);

    expect(preview.pricedFully).toBe(true);
    expect(preview.netPremium).toBeCloseTo(310); // (4.20 - 1.10) × 100 — a net credit
    expect(preview.maxGain).toBeCloseTo(310); // capped at the net credit
    expect(preview.maxLoss).toBeCloseTo(1_690); // (200 - 180) × 100 - 310
    expect(preview.unlimitedLoss).toBe(false);
    expect(preview.undefinedRiskLegIds).toEqual([]);
  });

  it("shows the literal string 'unlimited' for a naked short call, never a numeric placeholder", () => {
    const naked = addLeg(emptyDraft(), SHORT_CALL);
    const preview = draftPreview(naked);

    expect(preview.maxLoss).toBe("unlimited");
    expect(preview.unlimitedLoss).toBe(true);
    expect(preview.undefinedRiskLegIds).toEqual(["leg-1"]);
  });

  it("reports uncapped max gain for a long call, and its premium as the whole max loss", () => {
    const longCall = addLeg(emptyDraft(), LONG_CALL);
    const preview = draftPreview(longCall);

    expect(preview.maxGain).toBe("uncapped");
    expect(preview.maxLoss).toBeCloseTo(110); // premium 1.10 × 100
    expect(preview.unlimitedLoss).toBe(false);
  });

  it("flags an unpriced leg instead of pretending its premium is real", () => {
    const unpriced = addLeg(emptyDraft(), { ...SHORT_CALL, limitPrice: undefined });
    const preview = draftPreview(unpriced);

    expect(preview.pricedFully).toBe(false);
  });

  it("samples the at-expiration curve through every strike and finds the breakeven exactly", () => {
    const spread = addLeg(addLeg(emptyDraft(), SHORT_CALL), LONG_CALL);
    const curve = payoffCurve(spread.legs);
    expect(curve).toBeDefined();
    if (!curve) return;
    expect(curve.from).toBeCloseTo(144); // 180 × 0.8
    expect(curve.to).toBeCloseTo(240); // 200 × 1.2
    const prices = curve.points.map((p) => p.price);
    expect(prices).toContain(180);
    expect(prices).toContain(200);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    // Flat at the credit below the short strike, flat at the capped loss above the long one.
    expect(curve.points[0]?.pnl).toBeCloseTo(310);
    expect(curve.points.at(-1)?.pnl).toBeCloseTo(-1_690);
    // 180 + 3.10 net credit is where the spread stops paying.
    expect(curve.breakevens).toEqual([183.1]);
    expect(draftPreview(spread).payoff).toEqual(curve);
  });

  it("adds a stock component's P&L to every sample — the covered call's shares", () => {
    const short = addLeg(emptyDraft(), SHORT_CALL);
    const alone = payoffCurve(short.legs);
    const covered = payoffCurve(short.legs, { shares: 100 * SHORT_CALL.contracts, basis: 170 });
    expect(alone && covered).toBeTruthy();
    if (!(alone && covered)) return;
    expect(covered.points.map((p) => p.price)).toEqual(alone.points.map((p) => p.price));
    for (const [i, point] of covered.points.entries()) {
      const bare = alone.points[i]?.pnl ?? Number.NaN;
      expect(point.pnl).toBeCloseTo(bare + (point.price - 170) * 100 * SHORT_CALL.contracts);
    }
  });

  it("marks the same prices before expiry: today under the expiration line for a short leg", () => {
    const short = addLeg(emptyDraft(), SHORT_CALL);
    const curve = payoffCurve(short.legs);
    if (!curve) throw new Error("expected a curve");
    const prices = curve.points.map((p) => p.price);
    const dated = datedCurves(short.legs, prices, { volatility: 0.4, daysToExpiry: 30 });
    expect(dated?.map((line) => line.label)).toEqual(["today", "halfway"]);
    expect(dated?.[1]?.daysForward).toBe(15);
    for (const line of dated ?? []) {
      expect(line.points.map((p) => p.price)).toEqual(prices);
    }
    // At the strike a short call still carries time value before expiry, so its mark-to-model
    // P&L sits below the expiration line's full credit there; halfway lies between the two.
    const at = (line: { points: readonly { price: number; pnl: number }[] }) =>
      line.points.find((p) => p.price === SHORT_CALL.strike)?.pnl ?? Number.NaN;
    const expiry = at(curve);
    const today = dated?.[0] ? at(dated[0]) : Number.NaN;
    const halfway = dated?.[1] ? at(dated[1]) : Number.NaN;
    expect(today).toBeLessThan(halfway);
    expect(halfway).toBeLessThan(expiry);
  });

  it("takes one model per leg and marks halfway at half the NEAREST expiry", () => {
    const spread = addLeg(addLeg(emptyDraft(), SHORT_CALL), {
      ...LONG_CALL,
      expiration: "2026-11-20",
    });
    const curve = payoffCurve(spread.legs);
    if (!curve) throw new Error("expected a curve");
    const prices = curve.points.map((p) => p.price);
    const models = (leg: { expiration: string }) =>
      leg.expiration === "2026-11-20"
        ? { volatility: 0.35, daysToExpiry: 60 }
        : { volatility: 0.4, daysToExpiry: 20 };
    const dated = datedCurves(spread.legs, prices, models);
    expect(dated?.[1]?.daysForward).toBe(10);
    // A leg the model cannot describe means no line at all, never a guessed leg.
    expect(
      datedCurves(spread.legs, prices, (leg) => (leg.strike === 200 ? undefined : models(leg))),
    ).toBeUndefined();
  });

  it("draws no dated line inside two days of expiry, without an IV, or for an unpriced leg", () => {
    const short = addLeg(emptyDraft(), SHORT_CALL);
    const prices = [170, 180, 190];
    expect(datedCurves(short.legs, prices, { volatility: 0.4, daysToExpiry: 1 })).toBeUndefined();
    expect(datedCurves(short.legs, prices, { volatility: 0, daysToExpiry: 30 })).toBeUndefined();
    const unpriced = addLeg(emptyDraft(), { ...SHORT_CALL, limitPrice: undefined });
    expect(
      datedCurves(unpriced.legs, prices, { volatility: 0.4, daysToExpiry: 30 }),
    ).toBeUndefined();
  });

  it("carries no curve for an empty draft", () => {
    expect(payoffCurve([])).toBeUndefined();
    expect(draftPreview(emptyDraft()).payoff).toBeUndefined();
  });

  it("has nothing to price on an empty draft", () => {
    const preview = draftPreview(emptyDraft());

    expect(preview.legCount).toBe(0);
    expect(preview.netPremium).toBeUndefined();
    expect(preview.maxGain).toBe(0);
    expect(preview.maxLoss).toBe(0);
    expect(preview.unlimitedLoss).toBe(false);
  });
});
