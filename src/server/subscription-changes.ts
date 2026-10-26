import type { PlaybookSubscription } from "../domain/types.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import type { StrategyId } from "../playbooks/pair-table.js";
import { pointerMove } from "../subscriptions/conviction-pointer.js";
import { asOwnConviction, type OwnerReadSubscription } from "../subscriptions/pair-conviction.js";
import type { SubscriptionsState } from "../subscriptions/subscription-state.js";
import { convictionNames, pointerChange } from "./conviction-pointer-changes.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { type OwnViews, ownViewsOf } from "./pair-conviction-write.js";
import {
  MAX_SETTING_TEXT,
  recordControlsChange,
  type SettingsChange,
  type SettingValue,
} from "./settings-change-log.js";

/**
 * THE STORE'S WRITES IN THE SETTINGS CHANGE LOG (#4535 slice 3c, the plan's EARS criterion 4) —
 * subscribe, Edit, pause, unsubscribe and conviction record one `subscription:<playbookId>` line;
 * an allocation records one `allocation:<strategy>` line. The bot's Settings card lists them beside
 * its suspend, build and forced-pick lines, so every change to what a bot does is in one place.
 *
 * A subscription is logged as a one-line summary, not the record: the card shows it as written, the
 * log's parser keeps one bounded string type instead of a second schema to keep in step with
 * `PlaybookSubscription`, and an internal field (`updatedAt`) never makes a line that reads as no
 * change. `null` = not subscribed. The conviction pointer is not internal — which view steers the
 * pair narrows what it may open — so a write that moves it adds its own `conviction:<playbookId>`
 * line beside the subscription's (#5482, `conviction-pointer-changes.ts`).
 *
 * Both or neither, as the controls writes: a log that can't be written puts the account's
 * subscriptions back as they were and throws (`recordControlsChange`).
 */

const MAX_SYMBOLS_NAMED = 6;

const dollars = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** One subscription in words, at most `MAX_SETTING_TEXT` long; `null` when there is none. With
 *  `viewOf`, a pointer at the owner's own view on the pair reads as the conviction it states, so the
 *  line says "conviction checked …" as it did when that day was kept inline (#5482). */
export function subscriptionSummary(
  given: PlaybookSubscription | undefined,
  viewOf?: (id: string) => Conviction | undefined,
): string | null {
  if (!given) return null;
  const sub: OwnerReadSubscription = viewOf ? asOwnConviction(given, viewOf) : given;
  const symbols = sub.symbols ?? [];
  const named =
    symbols.length > MAX_SYMBOLS_NAMED
      ? `${symbols.slice(0, MAX_SYMBOLS_NAMED).join(", ")} +${symbols.length - MAX_SYMBOLS_NAMED} more`
      : symbols.join(", ");
  const parts = [
    sub.enabled ? "on" : "paused",
    sub.mode,
    sub.capitalAllocated === undefined ? "no budget" : dollars(sub.capitalAllocated),
    ...(named ? [named] : []),
    ...(sub.compoundAllocation ? ["compounding"] : []),
    ...(sub.conviction ? [`conviction checked ${sub.conviction.checkOn}`] : []),
  ];
  const text = parts.join(" · ");
  return text.length > MAX_SETTING_TEXT ? `${text.slice(0, MAX_SETTING_TEXT - 1)}…` : text;
}

type Store = NonNullable<DashboardServerConfig["subscriptions"]>;

const held = (state: SubscriptionsState, accountId: string, playbookId: string) =>
  (state[accountId] ?? []).find((s) => s.playbookId === playbookId);

function change(
  setting: string,
  before: SettingValue,
  after: SettingValue,
  editor: string,
  at: Date,
): SettingsChange {
  return { at: at.toISOString(), setting, before, after, proposedBy: editor, approvedBy: editor };
}

/** Put one account's subscriptions back as they were, leaving every other account's alone. */
function restoreAccount(store: Store, accountId: string, prior: SubscriptionsState): void {
  const { [accountId]: _now, ...rest } = store.load();
  const was = prior[accountId];
  store.replace(was ? { ...rest, [accountId]: was } : rest);
}

/**
 * Run one Store write on a subscription, log what it moved, and hand back what the write returned.
 * With no change log wired the write runs alone, reading nothing extra. `viewsBefore` is the
 * owners' own views as they were before a conviction write restated one (`writeWithConviction`).
 */
export function recordSubscriptionWrite<T>(
  config: DashboardServerConfig,
  store: Store,
  ref: { readonly id: string; readonly playbookId: string },
  editor: string,
  write: () => T,
  viewsBefore?: OwnViews,
): T {
  const log = config.controls?.changes;
  if (!log) return write();
  const at = config.now?.() ?? new Date();
  const prior = store.load();
  const was = held(prior, ref.id, ref.playbookId);
  // The owner's own view is replaced in place, so its old day is read from before it was restated.
  const before = subscriptionSummary(was, viewsBefore ?? ownViewsOf(config.memberConvictions));
  const result = write();
  const now = held(store.load(), ref.id, ref.playbookId);
  const after = subscriptionSummary(now, ownViewsOf(config.memberConvictions));
  const moved = pointerMove(ref.id, was, now);
  // A view the write dropped (an owner's own day, restated onto a record) keeps its title.
  const named = convictionNames(config.memberConvictions);
  const names = (id: string) => named(id) ?? viewsBefore?.(id)?.title;
  recordControlsChange(
    log,
    ref.id,
    [
      change(`subscription:${ref.playbookId}`, before, after, editor, at),
      ...(moved ? [pointerChange(moved, names, editor, at)] : []),
    ],
    () => restoreAccount(store, ref.id, prior),
  );
  return result;
}

/** Set one strategy's allocation and log it; `null` = none set. */
export function recordAllocationWrite(
  config: DashboardServerConfig,
  store: Store,
  ref: { readonly id: string; readonly strategy: StrategyId },
  capitalAllocated: number | undefined,
  editor: string,
): void {
  const at = config.now?.() ?? new Date();
  const was = store.loadAllocations()[ref.id]?.[ref.strategy]?.capitalAllocated;
  store.setAllocation(ref.id, ref.strategy, capitalAllocated, at);
  recordControlsChange(
    config.controls?.changes,
    ref.id,
    [change(`allocation:${ref.strategy}`, was ?? null, capitalAllocated ?? null, editor, at)],
    () => store.setAllocation(ref.id, ref.strategy, was, at),
  );
}
