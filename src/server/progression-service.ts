import { type CheckResult, gradeCheck } from "../domain/comprehension.js";
import { checkFor } from "../domain/comprehension-checks.js";
import {
  COURSES,
  type CourseLevel,
  pointsFor,
  type Rank,
  rankFor,
  unlockedLevels,
} from "../domain/curriculum.js";
import {
  deriveEngagementEarned,
  type EarnedEngagement,
  ENGAGEMENT_MILESTONES,
} from "../domain/engagement.js";
import {
  deriveEarned,
  type EarnedMilestone,
  earnedCodes,
  lockedOnLadder,
  nextUp,
  unlockedCodes,
} from "../domain/progression.js";
import type { TradeTypeCode } from "../domain/trade-types.js";
import { collapseActivity, type TradeActivityRecord } from "../observatory/activity-store.js";
import type { FeedbackLogEntry } from "./feedback-log.js";
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
 * THE COMPREHENSION GATE sits on top of that, never in place of it: a fill still earns the
 * milestone, but where `domain/comprehension-checks.ts` has a check for it, the celebration waits
 * on that check passing. Grading happens HERE, server-side, and only the pass is written — the
 * browser posts answer indices and is never asked, or believed, about the verdict. A milestone
 * with no check is untouched: it flows straight to `celebrating` exactly as it did before.
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
  /**
   * Earned, gated by a comprehension check, and that check not yet passed. These are held back
   * from `celebrating` until the member shows they understood the play they just made.
   */
  readonly pendingChecks: readonly EarnedMilestone[];
  /** The engagement track — earned by an action, not a fill. Empty when `readFeedback`
   *  isn't wired (offline builds), same absence-means-absence convention as `store`. */
  readonly engagementEarned: readonly EarnedEngagement[];
  /** Fresh engagement earns awaiting their one-time celebration — no comprehension gate exists
   *  for this track, so every fresh earn is celebrating immediately. */
  readonly engagementCelebrating: readonly EarnedEngagement[];
}

/** Locked = training wheels on and the ladder hasn't opened this code yet. */
export function playLocked(
  code: TradeTypeCode,
  progression: ParticipantProgression | undefined,
): boolean {
  return lockedOnLadder(code, progression);
}

/**
 * The shape `learn-json-view.ts` builds its JSON journey from — mirrors `ParticipantProgression`
 * but keeps the view's dependency to domain types only (no server-layer coupling from the JSON
 * producer back into this file's service plumbing).
 */
export interface AcademyProgress {
  readonly earned: readonly EarnedMilestone[];
  readonly points: number;
  readonly rank: Rank;
  readonly unlockedLevels: ReadonlySet<CourseLevel>;
  /** Fresh earns awaiting their one-time celebration. */
  readonly celebrating?: readonly EarnedMilestone[];
  /** Fresh earns still gated on a comprehension check. */
  readonly pendingChecks?: readonly EarnedMilestone[];
  /** Fresh engagement earns awaiting their one-time celebration. */
  readonly engagementCelebrating?: readonly EarnedEngagement[];
}

export interface ProgressionService {
  view(participantId: string): Promise<ParticipantProgression>;
  setWheels(participantId: string, on: boolean): Promise<void>;
  acknowledge(participantId: string, milestoneIds: readonly string[]): Promise<void>;
  /**
   * Grade one comprehension check and bank a pass. `answers` maps question id → the posted option
   * index; nothing about the verdict is taken from the caller. Undefined = no such gated
   * milestone, so there was nothing to grade.
   */
  submitCheck(
    participantId: string,
    milestoneId: string,
    answers: ReadonlyMap<string, string>,
  ): Promise<CheckResult | undefined>;
}

export interface ProgressionServiceDeps {
  /** Raw activity journal lines for one participant — the service collapses per order. */
  readonly readFills: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  /** The tagged per-order audit lines for one participant. */
  readonly readTags: (participantId: string) => Promise<readonly OrderAuditRecord[]>;
  /** This participant's filed feedback (the engagement track). Absent: the track reads as
   *  earned nothing, same as an absent `store` reads as no wheels/no celebration. */
  readonly readFeedback?: (participantId: string) => Promise<readonly FeedbackLogEntry[]>;
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
    async view(participantId) {
      const [journal, tags, feedback] = await Promise.all([
        deps.readFills(participantId),
        deps.readTags(participantId),
        deps.readFeedback?.(participantId) ?? Promise.resolve([]),
      ]);
      const fills = collapseActivity([...journal]);
      const earned = deriveEarned(fills, tags);
      const engagementEarned = deriveEngagementEarned(feedback.map((f) => f.filedAt));
      const codes = earnedCodes(earned);
      const unlocked = unlockedCodes(codes);
      const milestoneIds = new Set(earned.map((m) => m.milestoneId));
      const points = pointsFor(milestoneIds);
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
            // Pre-acknowledge whatever is ALREADY true on first view, trade and engagement
            // alike — a member who filed feedback before this track existed gets the count, not
            // a day-one fanfare wall (same rule the trade ladder's own seeding already follows).
            acknowledged: [...earned, ...engagementEarned].map((m) => m.milestoneId),
            since: now().toISOString(),
          },
          now(),
        ).participants[participantId];
      }
      const acknowledged = new Set(record?.acknowledged ?? []);
      const fresh = record
        ? earned.filter((m) => !acknowledged.has(m.milestoneId) && m.at >= record.since)
        : [];
      // Gated = a check exists for it AND this member hasn't passed that check yet.
      const passed = new Set(record?.comprehension ?? []);
      const gated = (m: EarnedMilestone) =>
        Boolean(checkFor(m.milestoneId)) && !passed.has(m.milestoneId);
      const pendingChecks = fresh.filter(gated);
      const celebrating = fresh.filter((m) => !gated(m));
      // No comprehension gate exists for this track (it isn't a trade play to be quizzed on) —
      // every fresh engagement earn goes straight to celebrating.
      const engagementCelebrating = record
        ? engagementEarned.filter((m) => !acknowledged.has(m.milestoneId) && m.at >= record.since)
        : [];

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
        pendingChecks,
        engagementEarned,
        engagementCelebrating,
      };
    },
    setWheels(participantId, on) {
      deps.store?.set(participantId, { trainingWheels: on }, now());
      return Promise.resolve();
    },
    acknowledge(participantId, milestoneIds) {
      // Only real curriculum + engagement ids are banked — the form field is ours, but never
      // trusted.
      const known = new Set([
        ...COURSES.flatMap((c) => c.milestones.map((m) => m.id)),
        ...ENGAGEMENT_MILESTONES.map((m) => m.id),
      ]);
      const ids = milestoneIds.filter((id) => known.has(id));
      if (deps.store && ids.length > 0) {
        const held = deps.store.get(participantId)?.acknowledged ?? [];
        deps.store.set(participantId, { acknowledged: [...new Set([...held, ...ids])] }, now());
      }
      return Promise.resolve();
    },
    submitCheck(participantId, milestoneId, answers) {
      const check = checkFor(milestoneId);
      if (!check) return Promise.resolve(undefined);
      const result = gradeCheck(check, answers);
      // Only a PASS is durable. A miss leaves no trace beyond the page it renders — retries are
      // unlimited on purpose, because a permanent block on an educational desk teaches nothing.
      if (result.passed && deps.store) {
        const held = deps.store.get(participantId)?.comprehension ?? [];
        deps.store.set(
          participantId,
          { comprehension: [...new Set([...held, check.milestoneId])] },
          now(),
        );
      }
      return Promise.resolve(result);
    },
  };
}
