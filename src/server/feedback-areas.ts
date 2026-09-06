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
 *
 * THE LIST MIRRORS THE DRAWER, WORD FOR WORD. It used to name seven places of its own
 * invention while the nav had grown to nine, so Portfolio, The Wire, Collections and Milestones had
 * no entry at all and "Somewhere else" was frequently the only honest answer. Mirroring the drawer means a member picks the same word they just clicked,
 * and the list can only go stale if the nav changes, which `feedback-areas.spec.ts` now watches.
 * Routes with no drawer link (`/pulse`, `/events`, `/compare`, `/bots-vs-humans`, `/tower`) are
 * deliberately absent: nothing in the app names them to a member, so an option for one would be a
 * word only we use.
 */
export const FEEDBACK_AREAS = [
  "Portfolio",
  "Standings",
  "Activity",
  "Trade",
  "Research",
  "Collections",
  "Milestones",
  "The login",
  "This feedback form",
  "Somewhere else",
] as const;

export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];

/**
 * What each drawer word actually covers, for the COACH only — never shown in the `<select>`.
 *
 * The option text stays the bare drawer word so the member matches it by eye; the model needs more
 * to map "the page with everyone's returns" onto "Standings". Splitting the two keeps the select
 * scannable without starving the prompt.
 */
const AREA_HINT: Record<FeedbackArea, string> = {
  Portfolio: "their own accounts and desks, /u and /account",
  Standings: "the home board of everyone's performance, /",
  Activity: "the shared activity feed of who traded what, /activity",
  Trade: "the trade ticket and order flow, /trade",
  Research: "the research lab, a symbol page, or the event calendar, /research",
  Collections: "the browsable bot and play catalogs, /collections",
  Milestones: "the trading-journey ladder and its rewards, /learn",
  "The login": "the sign-in page and the cinematic before it, /login",
  "This feedback form": "the feedback form, coach or their own filed list, /feedback",
  "Somewhere else": "nowhere above, or the app as a whole",
};

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
 *  prompt can never drift from the `<select>`, and glossed from `AREA_HINT` so the model has the
 *  routes the bare drawer word leaves out. */
export const AREA_PROMPT_CLAUSE = `"area": "<where in the app, EXACTLY one of: ${FEEDBACK_AREAS.map(
  (area) => `${area} (${AREA_HINT[area]})`,
).join(
  " | ",
)} — return the bare name only, without the parenthetical; omit the field entirely if they never made it clear>", `;
