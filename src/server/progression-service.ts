import { deriveContributions, type EarnedContribution, type Filing } from "../domain/community.js";
import {
  ALL_COURSES,
  COURSES,
  type CourseLevel,
  pointsFor,
  type Rank,
  rankFor,
  unlockedLevels,
} from "../domain/curriculum.js";
import {
  deriveEarned,
  type EarnedMilestone,
  earnedCodes,
  nextUp,
  unlockedCodes,
} from "../domain/progression.js";
import type { TradeTypeCode } from "../domain/trade-types.js";
import { collapseActivity, type TradeActivityRecord } from "../observatory/activity-store.js";
import type { OrderAuditRecord } from "./order-audit-log.js";
import type { ProgressionStore } from "./progression-store.js";

/**
 * THE PROGRESSION SERVICE — composes the two ledgers into one per-participant progression view
 * (`domain/progression.ts` does the pure deriving; this layer only reads and folds). Everything
 * earnable is computed at read time from the ledgers, so there is no progress state to migrate
 * or drift — the fills ARE the progress. The store holds only what cannot be derived: the
 * training-wheels preference and which unlock celebrations were claimed.
 *
 * SEEDING (the existing-member migration, run lazily on first view): a member with fill history
 * gets wheels OFF and their past earns pre-acknowledged — the redesign never locks out someone
 * already trading, and never greets them with a wall of day-one fanfare. A brand-new member
 * (zero qualifying fills) gets wheels ON: the guided ladder is the default for new users.
 *
 * The COMMUNITY track (#567) folds in the same way from a third ledger, the feedback log — kept as
 * its own list rather than merged into `earned`, because its evidence is an issue number and not an
 * order id, and the ladder's fill-only shape is not something to blur. It rides the same
 * acknowledged set, so Claim works through one path.
 */

export interface ParticipantProgression {
  /** Training wheels on = the desk restricts trade types to the unlocked ladder. */
  readonly wheels: boolean;
  readonly earned: readonly EarnedMilestone[];
  readonly earnedByCode: ReadonlyMap<TradeTypeCode, EarnedMilestone>;
  readonly unlocked: ReadonlySet<TradeTypeCode>;
  /** The rung to chase next — undefined once the whole ladder is earned. */
  readonly nextUp?: TradeTypeCode;
  readonly points: number;
  readonly rank: Rank;
  readonly unlockedLevels: ReadonlySet<CourseLevel>;
  /** Earned but not yet celebrated — drives the one-time unlock banner. */
  readonly celebrating: readonly EarnedMilestone[];
  /** Community-track earns (`domain/community.ts`) — empty when no member email was supplied. */
  readonly contributions: readonly EarnedContribution[];
  /** Community earns awaiting their one-time celebration, same banner. */
  readonly celebratingContributions: readonly EarnedContribution[];
}

export interface ProgressionService {
  /** `memberEmail` unlocks the community track; without it the trade ladder answers alone. */
  view(participantId: string, memberEmail?: string): Promise<ParticipantProgression>;
  setWheels(participantId: string, on: boolean): Promise<void>;
  acknowledge(participantId: string, milestoneIds: readonly string[]): Promise<void>;
}

export interface ProgressionServiceDeps {
  /** Raw activity journal lines for one participant — the service collapses per order. */
  readonly readFills: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  /** The tagged per-order audit lines for one participant. */
  readonly readTags: (participantId: string) => Promise<readonly OrderAuditRecord[]>;
  /**
   * One member's own feedback filings, by their signed-in email — the wiring layer owns the
   * email→`opaqueMemberId` hash, so the identity shape stays in `feedback-issue.ts`. Omit and the
   * community track simply reads as unearned; it is never fabricated.
   */
  readonly readFilings?: (memberEmail: string) => Promise<readonly Filing[]>;
  /**
   * The preference store. Absent (offline/test wiring): wheels reads as OFF and nothing
   * celebrates — the desk simply doesn't restrict.
   */
  readonly store?: ProgressionStore;
  readonly now?: () => Date;
}

export function createProgressionService(deps: ProgressionServiceDeps): ProgressionService {
  const now = deps.now ?? (() => new Date());
  return {
    async view(participantId, memberEmail) {
      const [journal, tags, filings] = await Promise.all([
        deps.readFills(participantId),
        deps.readTags(participantId),
        memberEmail && deps.readFilings ? deps.readFilings(memberEmail) : Promise.resolve([]),
      ]);
      const fills = collapseActivity([...journal]);
      const earned = deriveEarned(fills, tags);
      const contributions = deriveContributions(filings);
      const codes = earnedCodes(earned);
      const unlocked = unlockedCodes(codes);
      const milestoneIds = new Set(earned.map((m) => m.milestoneId));
      const points = pointsFor(
        new Set([...milestoneIds, ...contributions.map((c) => c.milestoneId)]),
      );
      const next = nextUp(unlocked, codes);
      // Course locks follow completion order, UNIONED with any course already holding an earn —
      // seeded history with gaps must never render an earned milestone inside a "locked" course.
      const levels = unlockedLevels(milestoneIds);
      for (const c of COURSES) {
        if (c.milestones.some((m) => milestoneIds.has(m.id))) levels.add(c.level);
      }

      let record = deps.store?.get(participantId);
      if (deps.store && !record) {
        const hasHistory = fills.some((f) => f.filledQuantity > 0);
        record = deps.store.set(
          participantId,
          {
            trainingWheels: !hasHistory,
            acknowledged: [...earned, ...contributions].map((m) => m.milestoneId),
            since: now().toISOString(),
          },
          now(),
        ).participants[participantId];
      }
      const acknowledged = new Set(record?.acknowledged ?? []);
      const fresh = <T extends { readonly milestoneId: string; readonly at: string }>(
        all: readonly T[],
      ): readonly T[] =>
        record ? all.filter((m) => !acknowledged.has(m.milestoneId) && m.at >= record.since) : [];
      const celebrating = fresh(earned);

      return {
        wheels: record?.trainingWheels ?? false,
        earned,
        earnedByCode: new Map(earned.map((m) => [m.code, m])),
        unlocked,
        ...(next ? { nextUp: next } : {}),
        points,
        rank: rankFor(points),
        unlockedLevels: levels,
        celebrating,
        contributions,
        celebratingContributions: fresh(contributions),
      };
    },
    setWheels(participantId, on) {
      deps.store?.set(participantId, { trainingWheels: on }, now());
      return Promise.resolve();
    },
    acknowledge(participantId, milestoneIds) {
      // Only real curriculum ids are banked — the form field is ours, but never trusted.
      const known = new Set(ALL_COURSES.flatMap((c) => c.milestones.map((m) => m.id)));
      const ids = milestoneIds.filter((id) => known.has(id));
      if (deps.store && ids.length > 0) {
        const held = deps.store.get(participantId)?.acknowledged ?? [];
        deps.store.set(participantId, { acknowledged: [...new Set([...held, ...ids])] }, now());
      }
      return Promise.resolve();
    },
  };
}
