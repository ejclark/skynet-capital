import type { PlaybookSubscription } from "../domain/types.js";
import { adoptedHold, adoptedHoldReason, type HoldLookup } from "./conviction-adoptions.js";
import { resolveSteering } from "./conviction-steering.js";
import { type ConvictionLookup, lookupConviction } from "./conviction-store.js";
import type { Playbook } from "./playbook.js";

/**
 * THE PLAYBOOK A SUBSCRIPTION ACTUALLY RUNS, ONCE ITS CONVICTION HAS NARROWED IT (#5482 slice 4,
 * criteria 3 and 4). A subscription that points at a conviction record steering its pair
 * (`convictionId`, the same pointer the check date follows) runs the playbook rebuilt inside that
 * record's narrowings for the pair. Nobody else does: another member's subscription to the same
 * house playbook is not steered by Eric's view.
 *
 * The result is one of three, and never an order:
 *  - `playbook` unchanged, nothing said: no pointer, or a record that narrows nothing on this pair;
 *  - `playbook` narrowed, with `says` naming each fence for the boot log;
 *  - `refused`: the narrowing would widen a bound (or points at a study that is not attached), or
 *    the pointer names a record this lookup does not hold, or one that does not steer this pair.
 *    Refused WHOLE, with the reason, and the pair fails safe: the caller runs it exits-only, so
 *    what it holds still exits and nothing new opens. Running it unnarrowed instead would trade
 *    wider than its owner meant to.
 *
 * WHY A RECORD NOT HELD IS REFUSED (#5482 slice 6c). A seeded record ships with the build, so the
 * bots always hold it. A member's record arrives over the controls poll (`convictions-wire.ts`), and
 * a pointer at one can be read before the record is: a boot on the kept subscriptions while the
 * dashboard is down, or a record whose owner's bot is not one it may steer. Its narrowings are
 * unknown then, so the pair opens nothing until they are.
 *
 * WHY A RECORD THAT DOES NOT STEER THE PAIR IS REFUSED TOO (#5482 slice 2, the contract step's
 * piece 2). A pointed subscription is checked on its pointer alone, never on the inline conviction
 * beside it (`statedCheck`), so a pointer that cannot be used gives the pair no check day. Running
 * it unnarrowed and unchecked would be the one state no owner chose. The pointer rule only ever
 * points at a record steering the pair (`conviction-pointer.ts`), so this is the gap between a
 * record changing and the next poll re-pointing, and the pair waits it out exits-only.
 *
 * WHY AN ADOPTED HOLD IS REFUSED TOO (#5482 criterion 6). When a claim a pair's fence rests on fails
 * and Eric merges the change it proposes (`conviction-adoptions.ts`), the view still steers the pair
 * but the pair opens nothing new under it. The pointer stays, so nothing is re-pointed or logged;
 * the refusal carries the claim and the day, and the same exits-only path runs it.
 */
export type SteeredPlaybook =
  | { readonly playbook: Playbook; readonly says: readonly string[] }
  | { readonly playbook: Playbook; readonly refused: string };

export function steeredBy(
  playbook: Playbook,
  sub: Pick<PlaybookSubscription, "convictionId" | "playbookId">,
  lookup: ConvictionLookup = lookupConviction,
  holds: HoldLookup = adoptedHold,
): SteeredPlaybook {
  const unchanged = { playbook, says: [] } as const;
  if (sub.convictionId === undefined) return unchanged;
  const record = lookup(sub.convictionId);
  if (!record) {
    return {
      playbook,
      refused: `points at conviction "${sub.convictionId}", which these bots do not hold`,
    };
  }
  if (!record.steers.includes(sub.playbookId)) {
    return {
      playbook,
      refused: `points at conviction "${sub.convictionId}", which does not steer ${sub.playbookId}`,
    };
  }
  const hold = holds(record.id, sub.playbookId);
  if (hold) return { playbook, refused: adoptedHoldReason(record, hold) };
  const narrow = (record.narrowings ?? [])
    .filter((n) => n.pair === sub.playbookId)
    .flatMap((n) => n.narrow);
  if (narrow.length === 0) return unchanged;
  const { steerable } = playbook;
  if (!steerable) {
    return { playbook, refused: `${playbook.id} has no bounds a conviction can narrow` };
  }
  const resolved = resolveSteering(narrow, steerable.bounds, record.claims);
  if (!resolved.ok) {
    return { playbook, refused: `conviction "${record.id}" is refused whole: ${resolved.reason}` };
  }
  return { playbook: steerable.steer(resolved.steering), says: resolved.says };
}
