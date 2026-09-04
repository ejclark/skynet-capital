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
