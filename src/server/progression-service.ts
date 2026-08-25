import {
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

/**
 * THE PROGRESSION SERVICE — composes the two ledgers into one per-participant progression view
 * (`domain/progression.ts` does the pure deriving; this layer only reads and folds). Everything
 * is computed at read time from the ledgers, so there is no progress state to migrate or drift —
 * the fills ARE the progress.
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
}

export interface ProgressionService {
  view(participantId: string): Promise<ParticipantProgression>;
  setWheels(participantId: string, on: boolean): Promise<void>;
  acknowledge(participantId: string, milestoneIds: readonly string[]): Promise<void>;
}

export interface ProgressionServiceDeps {
  /** Raw activity journal lines for one participant — the service collapses per order. */
  readonly readFills: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  /** The tagged per-order audit lines for one participant. */
  readonly readTags: (participantId: string) => Promise<readonly OrderAuditRecord[]>;
  readonly now?: () => Date;
}

export function createProgressionService(deps: ProgressionServiceDeps): ProgressionService {
  return {
    async view(participantId) {
      const [journal, tags] = await Promise.all([
        deps.readFills(participantId),
        deps.readTags(participantId),
      ]);
      const earned = deriveEarned(collapseActivity([...journal]), tags);
      const codes = earnedCodes(earned);
      const unlocked = unlockedCodes(codes);
      const milestoneIds = new Set(earned.map((m) => m.milestoneId));
      const points = pointsFor(milestoneIds);
      const next = nextUp(unlocked, codes);
      return {
        // Preference persistence (the wheels toggle + celebration acks) arrives with the
        // progression store; until then the desk behaves as wheels-off and celebrates nothing.
        wheels: false,
        earned,
        earnedByCode: new Map(earned.map((m) => [m.code, m])),
        unlocked,
        ...(next ? { nextUp: next } : {}),
        points,
        rank: rankFor(points),
        unlockedLevels: unlockedLevels(milestoneIds),
        celebrating: [],
      };
    },
    setWheels() {
      return Promise.resolve();
    },
    acknowledge() {
      return Promise.resolve();
    },
  };
}
