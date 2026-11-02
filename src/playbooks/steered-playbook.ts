import type { PlaybookSubscription } from "../domain/types.js";
import {
  adoptedHold,
  adoptedHoldReason,
  adoptedRules,
  type HoldLookup,
  type RuleLookup,
} from "./conviction-adoptions.js";
import type { Conviction } from "./conviction-record.js";
import { type Narrowing, resolveSteering, type Steering } from "./conviction-steering.js";
import { type ConvictionLookup, lookupConviction } from "./conviction-store.js";
import type { PairRule } from "./fence-studies.js";
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
 *
 * A PAIR'S OWN RULE (#6598 slice 3). When a passed claim's fence was adopted on a study's *adopt*
 * call (a `pair-rule` line), every subscription to the pair runs inside it, pointed or not. It goes
 * through the same narrow-only resolver; where it and a view fence the same setting, the narrower
 * of the two stands (`narrower`), so neither can loosen the other. A rule refused against the
 * playbook's bounds refuses the pair whole, exits-only. No line states one today.
 */
export type SteeredPlaybook =
  | { readonly playbook: Playbook; readonly says: readonly string[] }
  | { readonly playbook: Playbook; readonly refused: string };

/** Two steerings as one: on each setting, the narrower; undefined when together they leave no
 *  days to expiry. */
export function narrower(a: Steering, b: Steering): Steering | undefined {
  const pick = <T>(x: T | undefined, y: T | undefined, f: (x: T, y: T) => T): T | undefined =>
    x === undefined ? y : y === undefined ? x : f(x, y);
  const dte = pick(a.dte, b.dte, (x, y) => ({
    min: Math.max(x.min, y.min),
    max: Math.min(x.max, y.max),
  }));
  if (dte && dte.min > dte.max) return undefined;
  const out: { -readonly [K in keyof Steering]: Steering[K] } = {};
  if (dte) out.dte = dte;
  const expiryFrom = pick(a.expiryFrom, b.expiryFrom, (x, y) => (x > y ? x : y));
  if (expiryFrom !== undefined) out.expiryFrom = expiryFrom;
  const strikeMax = pick(a.strikeMax, b.strikeMax, Math.min);
  if (strikeMax !== undefined) out.strikeMax = strikeMax;
  const quiet = pick(a.quietSessionsAfterPrint, b.quietSessionsAfterPrint, Math.max);
  if (quiet !== undefined) out.quietSessionsAfterPrint = quiet;
  const contractsMax = pick(a.contractsMax, b.contractsMax, Math.min);
  if (contractsMax !== undefined) out.contractsMax = contractsMax;
  return out;
}

export function steeredBy(
  playbook: Playbook,
  sub: Pick<PlaybookSubscription, "convictionId" | "playbookId">,
  lookup: ConvictionLookup = lookupConviction,
  holds: HoldLookup = adoptedHold,
  rules: RuleLookup = adoptedRules,
): SteeredPlaybook {
  const unchanged = { playbook, says: [] } as const;
  const own = rules(sub.playbookId);
  if (sub.convictionId === undefined) {
    return own.length === 0 ? unchanged : fenced(playbook, own, []);
  }
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
  if (narrow.length === 0 && own.length === 0) return unchanged;
  return fenced(playbook, own, narrow, record);
}

/** The playbook rebuilt inside its pair's own rules and a view's narrowings, or why it is refused. */
function fenced(
  playbook: Playbook,
  own: readonly PairRule[],
  narrow: readonly Narrowing[],
  record?: Conviction,
): SteeredPlaybook {
  const { steerable } = playbook;
  if (!steerable) {
    return { playbook, refused: `${playbook.id} has no bounds a conviction can narrow` };
  }
  const ownRead = resolveSteering(own, steerable.bounds, []);
  if (!ownRead.ok) {
    return { playbook, refused: `${playbook.id}'s own rule is refused whole: ${ownRead.reason}` };
  }
  if (!record) {
    return {
      playbook: steerable.steer(ownRead.steering),
      says: ownRead.says.map((s) => `the pair's own rule: ${s}`),
    };
  }
  const resolved = resolveSteering(narrow, steerable.bounds, record.claims);
  if (!resolved.ok) {
    return { playbook, refused: `conviction "${record.id}" is refused whole: ${resolved.reason}` };
  }
  if (own.length === 0)
    return { playbook: steerable.steer(resolved.steering), says: resolved.says };
  const both = narrower(ownRead.steering, resolved.steering);
  if (!both) {
    return {
      playbook,
      refused: `${playbook.id}'s own rule and conviction "${record.id}" leave no days to expiry`,
    };
  }
  return {
    playbook: steerable.steer(both),
    says: [...ownRead.says.map((s) => `the pair's own rule: ${s}`), ...resolved.says],
  };
}
