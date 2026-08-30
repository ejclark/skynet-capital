/**
 * THE COMMUNITY TRACK — a small milestone track for engagement that isn't a trade, kept
 * deliberately SEPARATE from the trading curriculum (`curriculum.ts`). Filing feedback has no
 * fill behind it, so folding it into the 100-level trade ladder would either fabricate a fake
 * `TradeTypeCode` or weaken `progression.ts`'s fill-only honesty rule (Eric, 2026-08-25: "progress
 * a user can claim with zero proof is worthless") for a milestone that was never a trade at all.
 * This track earns from its own durable record instead — a real filed GitHub issue
 * (`feedback-log.ts`) — never a client-side claim (`community-progression.ts` does the
 * deriving, same pattern as `progression.ts`'s `deriveEarned`).
 *
 * Pure data, same shape discipline as `curriculum.ts`: extend this list for future community
 * milestones (a follow-up filed, a reaction left, N filings) without touching the trade ladder.
 */

export interface CommunityMilestone {
  readonly id: string;
  /** Achievement-style title — phrased as a thing you DO. */
  readonly title: string;
  /** One line on what it is and why it matters. */
  readonly detail: string;
  /** Points awarded when earned — the same score `curriculum.ts` points feed into on /learn. */
  readonly points: number;
}

/** The community track, in order. One milestone today; extensible upward without a design fork. */
export const COMMUNITY_MILESTONES: readonly CommunityMilestone[] = [
  {
    id: "first-feedback",
    title: "File your first feedback",
    detail:
      "Report a bug, request a feature, or drop a wild idea — every filing becomes a real GitHub issue on the build queue.",
    points: 15,
  },
];

/** One community milestone by id, or undefined when it names nothing real. */
export function communityMilestone(id: string): CommunityMilestone | undefined {
  return COMMUNITY_MILESTONES.find((m) => m.id === id);
}

/** Total points the community track can award — same denominator role as `curriculum.ts`'s. */
export function communityTotalPoints(): number {
  return COMMUNITY_MILESTONES.reduce((sum, m) => sum + m.points, 0);
}
