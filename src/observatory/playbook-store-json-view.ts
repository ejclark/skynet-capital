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
import {
  type PairRowEntry,
  type StrategyCardEntry,
  strategyCatalog,
} from "../discovery/playbook-store-strategies.js";
import { type BotsOnlyGateView, botsOnlyGateView } from "../domain/playbook-bots-only.js";
import { type DelegationGateView, delegationGateView } from "../domain/playbook-delegation.js";
import type { PlaybookSubscription, SubscriptionConviction } from "../domain/types.js";
import { findPair, type Pair, type StrategyId } from "../playbooks/pair-table.js";
import { budgetedOn } from "../subscriptions/strategy-budgets.js";
import {
  handOffNote,
  needsConviction,
  newSubscriptionRefusal,
  notTradingNote,
  subscribedPairs,
} from "../subscriptions/subscribe-eligibility.js";
import type { StrategyAllocation } from "../subscriptions/subscriptions-file.js";
import { whipsawStatsByPlaybook } from "../trading/playbook-whipsaw.js";
import type { RoundTrip } from "../trading/round-trips.js";

interface SubscriptionView {
  readonly mode: PlaybookSubscription["mode"];
  /** Absent = uncapped (no subscription budget — #4535's seeded house roster). */
  readonly capitalAllocated?: number;
  readonly enabled: boolean;
  /** Symbol-targeting filter (#885) — absent means unrestricted. */
  readonly symbols?: readonly string[];
  /** Owner opt-in to compound this subscription's budget with its own realized P/L (issue
   *  #3527 slice 3) — absent means off, the flat-budget default every subscription had before
   *  this field existed. */
  readonly compoundAllocation?: boolean;
  /** The owner's conviction on this pair: why, and the market day it is checked (#4469 3c). */
  readonly conviction?: SubscriptionConviction;
}

/** The account's allocation for a strategy, and what its tickers' budgets add up to inside it. */
interface StrategyAllocationView {
  readonly capitalAllocated: number;
  /** The budgets the owner set on this strategy's pairs, on or paused; compounding rides on top. */
  readonly budgeted: number;
}

/** The old per-playbook card — kept one release beside `strategies` (#4469 slice 3a). */
interface PlaybookStoreCardView extends PlaybookStoreEntry {
  readonly subscription?: SubscriptionView;
}

/** One pair on a strategy card, joined to the viewer's own account. */
interface PairRowView extends PairRowEntry {
  /** The account's subscription to this pair id, on or paused. */
  readonly subscription?: SubscriptionView;
  /** Why a NEW subscription to this pair would be refused — the API's own sentence (criterion 9).
   *  Only for a viewer who may manage the account and holds no subscription to it. */
  readonly subscribeRefusal?: string;
  /** The study does not back this pair and its strategy runs on conviction (criterion 2): a new
   *  subscription needs the owner's reason and check day. `subscribeRefusal` is judged as if they
   *  were given, so the row is offered and the form asks for them. */
  readonly needsConviction?: true;
  /** A share pair whose ticker an option pair on this bot takes: "the call spread trades NVDA on
   *  this bot; the pre-print run-up yields it" — today's hand-off, not a refusal. */
  readonly handOff?: string;
  /** An option pair the bot refuses because another option pair it reads first owns the ticker:
   *  "not trading — the call spread owns NVDA". */
  readonly notTrading?: string;
}

interface StrategyCardView extends Omit<StrategyCardEntry, "pairs"> {
  readonly pairs: readonly PairRowView[];
  /** Set only for a viewer who manages the account, and only once its owner sets one. */
  readonly allocation?: StrategyAllocationView;
}

export interface PlaybookStoreView {
  /** One card per playbook id — the shape the app renders today, kept one release (#4469 3a). */
  readonly cards: readonly PlaybookStoreCardView[];
  /** One card per strategy, a row per pair — what slice 3b moves the Store onto. */
  readonly strategies: readonly StrategyCardView[];
  /** Sum of capitalAllocated across this account's ENABLED subscriptions (Eric, #885: "the
   *  summation of money being managed under playbooks could be an interesting metric"). An
   *  uncapped subscription has no allocation to add, so it contributes nothing. */
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
  /**
   * Only bot accounts subscribe for now (#4610): locked when the selected account is a human
   * account the viewer owns. Always present, like `delegation`, so the client never invents the
   * copy. Checked before the delegation fog, the server's own order. Never gates unsubscribe,
   * pause or resume.
   */
  readonly botsOnly: BotsOnlyGateView;
}

/** "23% whipsaw (12 round trips)" once measured; "not yet measured (2/5 round trips)" below the
 *  sample floor — never a bare percentage from a handful of trips (#3543's honesty invariant). */
function whipsawMetric(stats: ReturnType<typeof whipsawStatsByPlaybook>[number]): PlaybookMetric {
  const value = stats.measured
    ? `${Math.round((stats.whipsawRate ?? 0) * 100)}% whipsaw (${stats.roundTrips} round trips)`
    : `not yet measured (${stats.roundTrips} round trips)`;
  return { label: "Whipsaw rate", value };
}

