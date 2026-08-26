import type { OptionLeg, StructureLeg } from "../../src/options/payoff-surface.js";
import {
  type RiskBound,
  type RiskHorizon,
  structureProfitAt,
  structureRisk,
} from "../../src/options/structure-risk.js";

/**
 * Marked at its own expiration, a structure's risk profile has closed-form answers a spec can
 * assert without borrowing the implementation: a long call risks its premium and makes without
 * limit, a vertical is capped both ways at its width, a naked short call is uncapped on one side.
 * Those are the four corners this module has to get right, and the covered call is the case that
 * proves boundedness is decided STRUCTURALLY rather than from where the samples stopped.
 */

const STRIKE = 100;
const CALL_PREMIUM = 3.5;
const EXPIRY_DAYS = 30;
/** Marked on expiration day: every leg settles at intrinsic, so the numbers are exact. */
const AT_EXPIRY: RiskHorizon = {
  spot: 100,
  daysForward: EXPIRY_DAYS,
  volatility: 0.25,
  rate: 0,
};

const call = (over: Partial<OptionLeg> = {}): OptionLeg => ({
  kind: "call",
  quantity: 1,
  strike: STRIKE,
  daysToExpiry: EXPIRY_DAYS,
  volatility: 0.25,
  entryPrice: CALL_PREMIUM,
  ...over,
});

const amountOf = (bound: RiskBound): number | undefined =>
  bound.kind === "amount" ? bound.amount : undefined;

const riskOf = (legs: readonly StructureLeg[], horizon: RiskHorizon = AT_EXPIRY) => {
  const risk = structureRisk(legs, horizon);
  if (!risk) throw new Error("expected a risk profile");
  return risk;
};

describe("structureRisk — the four numbers in a risk graph's corner", () => {
  it("prices a long call as premium at risk, uncapped upside, break-even at strike plus premium", () => {
    const risk = riskOf([call()]);
    expect(risk.maxProfit).toEqual({ kind: "unbounded" });
    expect(amountOf(risk.maxLoss)).toBeCloseTo(CALL_PREMIUM * 100, 6);
    expect(risk.capitalAtRisk).toBeCloseTo(CALL_PREMIUM * 100, 6);
    expect(risk.breakEvens).toHaveLength(1);
    expect(risk.breakEvens[0]).toBeCloseTo(STRIKE + CALL_PREMIUM, 4);
  });

  it("caps a call vertical at its width, both ways", () => {
    const debit = CALL_PREMIUM - 1.2;
    const risk = riskOf([call(), call({ quantity: -1, strike: 110, entryPrice: 1.2 })]);
    expect(amountOf(risk.maxProfit)).toBeCloseTo((10 - debit) * 100, 4);
    expect(amountOf(risk.maxLoss)).toBeCloseTo(debit * 100, 4);
    expect(risk.breakEvens[0]).toBeCloseTo(STRIKE + debit, 4);
  });

  it("calls a naked short call's loss UNCAPPED rather than reporting the band's edge", () => {
    const risk = riskOf([call({ quantity: -1 })]);
    expect(risk.maxLoss).toEqual({ kind: "unbounded" });
    expect(risk.capitalAtRisk).toBeUndefined();
    expect(amountOf(risk.maxProfit)).toBeCloseTo(CALL_PREMIUM * 100, 6);
  });

  it("keeps a covered call BOUNDED — the shares cover the short call, lot for lot", () => {
    const risk = riskOf([
      { kind: "stock", quantity: 100, entryPrice: 100 },
      call({ quantity: -1, strike: 110, entryPrice: 2 }),
    ]);
    expect(amountOf(risk.maxProfit)).toBeCloseTo(1200, 4);
    // The worst case is at price zero, well outside any ±6σ band — the asymptote is marked anyway.
    expect(amountOf(risk.maxLoss)).toBeCloseTo(9800, 0);
    expect(risk.breakEvens[0]).toBeCloseTo(98, 4);
  });

  it("finds BOTH break-evens of a short strangle and still calls its loss uncapped", () => {
    const risk = riskOf([
      {
        kind: "put",
        quantity: -1,
        strike: 95,
        daysToExpiry: EXPIRY_DAYS,
        volatility: 0.25,
        entryPrice: 2,
      },
      call({ quantity: -1, strike: 105, entryPrice: 2 }),
    ]);
    expect(risk.breakEvens).toHaveLength(2);
    expect(risk.breakEvens[0]).toBeCloseTo(91, 4);
    expect(risk.breakEvens[1]).toBeCloseTo(109, 4);
    expect(risk.maxLoss).toEqual({ kind: "unbounded" });
  });

  it("carries the entry cost's sign: a debit is positive, a credit negative", () => {
    expect(riskOf([call()]).entryCost).toBeCloseTo(CALL_PREMIUM * 100, 6);
    expect(riskOf([call({ quantity: -1 })]).entryCost).toBeCloseTo(-CALL_PREMIUM * 100, 6);
  });
});

describe("structureProfitAt — the marked curve every other number is read from", () => {
  it("is value less entry cost at the price asked about", () => {
    expect(structureProfitAt([call()], AT_EXPIRY, 120)).toBeCloseTo((20 - CALL_PREMIUM) * 100, 6);
    expect(structureProfitAt([call()], AT_EXPIRY, 80)).toBeCloseTo(-CALL_PREMIUM * 100, 6);
  });

  it("is ABSENT for a structure with nothing in it, never a $0 that reads as break-even", () => {
    expect(structureProfitAt([], AT_EXPIRY, 100)).toBeUndefined();
    expect(structureRisk([], AT_EXPIRY)).toBeUndefined();
    expect(structureRisk([call()], { ...AT_EXPIRY, spot: 0 })).toBeUndefined();
  });
});
