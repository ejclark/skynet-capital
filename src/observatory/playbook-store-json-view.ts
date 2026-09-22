/**
 * THE PLAYBOOK STORE, as data (issue #885) — the catalog merged with one account's own
 * subscriptions. No cross-account visibility (Eric, settled fork): the caller passes only the
 * viewer's OWN subscriptions (or none, for a viewer who doesn't own this desk), never another
 * account's.
 */

import {
  type PlaybookMetric,
  type PlaybookStoreEntry,
  playbookStoreCatalog,
} from "../discovery/playbook-store.js";
import { type DelegationGateView, delegationGateView } from "../domain/playbook-delegation.js";
import type { PlaybookSubscription } from "../domain/types.js";
import { whipsawStatsByPlaybook } from "../trading/playbook-whipsaw.js";
import type { RoundTrip } from "../trading/round-trips.js";

interface PlaybookStoreCardView extends PlaybookStoreEntry {
  readonly subscription?: {
    readonly mode: PlaybookSubscription["mode"];
    readonly capitalAllocated: number;
    readonly enabled: boolean;
    /** Symbol-targeting filter (#885) — absent means unrestricted. */
    readonly symbols?: readonly string[];
    /** Owner opt-in to hold trading dark until warmed up (#3543) — absent means off, the
     *  always-on default every subscription had before this field existed. */
    readonly requireWarmup?: boolean;
    /** Owner opt-in to compound this subscription's budget with its own realized P/L (issue
     *  #3527 slice 3) — absent means off, the flat-budget default every subscription had before
     *  this field existed. */
    readonly compoundAllocation?: boolean;
  };
}

export interface PlaybookStoreView {
  readonly cards: readonly PlaybookStoreCardView[];
  /** Sum of capitalAllocated across this account's ENABLED subscriptions (Eric, #885: "the
   *  summation of money being managed under playbooks could be an interesting metric"). */
  readonly capitalUnderManagement: number;
  /** Whether the viewer may subscribe at all — absent when nobody's account is open here. */
  readonly canManage: boolean;
  /**
   * The delegation fog (#1707) — whether NEW subscriptions are held until rung 102, and the words
   * the door is drawn with. Always present so the client never has to invent the copy; `locked`
   * false is the ordinary case (wheels off, rung earned, or no progression wired at all).
   * Never gates unsubscribe, pause, or resume — an exit is not a lesson.
   */
  readonly delegation: DelegationGateView;
}

/** "23% whipsaw (12 round trips)" once measured; "not yet measured (2/5 round trips)" below the
 *  sample floor — never a bare percentage from a handful of trips (#3543's honesty invariant).
 *  `heldForWarmup` (true only when the OWNER opted into `requireWarmup` on this exact
 *  subscription AND it's still unmeasured) sharpens the unmeasured copy to say so plainly —
 *  display only; nothing here actually holds an order today, see `requireWarmup`'s own doc. */
function whipsawMetric(
  stats: ReturnType<typeof whipsawStatsByPlaybook>[number],
  heldForWarmup: boolean,
): PlaybookMetric {
  const value = stats.measured
    ? `${Math.round((stats.whipsawRate ?? 0) * 100)}% whipsaw (${stats.roundTrips} round trips)`
    : heldForWarmup
      ? `warming up — trading held (${stats.roundTrips} round trips)`
      : `not yet measured (${stats.roundTrips} round trips)`;
  return { label: "Whipsaw rate", value };
}

export function playbookStoreView(
  subscriptions: readonly PlaybookSubscription[] | undefined,
  delegationLocked = false,
  /** The viewing account's OWN closed round-trips (#3543 slice 2) — never another account's,
   *  same "no cross-account visibility" boundary #885 already settled for subscriptions. Defaults
   *  to none: a caller not yet passing them gets the bare catalog metrics, exactly as before this
   *  parameter existed. */
  roundTrips: readonly RoundTrip[] = [],
): PlaybookStoreView {
  const byPlaybookId = new Map(subscriptions?.map((s) => [s.playbookId, s]));
  const whipsawByPlaybookId = new Map(
    whipsawStatsByPlaybook(roundTrips).map((stats) => [stats.playbookId, stats]),
  );
  const cards = playbookStoreCatalog().map((entry) => {
    const sub = byPlaybookId.get(entry.id);
    const whipsaw = whipsawByPlaybookId.get(entry.id);
    const heldForWarmup = Boolean(sub?.requireWarmup);
    return {
      ...entry,
      ...(whipsaw ? { metrics: [...entry.metrics, whipsawMetric(whipsaw, heldForWarmup)] } : {}),
      ...(sub
        ? {
            subscription: {
              mode: sub.mode,
              capitalAllocated: sub.capitalAllocated,
              enabled: sub.enabled,
              ...(sub.symbols ? { symbols: sub.symbols } : {}),
              ...(sub.requireWarmup ? { requireWarmup: true } : {}),
              ...(sub.compoundAllocation ? { compoundAllocation: true } : {}),
            },
          }
        : {}),
    };
  });
  const capitalUnderManagement = (subscriptions ?? [])
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.capitalAllocated, 0);
  return {
    cards,
    capitalUnderManagement,
    canManage: subscriptions !== undefined,
    delegation: delegationGateView(delegationLocked),
  };
}