function subscriptionView(sub: PlaybookSubscription): SubscriptionView {
  return {
    mode: sub.mode,
    ...(sub.capitalAllocated !== undefined ? { capitalAllocated: sub.capitalAllocated } : {}),
    enabled: sub.enabled,
    ...(sub.symbols ? { symbols: sub.symbols } : {}),
    ...(sub.compoundAllocation ? { compoundAllocation: true } : {}),
    ...(sub.conviction
      ? { conviction: { reason: sub.conviction.reason, checkOn: sub.conviction.checkOn } }
      : {}),
  };
}

/** What the bot does with a pair it subscribes to, beyond running it: yield its ticker to an option
 *  pair, or be refused because another option pair owns the ticker. */
function subscribedNotes(id: string, onBot: readonly Pair[]): Partial<PairRowView> {
  const pair = findPair(id);
  const handOff = pair ? handOffNote(pair, onBot) : undefined;
  const notTrading = pair ? notTradingNote(pair, onBot) : undefined;
  return { ...(handOff ? { handOff } : {}), ...(notTrading ? { notTrading } : {}) };
}

/** The strategy cards with the viewer's own account joined on each row's pair id. A viewer who
 *  does not manage the account (no `subscriptions`) gets the bare rows. */
function strategyCardsView(
  subscriptions: readonly PlaybookSubscription[] | undefined,
  asOfIso: string,
  envNamed: readonly string[] | undefined,
  allocations: AccountAllocations | undefined,
): StrategyCardView[] {
  const byPairId = new Map(subscriptions?.map((s) => [s.playbookId, s]));
  const onBot = subscribedPairs(subscriptions ?? [], findPair, envNamed);
  const rowView = (row: PairRowEntry): PairRowView => {
    const sub = byPairId.get(row.id);
    if (sub)
      return { ...row, subscription: subscriptionView(sub), ...subscribedNotes(row.id, onBot) };
    const refusal = subscriptions
      ? newSubscriptionRefusal({
          playbookId: row.id,
          subscriptions,
          conviction: true,
          ...(envNamed ? { envNamed } : {}),
          asOfIso,
        })
      : undefined;
    const pair = findPair(row.id);
    const asks =
      subscriptions && pair && needsConviction(pair) ? { needsConviction: true as const } : {};
    return { ...row, ...asks, ...(refusal ? { subscribeRefusal: refusal } : {}) };
  };
  return strategyCatalog(asOfIso).map((card) => {
    const allocation = subscriptions ? allocations?.[card.strategy] : undefined;
    return {
      ...card,
      pairs: card.pairs.map(rowView),
      ...(allocation
        ? {
            allocation: {
              capitalAllocated: allocation.capitalAllocated,
              budgeted: budgetedOn(subscriptions ?? [], card.strategy).total,
            },
          }
        : {}),
    };
  });
}

type AccountAllocations = Readonly<Partial<Record<StrategyId, StrategyAllocation>>>;

export function playbookStoreView(
  subscriptions: readonly PlaybookSubscription[] | undefined,
  delegationLocked = false,
  /** The viewing account's OWN closed round-trips (#3543 slice 2) — never another account's,
   *  same "no cross-account visibility" boundary #885 already settled for subscriptions. Defaults
   *  to none: a caller not yet passing them gets the bare catalog metrics, exactly as before this
   *  parameter existed. */
  roundTrips: readonly RoundTrip[] = [],
  /** The selected account is a human account the viewer owns (#4610). Defaults to open. */
  humanAccount = false,
  /** When the rows are read — a ✓ past its shelf date is stale from the next market day. */
  asOfIso: string = new Date().toISOString(),
  /** What the bots app's own setting runs on the viewed bot (`envNamedFor`): those playbooks hold
   *  their tickers though nothing is subscribed. Absent when the bots reported none. */
  envNamed?: readonly string[],
  /** The viewed account's own allocations by strategy (#4469 slice 3c part 3) — only ever passed
   *  with that account's own `subscriptions`, the same no-cross-account boundary. */
  allocations?: AccountAllocations,
): PlaybookStoreView {
  const byPlaybookId = new Map(subscriptions?.map((s) => [s.playbookId, s]));
  const whipsawByPlaybookId = new Map(
    whipsawStatsByPlaybook(roundTrips).map((stats) => [stats.playbookId, stats]),
  );
  const cards = playbookStoreCatalog().map((entry) => {
    const sub = byPlaybookId.get(entry.id);
    const whipsaw = whipsawByPlaybookId.get(entry.id);
    return {
      ...entry,
      ...(whipsaw ? { metrics: [...entry.metrics, whipsawMetric(whipsaw)] } : {}),
      ...(sub ? { subscription: subscriptionView(sub) } : {}),
    };
  });
  const capitalUnderManagement = (subscriptions ?? [])
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + (s.capitalAllocated ?? 0), 0);
  return {
    cards,
    strategies: strategyCardsView(subscriptions, asOfIso, envNamed, allocations),
    capitalUnderManagement,
    canManage: subscriptions !== undefined,
    delegation: delegationGateView(delegationLocked),
    botsOnly: botsOnlyGateView(humanAccount),
  };
}
