/**
 * THE COACH'S COST DIALS — every knob that decides how much the metered Anthropic API bill is,
 * separated from the coach itself so it can be gated without freezing the part we want to keep
 * improving.
 *
 * WHY ITS OWN FILE. `.github/prompts/feedback-build.md` told autonomous build sessions that "spend
 * means provisioning a credential or raising a cap — nothing else", and `feedback-coach.ts` was not
 * in `envelope.json`. A member could therefore file "have the coach ask more questions", and the
 * lane would raise MAX_USER_ROUNDS, pass every gate, auto-merge, and multiply Eric's bill with no
 * human in the loop. Protecting the whole coach would have been the blunt fix — but the system
 * prompt is exactly the lever Eric named for improving quality ("the solution for this path is to
 * improve the AI that curates the plan"), so freezing it would block the work he asked for.
 *
 * The seam: **what costs money lives here and is in `envelope.json`; what improves quality stays in
 * `feedback-coach.ts` and stays open.**
 *
 * ROUTE THE MODEL BY WHO PAYS (Eric, 2026-08-22): "metered, per token conversations should favor
 * haiku 4.5 or whatever the inexpensive models available are… the plan gets handed off to a gha job
 * connected to my personal account which has headroom to leverage me powerful llms to research and
 * build out solutions."
 *
 *   - Metered per-token (this file — ANTHROPIC_API_KEY → api.anthropic.com): the CHEAPEST model that
 *     clears the completeness bar. This is a checklist-driven interview, not open-ended reasoning.
 *   - Flat-rate subscription (the postmaster build session, the CI medic — CLAUDE_CODE_OAUTH_TOKEN):
 *     the STRONGEST model available. Economizing there saves nothing and costs build quality.
 *
 * That reverses #449's Sonnet-for-the-coach call on better information: the token trade-off is only
 * real on the metered side, and the ideation it was buying now happens downstream, where it is free.
 */

/**
 * Claude Haiku 4.5 — $1/1M in, $5/1M out, versus Sonnet 5's $3/$15 ($2/$10 through 2026-08-31).
 * The coach's job is to ask one short question at a time against a fixed checklist and then emit
 * structured JSON; a small model is well suited to it. The safety property that makes this sound is
 * in `toSpec`: an unbacked `spec-complete` claim is downgraded to `partial`, and an unparseable
 * reply degrades to a question — so a weaker model's slip becomes `needs-info` routed to the
 * MEMBER, never a bad build.
 */
export const MODEL = "claude-haiku-4-5";

/**
 * A CEILING, NOT A TARGET. The coach drafts the moment the per-kind completeness bar is met, so
 * this only binds on a conversation that stays vague. Derived rather than picked: the largest bar
 * is a bug's four items (what happened · where · expected vs. actual · repro), and a member's
 * opening note typically supplies one or two — Zimmermann et al. is why, the items a builder needs
 * most being the ones a reporter finds hardest to volunteer. Four items plus one spare for a vague
 * answer = 5. `rounds` rides out on every curated issue's spec block, so the next adjustment to
 * this number can be made from the observed distribution instead of from argument.
 */
export const MAX_USER_ROUNDS = 5;

/** Enough turns for MAX_USER_ROUNDS question/answer pairs plus the opening note and the draft. */
export const MAX_MESSAGES = 12;

/** Per-message input bound. Server-enforced, never model-trusted. */
export const MAX_MESSAGE_CHARS = 4000;

/** Only the final draft is large; a question is a sentence. */
export const MAX_TOKENS = 1000;

/** Coach-specific burst throttle: a conversation is several turns, so looser than the submission cap. */
export const THROTTLE_MAX = 30;
export const THROTTLE_WINDOW_MS = 600_000;
