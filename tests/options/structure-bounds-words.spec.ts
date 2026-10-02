import type { StructureRisk } from "../../src/options/structure-risk";
import { noDenominatorWords, noRatioWords } from "../../src/options/structure-words";

/**
 * THE ONE WAY THE HONESTY CARD COULD LIE (#3407 slice 4, caught in review before merge).
 *
 * `candidate-score.ts` drops `targetReturn` and `rewardToRisk` for more than one reason each:
 *
 *   targetReturn  — absent when `capitalAtRisk` is absent (an UNCAPPED loss) **or** when it is zero
 *                   (a structure that cannot lose: a credit at least as wide as the spread).
 *   rewardToRisk  — absent when either bound is uncapped **or** when `maxLoss.amount <= 0`.
 *
 * Inferring the reason from `maxLoss.kind === "unbounded"` alone therefore prints the OPPOSITE claim
 * on the zero-loss case: "profit has no ceiling" beside a stated $875 ceiling, and "no capped loss
 * to measure against" beside a stated $0.00 loss — two false statements on the card whose whole job
 * is to be the honest one. These cases pin the third answer, which is the one that was missing.
 */

const risk = (over: Partial<StructureRisk> = {}): StructureRisk => ({
  entryCost: 625,
  maxProfit: { kind: "amount", amount: 875 },
  maxLoss: { kind: "amount", amount: 625 },
  breakEvens: [186.25],
  capitalAtRisk: 625,
  ...over,
});

describe("noRatio — why a reward-to-risk is absent", () => {
  it("names the uncapped loss when that is what happened", () => {
    expect(noRatioWords(risk({ maxLoss: { kind: "unbounded" } }))).toBe("loss has no ceiling");
  });

  it("names the uncapped profit when that is what happened", () => {
    expect(noRatioWords(risk({ maxProfit: { kind: "unbounded" } }))).toBe("profit has no ceiling");
  });

  // The case the first version got wrong: BOTH bounds are real numbers, the loss is zero, and the
  // scorer dropped the ratio for lack of a divisor. "profit has no ceiling" beside a stated $875
  // ceiling is a false claim about the structure on screen.
  it("names the zero loss rather than claiming a ceiling the card itself prints", () => {
    const zeroLoss = risk({ maxLoss: { kind: "amount", amount: 0 }, capitalAtRisk: 0 });
    expect(noRatioWords(zeroLoss)).toBe("nothing at risk to divide by");
    expect(noRatioWords(zeroLoss)).not.toContain("no ceiling");
  });

  it("prefers the loss when both bounds are uncapped — the one that can hurt", () => {
    const both = risk({ maxLoss: { kind: "unbounded" }, maxProfit: { kind: "unbounded" } });
    expect(noRatioWords(both)).toBe("loss has no ceiling");
  });
});

describe("noDenominator — why a return-at-target is absent", () => {
  it("names the uncapped loss when there is no capital to divide by", () => {
    expect(noDenominatorWords(risk({ maxLoss: { kind: "unbounded" } }))).toBe(
      "no capped loss to measure against",
    );
  });

  it("distinguishes 'nothing at risk' from 'no cap on the risk'", () => {
    const zeroLoss = risk({ maxLoss: { kind: "amount", amount: 0 }, capitalAtRisk: 0 });
    expect(noDenominatorWords(zeroLoss)).toBe("nothing at risk to measure against");
    expect(noDenominatorWords(zeroLoss)).not.toBe(
      noDenominatorWords(risk({ maxLoss: { kind: "unbounded" } })),
    );
  });
});

describe("every absent-ratio answer", () => {
  it("is words — never a dash, never a zero", () => {
    const answers = [
      noRatioWords(risk({ maxLoss: { kind: "unbounded" } })),
      noRatioWords(risk({ maxProfit: { kind: "unbounded" } })),
      noRatioWords(risk({ maxLoss: { kind: "amount", amount: 0 } })),
      noDenominatorWords(risk({ maxLoss: { kind: "unbounded" } })),
      noDenominatorWords(risk({ maxLoss: { kind: "amount", amount: 0 } })),
    ];
    for (const answer of answers) {
      expect(answer).not.toMatch(/^[—-]|^0|^\$/);
      expect(answer.length).toBeGreaterThan(10);
    }
  });
});
