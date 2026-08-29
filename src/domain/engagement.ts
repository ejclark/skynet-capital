/**
 * THE ENGAGEMENT TRACK — a milestone earned by an ACTION, not a trade fill (#567). Deliberately a
 * separate track from `curriculum.ts`/`progression.ts`'s trade ladder rather than a new
 * `TradeTypeCode`: `progression.ts`'s own header states the ruling this desk holds elsewhere too
 * — "proof is a FILL, never a submission and never a checkbox" — and filing feedback has no fill
 * behind it. Sidestepping that rule by not claiming to be a trade milestone keeps the ladder's
 * honesty invariant untouched while still making the desk feel like it notices when a member
 * helps build it.
 *
 * SAME EVIDENCE DISCIPLINE, DIFFERENT EVIDENCE: a trade milestone's proof is an order id; this
 * track's proof is a `feedback-log.ts` entry — server-recorded the moment a filing actually
 * reaches GitHub (`recordFilingSafely`), never a client claim. Pure and total, same as
 * `progression.ts`'s `deriveEarned` — the log IS the progress, nothing to migrate or drift.
 */

export interface EngagementMilestone {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly points: number;
}

export const ENGAGEMENT_MILESTONES: readonly EngagementMilestone[] = [
  {
    id: "first-feedback",
    title: "File your first feedback",
    detail:
      "Report a bug or pitch an idea through /feedback — the desk gets better because you said something.",
    points: 20,
  },
];

export function engagementMilestone(id: string): EngagementMilestone | undefined {
  return ENGAGEMENT_MILESTONES.find((m) => m.id === id);
}

/** A milestone earned by a real filing — `at` IS the evidence (the filing's own timestamp). */
export interface EarnedEngagement {
  readonly milestoneId: string;
  readonly at: string;
}

/**
 * Fold filing timestamps into earned engagement milestones. One entry, `first-feedback`, keyed
 * to the EARLIEST filing — matches `deriveEarned`'s "earliest qualifying fill as evidence" rule,
 * so a member who filed feedback before this track existed shows the milestone dated to their
 * real first filing, not to whenever this code shipped.
 */
export function deriveEngagementEarned(filedAts: readonly string[]): readonly EarnedEngagement[] {
  if (filedAts.length === 0) return [];
  const earliest = filedAts.reduce((a, b) => (a < b ? a : b));
  return [{ milestoneId: "first-feedback", at: earliest }];
}
