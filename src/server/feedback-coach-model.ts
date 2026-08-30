/**
 * THE COACH'S MODEL DIAL — split out of `feedback-coach-limits.ts` (#928, Eric: "the only
 * controls for feedback is limited [to] the auth, llm model and effort level... if people desire
 * to add/extend to the feedback process, I want to enable them"). This is the one dial that
 * changes the coach's real per-token bill; everything else that used to live alongside it
 * (round/message/token/throttle caps) is ordinary feature work now open in
 * `feedback-coach-limits.ts`.
 *
 * ROUTE THE MODEL BY WHO PAYS (Eric, 2026-08-22): metered per-token conversations (this one —
 * ANTHROPIC_API_KEY → api.anthropic.com) get the cheapest model that clears the completeness bar,
 * never the flat-rate build session's strongest-available policy. See `feedback-coach-limits.ts`
 * for the full route-by-who-pays rule this constant answers to.
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
