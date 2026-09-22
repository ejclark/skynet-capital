/**
 * THE COMPANION'S MODEL DIAL — split out of `companion-limits.ts`, mirroring
 * `feedback-coach-model.ts`'s seam. Protected (`envelope.json`) because it's the one place that
 * changes the real per-token bill — never widened here to a general trading/spend-shaped rule.
 *
 * #1672 slice 3: the rail's answer-quality incident (a done milestone claimed undone, a rule
 * invented to fit, then reversed on pushback) plus Eric's own read ("my understanding is that the
 * quality of sonnet is significantly better") set the default to Sonnet 5. A May 2026 study on
 * "correction suppression" (arXiv 2605.05957) found frontier models hold a false premise LESS
 * often than small ones once it's embedded in a request — so this swap is a quality call, not a
 * proven fix for that specific failure; `src/evals/companion/fixtures.ts`'s grounding and
 * pushback fixtures are what actually measures it, on whichever model runs.
 *
 * `COMPANION_MODELS` is the allowlist #1672 slice 4's owner-only Mission Control dial picks
 * within — widening the allowlist itself stays a protected-file change; picking within it does
 * not, and slice 4 never needs to touch this file again to add that control.
 */

export const COMPANION_MODELS = ["claude-haiku-4-5", "claude-sonnet-5"] as const;
export type CompanionModelId = (typeof COMPANION_MODELS)[number];

/** The default every companion turn runs on until slice 4's dial overrides it. */
export const COMPANION_MODEL: CompanionModelId = "claude-sonnet-5";
