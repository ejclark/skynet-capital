import { COMMUNITY_MILESTONES } from "../domain/community.js";
import {
  deriveCommunityEarned,
  type EarnedCommunityMilestone,
} from "../domain/community-progression.js";
import type { CommunityProgressionStore } from "./community-progression-store.js";
import type { FeedbackLogEntry } from "./feedback-log.js";

/**
 * THE COMMUNITY PROGRESSION SERVICE — composes the feedback log into the community track's
 * view, the same shape `progression-service.ts` uses for the trade ladder: everything earnable is
 * computed at read time from the durable log, so there is no progress state to migrate or drift —
 * the filings ARE the progress. The store holds only what cannot be derived: which celebrations
 * have been claimed.
 *
 * SEEDING mirrors the trade ladder's rule: a member who already had feedback on file before this
 * shipped gets it pre-acknowledged (no day-one wall of fanfare for history that predates the
 * feature); a member earning it fresh sees the celebration once, until claimed.
 */

interface CommunityProgression {
  /** How many times this member has filed feedback — the feedback log's own length. */
  readonly feedbackCount: number;
  readonly earned: readonly EarnedCommunityMilestone[];
  /** Earned but not yet celebrated — drives the one-time unlock banner. */
  readonly celebrating: readonly EarnedCommunityMilestone[];
}

export interface CommunityProgressionService {
  view(opaqueMemberId: string): Promise<CommunityProgression>;
  acknowledge(opaqueMemberId: string, milestoneIds: readonly string[]): Promise<void>;
}

export interface CommunityProgressionServiceDeps {
  /** This member's own filings — the same store `feedback-log.ts` already keeps. */
  readonly readFeedback: (opaqueMemberId: string) => Promise<readonly FeedbackLogEntry[]>;
  /** The celebration-claim store. Absent (offline/test wiring): nothing ever celebrates. */
  readonly store?: CommunityProgressionStore;
  readonly now?: () => Date;
}

export function createCommunityProgressionService(
  deps: CommunityProgressionServiceDeps,
): CommunityProgressionService {
  const now = deps.now ?? (() => new Date());
  return {
    async view(opaqueMemberId) {
      const filings = await deps.readFeedback(opaqueMemberId);
      const earned = deriveCommunityEarned(filings);

      let record = deps.store?.get(opaqueMemberId);
      if (deps.store && !record) {
        record = deps.store.set(
          opaqueMemberId,
          { acknowledged: earned.map((m) => m.milestoneId), since: now().toISOString() },
          now(),
        ).participants[opaqueMemberId];
      }
      const acknowledged = new Set(record?.acknowledged ?? []);
      const celebrating = record
        ? earned.filter((m) => !acknowledged.has(m.milestoneId) && m.at >= record.since)
        : [];

      return { feedbackCount: filings.length, earned, celebrating };
    },
    acknowledge(opaqueMemberId, milestoneIds) {
      // Only real community milestone ids are banked — the client posts its own list, but it's
      // never trusted past this set.
      const known = new Set(COMMUNITY_MILESTONES.map((m) => m.id));
      const ids = milestoneIds.filter((id) => known.has(id));
      if (deps.store && ids.length > 0) {
        const held = deps.store.get(opaqueMemberId)?.acknowledged ?? [];
        deps.store.set(opaqueMemberId, { acknowledged: [...new Set([...held, ...ids])] }, now());
      }
      return Promise.resolve();
    },
  };
}
