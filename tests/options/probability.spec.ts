import type { OptionLeg, StructureLeg } from "../../src/options/payoff-surface.js";
import { type ProfitProbabilityInput, probabilityOfProfit } from "../../src/options/probability.js";
import { probabilityAbove, probabilityBelow } from "../../src/options/terminal-odds.js";

/**
 * Probability of profit is cross-checked against the CLOSED-FORM odds of clearing the same
 * break-even, which is the honest independent check: for a long call at expiration, POP is by
 * definition P(S_T ≥ K + premium), and for a short strangle it is the band between its two
 * break-evens. Agreement to 9 decimals means the boundary hunt found exactly the right prices.
 */

const CALL_100 = 3.0626001437;
const LONG_CALL: OptionLeg = {
  kind: "call",
  quantity: 1,
  strike: 100,
  daysToExpiry: 30,
  volatility: 0.25,
  entryPrice: CALL_100,
};
/** Short the 95 put and the 105 call for $2 each — break-evens at 91 and 109. */
const STRANGLE: readonly StructureLeg[] = [
  { kind: "put", quantity: -1, strike: 95, daysToExpiry: 30, volatility: 0.25, entryPrice: 2 },
  { kind: "call", quantity: -1, strike: 105, daysToExpiry: 30, volatility: 0.25, entryPrice: 2 },
];
/** Marked on expiration day, under the same 25% vol the legs carry. */
const AT_EXPIRY: ProfitProbabilityInput = {
  spot: 100,
  daysForward: 30,
  volatility: 0.25,
  rate: 0.05,
};

function popOf(legs: readonly StructureLeg[], input: ProfitProbabilityInput): number {
  const pop = probabilityOfProfit(legs, input);
  if (pop === undefined) throw new Error("expected a probability of profit");
  return pop;
}

describe("probabilityOfProfit — cross-checked against the closed-form odds", () => {
  it("equals the odds of finishing above a long call's break-even", () => {
    const pop = popOf([LONG_CALL], AT_EXPIRY);
    expect(pop).toBeCloseTo(0.344803436512, 6);
    expect(pop).toBeCloseTo(probabilityAbove({ ...AT_EXPIRY, target: 100 + CALL_100 }) ?? 0, 9);
  });

  it("equals the odds of finishing above a short put's break-even", () => {
    const shortPut: OptionLeg = { ...LONG_CALL, kind: "put", quantity: -1, entryPrice: 2.5 };
    expect(popOf([shortPut], AT_EXPIRY)).toBeCloseTo(
      probabilityAbove({ ...AT_EXPIRY, target: 100 - 2.5 }) ?? 0,
      9,
    );
  });

  it("finds BOTH break-evens of a short strangle and sums only the band between them", () => {
    const pop = popOf(STRANGLE, AT_EXPIRY);
    const upper = probabilityBelow({ ...AT_EXPIRY, target: 109 }) ?? 0;
    const lower = probabilityBelow({ ...AT_EXPIRY, target: 91 }) ?? 0;
    expect(pop).toBeCloseTo(0.790620081421, 6);
    expect(pop).toBeCloseTo(upper - lower, 9);
  });

  it("stays inside [0,1] for every structure and horizon it is asked about", () => {
    const structures: readonly (readonly StructureLeg[])[] = [
      [LONG_CALL],
      STRANGLE,
      [LONG_CALL, { ...LONG_CALL, quantity: -1, strike: 110, entryPrice: 0.3618698289 }],
      [
        { kind: "stock", quantity: 100, entryPrice: 100 },
        { ...LONG_CALL, quantity: -1 },
      ],
    ];
    for (const legs of structures) {
      for (const daysForward of [0, 7, 30, 60]) {
        for (const volatility of [0, 0.15, 0.9]) {
          const pop = probabilityOfProfit(legs, { ...AT_EXPIRY, daysForward, volatility });
          expect(pop).toBeGreaterThanOrEqual(0);
          expect(pop).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("gives the same structure worse odds the more it overpaid for it", () => {
    const cheap = popOf([{ ...LONG_CALL, entryPrice: 1 }], AT_EXPIRY);
    const dear = popOf([{ ...LONG_CALL, entryPrice: 6 }], AT_EXPIRY);
    expect(cheap).toBeGreaterThan(dear);
  });

  it("honours the independent IV adjustment when marking the legs at the horizon", () => {
    const midCycle: ProfitProbabilityInput = { ...AT_EXPIRY, daysForward: 15 };
    const crushed = popOf([LONG_CALL], { ...midCycle, volatilityShift: -0.1 });
    const expanded = popOf([LONG_CALL], { ...midCycle, volatilityShift: 0.1 });
    expect(expanded).toBeGreaterThan(crushed);
  });
});

describe("probabilityOfProfit — degenerate inputs are defined, never NaN", () => {
  it("is a certainty or an impossibility when there is no uncertainty left", () => {
    const still: ProfitProbabilityInput = { ...AT_EXPIRY, volatility: 0, daysForward: 0 };
    expect(probabilityOfProfit([{ ...LONG_CALL, entryPrice: 1 }], still)).toBe(1);
    expect(probabilityOfProfit([{ ...LONG_CALL, entryPrice: 9 }], still)).toBe(0);
  });

  it("never returns NaN across the degenerate corners", () => {
    for (const volatility of [0, 1e-14, 0.25]) {
      for (const daysForward of [0, 1e-9, 30, 45]) {
        const pop = probabilityOfProfit(STRANGLE, { ...AT_EXPIRY, daysForward, volatility });
        expect(Number.isNaN(pop ?? 0)).toBe(false);
      }
    }
  });
});

describe("probabilityOfProfit — unusable inputs render as ABSENT", () => {
  it("declines a structure it cannot mark", () => {
    expect(probabilityOfProfit([], AT_EXPIRY)).toBeUndefined();
    expect(probabilityOfProfit([{ ...LONG_CALL, strike: 0 }], AT_EXPIRY)).toBeUndefined();
    expect(probabilityOfProfit([LONG_CALL], { ...AT_EXPIRY, spot: -100 })).toBeUndefined();
    expect(probabilityOfProfit([LONG_CALL], { ...AT_EXPIRY, volatility: -1 })).toBeUndefined();
    expect(probabilityOfProfit([LONG_CALL], { ...AT_EXPIRY, rate: Number.NaN })).toBeUndefined();
  });
});
