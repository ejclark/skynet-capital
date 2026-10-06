import { COURSES } from "./curriculum.js";

/**
 * THE MILESTONE CATALOG — one lookup from a milestone id to the words a reader sees, across both
 * places an earn can come from (#784 slice 5, the first surface that shows every kind of earn on one
 * list):
 *
 *  - the trade ladder (`curriculum.ts`) — derived fresh from fills on every read, never stored;
 *  - the two OUTCOME milestones the ladder detector logs (`ladder-activity-detector.ts`) — an OTM
 *    expiry and a first realized profit, which a fill alone cannot prove.
 *
 * The outcome pair had no title anywhere until now: the ladder progress log was written ahead of its
 * reader, and Activity is that reader. They carry no points, because they are not in the course score
 * yet (`ladder-activity-detector.ts`: they return to `curriculum.ts` once #468's short-lot matching is
 * first-class) — a points figure here would be a number the Learn page never adds up.
 *
 * Deliberately NOT here: `community.ts`'s `first-feedback`. It is earned off a filing, and the
 * league-wide feed keeps filings pseudonymous (Eric, 2026-08-19) — a named "filed their first idea"
 * row would sit beside the filing it was earned by and un-pseudonymize it. It stays on the member's
 * own Profile, which is where it was always shown.
 */

/** Logged by the ladder detector when a contract expires out of the money (`OPEXP`). */
export const FIRST_OTM_EXPIRY_MILESTONE = "first-otm-expiry";
/** Logged by the ladder detector on the first FIFO round trip that closes green. */
export const FIRST_REALIZED_PROFIT_MILESTONE = "first-realized-profit";

export interface MilestoneCard {
  /** Achievement-style, as `curriculum.ts` phrases every title — a thing you DO. */
  readonly title: string;
  /** Present only when the course score counts this milestone. */
  readonly points?: number;
}

/**
 * The outcome titles, phrased to be true for EVERY way the detector can fire. An OTM expiry is a
 * win for the writer of a cash-secured put (the premium is kept) and a loss for the holder of a long
 * call (it expired worthless) — the detector does not tell the two apart, so the title names the
 * fact and never calls it either one.
 */
const OUTCOME_CARDS: ReadonlyMap<string, MilestoneCard> = new Map([
  [FIRST_OTM_EXPIRY_MILESTONE, { title: "See an option expire out of the money" }],
  [FIRST_REALIZED_PROFIT_MILESTONE, { title: "Book your first profit" }],
]);

const LADDER_CARDS: ReadonlyMap<string, MilestoneCard> = new Map(
  COURSES.flatMap((course) =>
    course.milestones.map((m) => [m.id, { title: m.title, points: m.points }] as const),
  ),
);

/** A milestone's title (and points, when it scores), or undefined when the id names nothing this app
 *  knows — a caller then drops the row rather than render a bare id as if it were a title. */
export function milestoneCard(id: string): MilestoneCard | undefined {
  return LADDER_CARDS.get(id) ?? OUTCOME_CARDS.get(id);
}
