import { COMMUNITY_MILESTONES } from "./community.js";

/**
 * COMMUNITY MILESTONE DERIVATION (#567) — the pure function that turns the feedback log's
 * append-only filings into earned community milestones, mirroring `progression.ts`'s
 * `deriveEarned` one level over: there the order id IS the evidence for a trade milestone; here
 * the filed issue number IS the evidence for a community one. Same discipline — re-derived from
 * the durable ledger on every read, never a client-side or self-reported claim, nothing to drift.
 */

/** One filed feedback entry — structurally satisfied by `FeedbackLogEntry`. */
export interface CommunityFiling {
  readonly issueNumber: number;
  readonly filedAt: string;
}

/** A community milestone earned by a real filing — the issue number IS the evidence. */
export interface EarnedCommunityMilestone {
  readonly milestoneId: string;
  readonly issueNumber: number;
  readonly at: string;
}

/**
 * Fold filed feedback into earned community milestones — idempotent (same filings, same result),
 * one entry per known milestone using the EARLIEST qualifying filing as evidence.
 */
export function deriveCommunityEarned(
  filings: readonly CommunityFiling[],
): readonly EarnedCommunityMilestone[] {
  if (filings.length === 0) return [];
  const earliest = filings.reduce((a, b) => (b.filedAt < a.filedAt ? b : a));
  const milestone = COMMUNITY_MILESTONES[0];
  return milestone
    ? [{ milestoneId: milestone.id, issueNumber: earliest.issueNumber, at: earliest.filedAt }]
    : [];
}
