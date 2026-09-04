/**
 * THE ENGAGEMENT TRACK — a milestone earned by an ACTION, not a trade fill. Deliberately a
 * separate track from `curriculum.ts`/`progression.ts`'s trade ladder rather than a new
 * `TradeTypeCode`: `progression.ts`'s own header states the ruling this desk holds elsewhere too
 * — "proof is a FILL, never a submission and never a checkbox" — and saying hello to Moneypenny
 * has no fill behind it. Sidestepping that rule by not claiming to be a trade milestone keeps the
 * ladder's honesty invariant untouched while still making the desk feel like it notices when a
 * member shows up.
 *
 * SAME EVIDENCE DISCIPLINE, DIFFERENT EVIDENCE: a trade milestone's proof is an order id; this
 * track's proof is a `companion-message-log.ts` entry — server-recorded the moment a real message
 * reaches the rail (`recordFirstMessageSafely`), never a client claim. Pure and total, same as
 * `progression.ts`'s `deriveEarned` — the log IS the progress, nothing to migrate or drift.
 *
 * NOT the same milestone as filing an actual issue (`community.ts`'s `first-feedback`, 15 points):
 * Eric's ruling, 2026-09-03 — requiring a filed issue was too high a bar to gate trading on, so
 * that stays its own, harder, separately-tracked achievement. This track's bar is lower on
 * purpose — a message just acknowledges the member showed up.
 */

export interface EngagementMilestone {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly points: number;
}

export const ENGAGEMENT_MILESTONES: readonly EngagementMilestone[] = [
  {
    id: "first-message",
    title: "Say hello to Moneypenny",
    detail:
      "Send Moneypenny a message in the rail — any question or note opens the trading ladder. Filing an actual issue is a separate, harder achievement (see the community milestones).",
    // 10, not 20 (2026-09-02): this milestone doubles as onboarding's second step
    // (`onboarding.ts`), and the canvas prices every onboarding step at 10. One source of truth.
    points: 10,
  },
];

export function engagementMilestone(id: string): EngagementMilestone | undefined {
  return ENGAGEMENT_MILESTONES.find((m) => m.id === id);
}

/** A milestone earned by a real message — `at` IS the evidence (the message's own timestamp). */
export interface EarnedEngagement {
  readonly milestoneId: string;
  readonly at: string;
}

/**
 * Fold message timestamps into earned engagement milestones. One entry, `first-message`, keyed
 * to the EARLIEST message — matches `deriveEarned`'s "earliest qualifying fill as evidence" rule,
 * so a member who messaged Moneypenny before this track existed shows the milestone dated to
 * their real first message, not to whenever this code shipped.
 */
export function deriveEngagementEarned(sentAts: readonly string[]): readonly EarnedEngagement[] {
  if (sentAts.length === 0) return [];
  const earliest = sentAts.reduce((a, b) => (a < b ? a : b));
  return [{ milestoneId: "first-message", at: earliest }];
}
