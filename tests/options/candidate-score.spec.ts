import {
  type CandidateScore,
  SCORE_WEIGHTS,
  type ScoredStructure,
  type ScoreInput,
  scoreCandidate,
  type VolFit,
  type VolStance,
} from "../../src/options/candidate-score.js";
import type { VolRegimeReading } from "../../src/options/outlook.js";
import type { OptionLeg, StructureLeg } from "../../src/options/payoff-surface.js";
import { probabilityOfProfit } from "../../src/options/probability.js";
import type { RiskHorizon } from "../../src/options/structure-risk.js";

/**
 * Scoring is checked on the three claims that make the ranking trustworthy rather than merely
 * ordered: the probability term is the SAME number `probability.ts` reports (no second, drifting
 * copy), an absent component is DROPPED and the remaining weights re-based rather than defaulted
 * to the middle, and a structure the engines cannot mark is ABSENT rather than scored at zero.
 */

const EXPIRY_DAYS = 30;
const HORIZON: RiskHorizon = { spot: 100, daysForward: EXPIRY_DAYS, volatility: 0.25, rate: 0 };
const CHEAP: VolRegimeReading = { kind: "regime", regime: "cheap", rank: 8 };
const RICH: VolRegimeReading = { kind: "regime", regime: "rich", rank: 88 };
const UNKNOWN: VolRegimeReading = { kind: "absent", reason: "short-history" };

const call = (over: Partial<OptionLeg> = {}): OptionLeg => ({
  kind: "call",
  quantity: 1,
  strike: 100,
  daysToExpiry: EXPIRY_DAYS,
  volatility: 0.25,
  entryPrice: 3.5,
  ...over,
});

const LONG_CALL: readonly StructureLeg[] = [call()];
const VERTICAL: readonly StructureLeg[] = [
  call(),
  call({ quantity: -1, strike: 110, entryPrice: 1.2 }),
];
const STRANGLE: readonly StructureLeg[] = [
  {
    kind: "put",
    quantity: -1,
    strike: 95,
    daysToExpiry: EXPIRY_DAYS,
    volatility: 0.25,
    entryPrice: 2,
  },
  call({ quantity: -1, strike: 105, entryPrice: 2 }),
];

const score = (
  legs: readonly StructureLeg[],
  regime: VolRegimeReading,
  target = 110,
): CandidateScore => {
  const input: ScoreInput = { horizon: HORIZON, target, regime };
  const scored: ScoredStructure | undefined = scoreCandidate(legs, input);
  if (!scored) throw new Error("expected a scored structure");
  return scored.score;
};

describe("scoreCandidate — how well a structure expresses the stated view", () => {
  it("reports the SAME probability of profit the probability engine does", () => {
    const direct = probabilityOfProfit(VERTICAL, {
      spot: 100,
      daysForward: EXPIRY_DAYS,
      volatility: 0.25,
      rate: 0,
    });
    expect(score(VERTICAL, CHEAP).probabilityOfProfit).toBeCloseTo(direct ?? 0, 12);
  });

  it("keeps the composite inside 0–1 whatever the structure", () => {
    for (const legs of [LONG_CALL, VERTICAL, STRANGLE]) {
      const composite = score(legs, RICH).composite;
      expect(composite).toBeGreaterThanOrEqual(0);
      expect(composite).toBeLessThanOrEqual(1);
    }
  });

  it("states what the structure pays at the target, sign and all", () => {
    expect(score(VERTICAL, CHEAP, 110).targetProfit).toBeCloseTo((10 - 2.3) * 100, 4);
    expect(score(VERTICAL, CHEAP, 90).targetProfit).toBeCloseTo(-230, 4);
    expect(score(VERTICAL, CHEAP, 110).targetReturn).toBeCloseTo(770 / 230, 4);
  });

  it("reads a long-options structure as long vega and rewards cheap premium", () => {
    const stance: VolStance | undefined = score(LONG_CALL, CHEAP).volFit.stance;
    expect(stance).toBe("long-vega");
    expect(score(LONG_CALL, CHEAP).volFit.alignment).toBe(1);
    expect(score(LONG_CALL, RICH).volFit.alignment).toBe(0);
  });

  it("reads a short-premium structure as short vega, and the mirror image applies", () => {
    expect(score(STRANGLE, RICH).volFit).toMatchObject({ stance: "short-vega", alignment: 1 });
    expect(score(STRANGLE, CHEAP).volFit.alignment).toBe(0);
  });

  it("reads a VERTICAL's real vega, which net lots would have called neutral", () => {
    // +1 and −1 nets to zero lots; the near strike carries the larger vega, so it is long premium.
    expect(VERTICAL.reduce((lots, leg) => lots + leg.quantity, 0)).toBe(0);
    expect(score(VERTICAL, CHEAP).volFit.stance).toBe("long-vega");
    expect(score(VERTICAL, CHEAP).volFit.alignment).toBe(1);
  });

  it("DROPS the vol term when no regime can be read, instead of defaulting it to the middle", () => {
    const unknown: VolFit = score(VERTICAL, UNKNOWN).volFit;
    expect(unknown.alignment).toBeUndefined();
    expect(unknown.reading).toEqual(UNKNOWN);

    // Re-based on the three surviving weights, the composite is their weighted mean exactly.
    const measured = score(VERTICAL, UNKNOWN);
    const reward = measured.rewardToRisk ?? 0;
    const targetReturn = measured.targetReturn ?? 0;
    const terms = [
      [SCORE_WEIGHTS.probabilityOfProfit, measured.probabilityOfProfit],
      [SCORE_WEIGHTS.rewardToRisk, reward / (1 + reward)],
      [SCORE_WEIGHTS.targetOutcome, targetReturn / (1 + targetReturn)],
    ] as const;
    const total = terms.reduce((sum, [weight]) => sum + weight, 0);
    const expected = terms.reduce((sum, [weight, value]) => sum + weight * value, 0) / total;
    expect(measured.composite).toBeCloseTo(expected, 12);
  });

  it("SCORES an uncapped structure at the bottom of both capital terms — never drops them", () => {
    const uncapped = score(STRANGLE, RICH);
    // Renormalising the two capital terms away would leave the strangle ranked on its probability
    // of profit alone, which is how a 72%-POP naked short ends up looking like the safest choice.
    const popOnly = SCORE_WEIGHTS.probabilityOfProfit + SCORE_WEIGHTS.volFit;
    const ifDropped =
      (SCORE_WEIGHTS.probabilityOfProfit * uncapped.probabilityOfProfit + SCORE_WEIGHTS.volFit) /
      popOnly;
    expect(uncapped.composite).toBeLessThan(ifDropped);
    expect(uncapped.composite).toBeCloseTo(
      SCORE_WEIGHTS.probabilityOfProfit * uncapped.probabilityOfProfit + SCORE_WEIGHTS.volFit,
      12,
    );
  });

  it("leaves a return on capital ABSENT when the risk it would divide by is uncapped", () => {
    const uncapped = score(STRANGLE, RICH);
    expect(uncapped.targetReturn).toBeUndefined();
    expect(uncapped.rewardToRisk).toBeUndefined();
    expect(uncapped.targetProfit).toBeCloseTo(-100, 4);
  });

  it("is ABSENT for a structure the engines cannot mark at all", () => {
    expect(scoreCandidate([], { horizon: HORIZON, target: 110, regime: CHEAP })).toBeUndefined();
    expect(
      scoreCandidate(LONG_CALL, { horizon: { ...HORIZON, spot: 0 }, target: 110, regime: CHEAP }),
    ).toBeUndefined();
  });
});
