/**
 * THE COACH'S FEEL DIALS — round/message/token/throttle caps that shape the interview, split from
 * the money dial (#928, Eric: "the only controls for feedback is limited [to] the auth, llm model
 * and effort level... if people desire to add/extend to the feedback process, I want to enable
 * them"). These caps affect cost only indirectly (more rounds costs more tokens on a fixed cheap
 * model) — Eric's call is that community extension of the interview shape is worth that, same
 * reasoning that already kept the coach's PROMPT open in `feedback-coach.ts`.
 *
 * THE MODEL DIAL LIVES SEPARATELY, PROTECTED. `MODEL` moved to `feedback-coach-model.ts` — the one
 * knob that actually changes the coach's real per-token bill, and per Eric's #928 framing, the one
 * still worth Eric's manual click. See that file's header for the route-by-who-pays rule.
 */

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
