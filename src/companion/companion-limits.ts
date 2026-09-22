/**
 * THE COMPANION'S FEEL DIALS — round/size/throttle caps that shape the conversation, open per
 * #928 (Eric: community extension of the interview shape is fine; the model choice is the one
 * dial worth gating). `COMPANION_MODEL` moved to `companion-model.ts`, now protected in
 * `envelope.json` alongside `feedback-coach-model.ts` — the gap this file used to flag ("NOT YET
 * PROTECTED... treat this file as if it already carried protected: true") is closed by that move,
 * not by protecting this file too.
 *
 * REUSE, NOT A NEW SPEND SURFACE. The companion shares the coach's existing
 * `ANTHROPIC_API_KEY` and its existing Console spend cap — no new credential, no new Fly secret,
 * no raised ceiling. `COMPANION_MODEL` started as the same Haiku tier the coach pays for
 * (`feedback-coach-model.ts`'s `MODEL`); #1672 slice 3 moved the companion's own default to
 * Sonnet 5 on a quality call, independent of the coach's tier — the two dials share a ceiling and
 * a gate, not a model, from here on.
 *
 * FILING GOES THROUGH THE EXISTING COACH, NOT A SECOND MODEL LANE. The plan floated Sonnet
 * for issue-drafting; on inspection the shipped coach already drafts on Haiku, so the
 * companion's file-an-issue lane hands the conversation straight to that existing `CoachTurn`
 * rather than standing up a second cost dial for a Sonnet-drafting mode. One shared ceiling, one
 * shared gate.
 */

/** Small replies keep pennies pennies; a long explanation still fits comfortably. */
export const MAX_TOKENS_PER_REPLY = 700;

/**
 * A conversation ends gracefully here rather than growing without bound — the client resends the
 * (trimmed) transcript on every turn since v1 persists nothing server-side, so this doubles as
 * the per-request payload bound. Chosen to match the acceptance criterion's stated ceiling
 * ("ends gracefully at 20 turns") — 20 user+assistant round trips is 40 messages.
 */
export const MAX_TURNS = 40;

/** Only the last N turns ride in the request — older context ages out rather than compounding
 *  every request's token count as a conversation runs long. */
export const MAX_HISTORY_MESSAGES = 10;

/** Server-enforced, never model-trusted — same bound class as the coach's `MAX_MESSAGE_CHARS`. */
export const COMPANION_MAX_MESSAGE_CHARS = 4000;

/** At most this many read-tool round trips per turn before the companion answers with whatever
 *  it already has — a model that keeps calling tools never turns into an unbounded loop of paid
 *  requests. */
export const MAX_TOOL_ROUNDS = 3;

/** Burst throttle, same shape as the coach's — a conversation is several turns, looser than a
 *  one-shot submission cap. */
export const COMPANION_THROTTLE_MAX = 40;
export const COMPANION_THROTTLE_WINDOW_MS = 600_000;

/** The MODEL-CALL budget behind the request throttle (red-team A6): a turn is up to
 *  `MAX_TOOL_ROUNDS + 1` billed calls, so counting requests alone under-counts by 4×. This is the
 *  cap on calls per member per window; a turn that would exceed it answers with what it has. */
export const COMPANION_MODEL_CALLS_MAX = 100;

/**
 * The graceful close-out at the turn ceiling — no model call is made once this fires, so it costs
 * nothing and cannot be gamed into one more paid round.
 */
export const TURN_LIMIT_MESSAGE =
  "We've covered a lot of ground in this thread — start a new conversation (↺ in the rail) and let's pick it back up fresh. If something's still off or you'd like it built, tell me there and I'll draft the filing.";
