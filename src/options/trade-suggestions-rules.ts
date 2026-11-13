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

/**
 * The strategies the engine sizes. Slice 1: the two the position guidance already covers (both sell
 * premium); slice 4: a long call and a long put (both buy it — a debit whose most it can lose is
 * the premium paid).
 */
export type SuggestionStrategy = "covered-call" | "cash-secured-put" | "long-call" | "long-put";

/** A long option is bought; the other two are sold. */
export const isLong = (s: SuggestionStrategy): boolean => s === "long-call" || s === "long-put";

/** The option type a strategy trades. */
export const optionTypeOf = (s: SuggestionStrategy): "call" | "put" =>
  s === "covered-call" || s === "long-call" ? "call" : "put";

export interface TierRule {
  readonly tier: SuggestionTier;
  /** The word a member reads — hue never carries the tier alone (CLAUDE.md, colourblind reader). */
  readonly word: string;
  /** A level-meter shape beside the word, so the tier reads without colour or the word. */
  readonly mark: string;
  /** |delta| band of the strike SOLD — roughly the model's chance it finishes in the money. */
  readonly delta: { readonly min: number; readonly max: number };
  /**
   * |delta| band of the strike BOUGHT (#7547 slice 4). It runs the other way from the sold band:
   * for a seller a low delta is the cautious end (the option seldom finishes in the money), for a
   * buyer it is the risky end (a cheap option that usually expires worthless). So a conservative
   * buy sits in the money and moves most like the stock, a standard one near the money, a high-risk
   * one out of the money. Reusing the sold bands would label the riskiest purchase "conservative" —
   * the plan's settled fork 2 was written for the two selling strategies it started with.
   */
  readonly longDelta: { readonly min: number; readonly max: number };
  /**
   * Cash-secured put: the most of the account one suggestion may lose if the stock went to zero
   * after assignment (strike − premium, × 100, × contracts). Long call or put: the most it may lose
   * if the option expires worthless (the premium paid, × 100, × contracts). The same cap either way.
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
    longDelta: { min: 0.65, max: 0.8 },
    maxAccountAtRisk: 0.02,
    coveredLotShare: 0.25,
  },
  {
    tier: "standard",
    word: "Standard",
    mark: "▮▮▯",
    delta: { min: 0.25, max: 0.3 },
    longDelta: { min: 0.45, max: 0.55 },
    maxAccountAtRisk: 0.05,
    coveredLotShare: 0.5,
  },
  {
    tier: "high-risk",
    word: "High risk",
    mark: "▮▮▮",
    delta: { min: 0.35, max: 0.5 },
    longDelta: { min: 0.25, max: 0.35 },
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

/**
 * DTE window for a BOUGHT option. A buyer pays the time decay a seller earns, and decay is steepest
 * in the last month, so a long option buys more time: 45–90 days, nearest 60. Still shared by every
 * tier, so the three long options compare like with like.
 */
export const LONG_DTE = { min: 45, max: 90, target: 60 } as const;

/** The DTE window a strategy's suggestions draw from. */
export const dteWindow = (
  s: SuggestionStrategy,
): { readonly min: number; readonly max: number; readonly target: number } =>
  isLong(s) ? LONG_DTE : SUGGESTION_DTE;

/** The |delta| band a tier picks from, for this strategy: the sold band, or the bought one. */
export const deltaBand = (
  rule: TierRule,
  s: SuggestionStrategy,
): { readonly min: number; readonly max: number } => (isLong(s) ? rule.longDelta : rule.delta);

/** The plain name of each strategy, as a member reads it. */
export const STRATEGY_WORDS: Readonly<Record<SuggestionStrategy, string>> = {
  "covered-call": "Covered call",
  "cash-secured-put": "Cash-secured put",
  "long-call": "Long call",
  "long-put": "Long put",
};

/** Every option is paper-only, and says so. */
export const SIM_LABEL = "SIM" as const;

/** One tier's rule as a sentence — the "why these numbers" a member reads first. */
export function tierRuleText(rule: TierRule, strategy: SuggestionStrategy): string {
  const delta = deltaBand(rule, strategy);
  const window = dteWindow(strategy);
  const band = `${delta.min.toFixed(2)}–${delta.max.toFixed(2)} delta`;
  const days = `${window.min}–${window.max} days`;
  const cap = `at most ${Math.round(rule.maxAccountAtRisk * 100)}% of the account lost`;
  const size = isLong(strategy)
    ? `${cap} if it expires worthless`
    : strategy === "cash-secured-put"
      ? `${cap} if the stock went to zero`
      : rule.coveredLotShare >= 1
        ? "calls on all your free 100-share lots"
        : `calls on ${Math.round(rule.coveredLotShare * 100)}% of your free 100-share lots (at least one)`;
  return `${rule.word}: a strike near ${band}, ${days} out, ${size}.`;
}
