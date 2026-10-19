import { MAX_STEERED_ACCOUNTS, type WiredConviction } from "../autonomous/convictions-wire.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { SEEDED_CONVICTIONS } from "../playbooks/conviction-seeds.js";
import { ConvictionStore } from "../playbooks/conviction-store.js";
import { findPair, pairName } from "../playbooks/pair-table.js";
import type { MemberPointers } from "../subscriptions/conviction-pointer.js";
import type { SubscriptionsState } from "../subscriptions/subscription-state.js";
import type { MemberConvictionStore } from "./member-conviction-store.js";
import { pointConvictions } from "./subscription-seed-store.js";
import type { SubscriptionStore } from "./subscription-store.js";

/**
 * HANDING A MEMBER'S VIEW TO THEIR BOTS (#5482 slice 6c, criteria 3, 4, 5 and 8) — the step that
 * turns a saved draft into a view that steers. The member taps once; this decides whether it may,
 * which of their bots it may steer, and points those bots' subscriptions at it.
 *
 * WHICH BOTS: the session's own accounts (`resolveOwnedIds`, never a body field) that hold a
 * subscription to a pair the view steers. Those are written on the record, the bots resolve a
 * pointer at it only on them (`autonomous-convictions.ts`), so one member's view can never narrow or
 * stop another member's bot.
 *
 * WHEN IT MAY, judged again at the tap rather than trusted from the save: the store's rules over the
 * seeded records (a playbook's bounds may have moved since the draft was kept), every pair it steers
 * still run by one of their bots (a view narrows a pair; it never subscribes one), and no other view
 * of theirs already steering one of those pairs on those bots — two views on one pair would leave
 * which one narrows it to chance. A seeded view on the pair is not a clash: the hand-over takes over
 * from it, said on the row before the tap (`takesOver`), and taking the member's view back returns
 * the pair to it.
 *
 * THE POINTERS are one rule (`conviction-pointer.ts`), applied here at once and again by every
 * controls poll (`pollSeedsFromEnv`), so a write that fails halfway is finished on the next poll.
 *
 * Paper only, SIM. A view narrows what a pair may do and sets the day it is checked; the playbook
 * still picks every entry and exit, and nothing here places an order.
 */

const nameOf = (pairId: string): string => {
  const pair = findPair(pairId);
  return pair ? pairName(pair) : pairId;
};

const titleOf = (conviction: Conviction): string => conviction.title ?? conviction.id;

/** A pair named as members know it. */
export interface NamedPair {
  readonly pair: string;
  /** "the wheel on CRWV". */
  readonly name: string;
}

export type HandOverPlan =
  | { readonly ok: true; readonly accounts: readonly string[] }
  | { readonly ok: false; readonly problems: readonly string[] };

/** May this view be handed to these accounts' bots now, and to which of them. */
export function handOverPlan(
  conviction: Conviction,
  owned: readonly string[],
  state: SubscriptionsState,
  handedOver: readonly WiredConviction[],
): HandOverPlan {
  const steers = new Set(conviction.steers);
  const accounts = owned.filter((id) => (state[id] ?? []).some((s) => steers.has(s.playbookId)));
  const run = new Set(owned.flatMap((id) => (state[id] ?? []).map((s) => s.playbookId)));
  const refused = new ConvictionStore([...SEEDED_CONVICTIONS, conviction]).refused.find(
    (r) => r.id === conviction.id,
  );
  const problems = [
    ...(refused?.problems ?? []),
    ...conviction.steers
      .filter((pair) => !run.has(pair))
      .map(
        (pair) =>
          `none of your bots runs ${nameOf(pair)} any more; change the view to steer only pairs they run`,
      ),
    ...(accounts.length > MAX_STEERED_ACCOUNTS
      ? [`a view can steer up to ${MAX_STEERED_ACCOUNTS} of your bots at once`]
      : []),
    ...handedOver
      .filter((other) => other.conviction.id !== conviction.id)
      .filter((other) => other.accounts.some((id) => accounts.includes(id)))
      .flatMap((other) =>
        other.conviction.steers
          .filter((pair) => steers.has(pair))
          .map(
            (pair) =>
              `${nameOf(pair)} is already steered by your view "${titleOf(other.conviction)}"; take that one back first`,
          ),
      ),
  ];
  if (problems.length > 0) return { ok: false, problems };
  return accounts.length > 0
    ? { ok: true, accounts }
    : { ok: false, problems: ["none of your bots runs a pair this view steers"] };
}

/** The pairs on these accounts whose subscription points at this view right now — what the row
 *  says it steers, read from the pointers rather than assumed from the status. */
export function pointedPairs(
  id: string,
  owned: readonly string[],
  state: SubscriptionsState,
): readonly NamedPair[] {
  const pairs = new Set(
    owned.flatMap((account) =>
      (state[account] ?? []).filter((s) => s.convictionId === id).map((s) => s.playbookId),
    ),
  );
  return [...pairs].sort().map((pair) => ({ pair, name: nameOf(pair) }));
}

/** A pair whose subscription another view steers now, which a hand-over would take over. */
export interface TakeOver extends NamedPair {
  /** The view steering it now, by its title. */
  readonly from: string;
}

/** What handing this view over would take over: the pairs it steers on these accounts that point
 *  at another view now (the seeded AI-dip view, say). */
export function takesOver(
  conviction: Conviction,
  owned: readonly string[],
  state: SubscriptionsState,
  held: ConvictionStore,
): readonly TakeOver[] {
  const seen = new Map<string, TakeOver>();
  for (const account of owned) {
    for (const sub of state[account] ?? []) {
      const from = sub.convictionId;
      if (!(from && from !== conviction.id && conviction.steers.includes(sub.playbookId))) continue;
      const record = held.get(from);
      seen.set(sub.playbookId, {
        pair: sub.playbookId,
        name: nameOf(sub.playbookId),
        from: record ? titleOf(record) : from,
      });
    }
  }
  return [...seen.values()];
}

/** The records the bots act on: the seeded ones, then the members' views handed over. A member's
 *  record the store refuses (a seeded id) is left out, exactly as the bots leave it out. */
export function heldConvictions(members: MemberConvictionStore | undefined): ConvictionStore {
  return new ConvictionStore([
    ...SEEDED_CONVICTIONS,
    ...(members?.handedOver() ?? []).map((w) => w.conviction),
  ]);
}

/**
 * Apply the pointer rule now, after a hand-over, take-back, edit or delete. `gone` names a view id
 * just removed from the store (deleted, or renamed by an edit): no longer in the store's ids, a
 * pointer at it would otherwise be kept, so it is named for this one pass.
 */
export function repoint(
  subscriptions: SubscriptionStore,
  members: MemberConvictionStore,
  at: Date,
  gone?: string,
): readonly string[] {
  const read = members.pointers();
  const pointers: MemberPointers = gone
    ? { heldBy: read.heldBy, ids: new Set([...read.ids, gone]) }
    : read;
  return pointConvictions(subscriptions, at, pointers);
}
