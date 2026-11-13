/**
 * THE SUGGESTED-TRADE RULES (#7547) — the written rules that define the three sizes Moneypenny
 * offers, every threshold in one place with the reason it exists. The tiers are these rules and
 * nothing else: no model judgment picks a strike or a size, so the same chain and account always
 * give the same three options. The engine is `trade-suggestions.ts`; PURE, no I/O, no clock.
 *
 * The delta bands and account caps are the plan's settled fork (2026-11-13, "make an objective
 * decision, we can always adjust"): starting values, to be tuned from what members actually place
 * (the plan's falsifier: under 1 in 10 suggested tickets placed by 2026-12-13 → revisit these).
 */

export type SuggestionTier = "conservative" | "standard" | "high-risk";

/** The strategies the engine sizes. Slice 1: the two the position guidance already covers. */
export type SuggestionStrategy = "covered-call" | "cash-secured-put";

export interface TierRule {
  readonly tier: SuggestionTier;
  /** The word a member reads — hue never carries the tier alone (CLAUDE.md, colourblind reader). */
  readonly word: string;
  /** A level-meter shape beside the word, so the tier reads without colour or the word. */
  readonly mark: string;
  /** |delta| band of the strike sold — roughly the model's chance it finishes in the money. */
  readonly delta: { readonly min: number; readonly max: number };
  /**
   * Cash-secured put: the most of the account one suggestion may lose if the stock went to zero
   * after assignment (strike − premium, × 100, × contracts).
   */
  readonly maxAccountAtRisk: number;
  /**
   * Covered call: the share of the member's free 100-share lots a tier writes against (rounded
   * down, at least one). Writing a call on shares already held adds no downside — the shares carry
   * it either way — so an account cap on "max loss" cannot size it honestly: writing FEWER calls
   * would leave the same shares at risk with less premium. What a covered call does put at stake is
   * the shares being called away, so that is what a tier caps.
   */
  readonly coveredLotShare: number;
}

export const TIER_RULES: readonly [TierRule, TierRule, TierRule] = [
  {
    tier: "conservative",
    word: "Conservative",
    mark: "▮▯▯",
    delta: { min: 0.15, max: 0.2 },
    maxAccountAtRisk: 0.02,
    coveredLotShare: 0.25,
  },
  {
    tier: "standard",
    word: "Standard",
    mark: "▮▮▯",
    delta: { min: 0.25, max: 0.3 },
    maxAccountAtRisk: 0.05,
    coveredLotShare: 0.5,
  },
  {
    tier: "high-risk",
    word: "High risk",
    mark: "▮▮▮",
    delta: { min: 0.35, max: 0.5 },
    maxAccountAtRisk: 0.1,
    coveredLotShare: 1,
  },
];

/**
 * DTE window, shared by every tier so the three options compare like with like (same clock, a
 * different strike and size). Under three weeks the premium is mostly gamma risk; past ~45 days
 * time decay is slow relative to the capital tied up. The expiry nearest the target wins.
 */
export const SUGGESTION_DTE = { min: 21, max: 45, target: 30 } as const;

/** The plain name of each strategy, as a member reads it. */
export const STRATEGY_WORDS: Readonly<Record<SuggestionStrategy, string>> = {
  "covered-call": "Covered call",
  "cash-secured-put": "Cash-secured put",
};

/** Every option is paper-only, and says so. */
export const SIM_LABEL = "SIM" as const;

/** One tier's rule as a sentence — the "why these numbers" a member reads first. */
export function tierRuleText(rule: TierRule, strategy: SuggestionStrategy): string {
  const band = `${rule.delta.min.toFixed(2)}–${rule.delta.max.toFixed(2)} delta`;
  const days = `${SUGGESTION_DTE.min}–${SUGGESTION_DTE.max} days`;
  const size =
    strategy === "cash-secured-put"
      ? `at most ${Math.round(rule.maxAccountAtRisk * 100)}% of the account lost if the stock went to zero`
      : rule.coveredLotShare >= 1
        ? "calls on all your free 100-share lots"
        : `calls on ${Math.round(rule.coveredLotShare * 100)}% of your free 100-share lots (at least one)`;
  return `${rule.word}: a strike near ${band}, ${days} out, ${size}.`;
}
