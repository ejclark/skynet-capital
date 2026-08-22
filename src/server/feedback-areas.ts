/**
 * The one list of "where in the app" the feedback surface offers.
 *
 * It lives in its own module because three consumers need it and two of them already point at each
 * other: `feedback-issue.ts` imports the coach's spec type, so putting the list there would have
 * the coach importing back into it. A leaf module keeps the graph acyclic.
 *
 * The coach already interrogates "where in the app" as part of its completeness bar, so the answer
 * exists in the conversation either way — this list is what lets that answer land in the FIELD
 * instead of only in prose.
 */
export const FEEDBACK_AREAS = [
  "The board (home)",
  "The login",
  "A player page",
  "The trading desk",
  "The calendar",
  "Research",
  "Somewhere else",
] as const;

export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];

/** Whether a model-supplied string is one of the offered areas. Never trust the draft's spelling. */
function isFeedbackArea(value: unknown): value is FeedbackArea {
  return typeof value === "string" && (FEEDBACK_AREAS as readonly string[]).includes(value);
}

/**
 * The coach draft's area as a spreadable field — `{ area }` when it is one we offer, `{}` when it
 * is anything else. An unrecognised area is DROPPED rather than passed through, the same
 * conservative degrade `toSpec` applies to the rest of the draft: a wrong pre-selection is worse
 * than no selection, because the member has no reason to re-check a field that looks answered.
 */
export function areaFrom(draft: Record<string, unknown>): { area?: FeedbackArea } {
  return isFeedbackArea(draft.area) ? { area: draft.area } : {};
}

/** The allowed-values clause the coach's system prompt enumerates. Kept beside the list so the
 *  prompt can never drift from the `<select>`. */
export const AREA_PROMPT_CLAUSE = `"area": "<where in the app, EXACTLY one of: ${FEEDBACK_AREAS.join(" | ")} — omit the field entirely if they never made it clear>", `;
