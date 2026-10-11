import { COURSES, type CourseLevel, unlockedLevels } from "../domain/curriculum.js";
import type { EarnedEngagement } from "../domain/engagement.js";
import { ladderGated, nextUp, unlockedCodes } from "../domain/progression.js";
import type { TradeTypeCode } from "../domain/trade-types.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { ProgressionStore } from "./progression-store.js";

/**
 * PROGRESSION SERVICE SUPPORT — the seeding and gate helpers `createProgressionService` folds
 * per view, split out at the 300-line cap (`scripts/arch-scan.mjs`). Pure or store-reading only;
 * `progression-service.ts` keeps the one class of business it composes them into.
 */

/**
 * SEEDING, on first view: a member with fill history gets wheels OFF and every earn already true
 * pre-acknowledged — trade and engagement alike, so a member who filed feedback before that track
 * existed gets the count, not a day-one fanfare wall. A brand-new member gets wheels ON. No store
 * (offline builds) → no record, and the view reports wheels off.
 */
export function seedRecord(
  store: ProgressionStore | undefined,
  participantId: string,
  now: () => Date,
  fills: readonly TradeActivityRecord[],
  alreadyTrue: readonly { readonly milestoneId: string }[],
) {
  const held = store?.get(participantId);
  if (!store || held) return held;
  return store.set(
    participantId,
    {
      trainingWheels: !fills.some((f) => f.filledQuantity > 0),
      acknowledged: alreadyTrue.map((m) => m.milestoneId),
      since: now().toISOString(),
    },
    now(),
  ).participants[participantId];
}

/**
 * Which rungs are open, and what to chase. The message gate (#1119) sits in front of the ladder
 * order: wheels on and nothing said yet → only what is already earned is open, and nothing is
 * "next up" until she hears from the member. Wheels off is never gated.
 */
export function openLadder(
  wheels: boolean,
  codes: ReadonlySet<TradeTypeCode>,
  satisfiedIds: ReadonlySet<string>,
) {
  const gated = ladderGated(wheels, satisfiedIds);
  const unlocked = gated ? codes : unlockedCodes(codes);
  return { wheels, gated, unlocked, next: gated ? undefined : nextUp(unlocked, codes) };
}

/**
 * Which course levels the Milestones page shows OPEN — the desk's own lock rule, so the chapter
 * never calls a level locked that the ticket would trade (#5178: wheels off, the strip said
 * "nothing is locked" while levels 200–500 still showed a lock). Wheels off locks nothing. Wheels
 * on: completion order (level 100 always), UNIONED with any course already holding an earn —
 * seeded history with gaps must never render an earned milestone inside a "locked" course — and
 * any course with a rung the ladder has open.
 */
export function openLevels(
  wheels: boolean,
  milestoneIds: ReadonlySet<string>,
  ladderOpen: ReadonlySet<TradeTypeCode>,
): ReadonlySet<CourseLevel> {
  if (!wheels) return new Set(COURSES.map((c) => c.level));
  const levels = unlockedLevels(milestoneIds);
  for (const c of COURSES) {
    const open = c.milestones.some(
      (m) => milestoneIds.has(m.id) || (m.tradeType !== undefined && ladderOpen.has(m.tradeType)),
    );
    if (open) levels.add(c.level);
  }
  return levels;
}

/** The gate's own satisfied-ids set: the engagement earn, plus the grandfather clause for anyone
 *  who filed real feedback before the message log existed (`ladderGated`'s doc). Never feeds
 *  `engagementEarned` itself — a filing is never invented as a message earn, only a gate pass. */
export function gateSatisfiedIds(
  engagementEarned: readonly EarnedEngagement[],
  feedback: readonly unknown[],
): ReadonlySet<string> {
  return new Set([
    ...engagementEarned.map((m) => m.milestoneId),
    ...(feedback.length > 0 ? ["first-feedback"] : []),
  ]);
}
