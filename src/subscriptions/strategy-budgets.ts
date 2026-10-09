import { marketDayKey } from "../domain/market-day.js";
import type { PlaybookSubscription } from "../domain/types.js";
import {
  findPair,
  type Pair,
  pairName,
  STRATEGIES,
  type StrategyId,
} from "../playbooks/pair-table.js";
import type { StrategyAllocation } from "./subscriptions-file.js";

/**
 * EACH TICKER'S BUDGET, INSIDE ITS STRATEGY'S ALLOCATION (#4469 slice 3c part 3, criterion 5; Eric,
 * 2026-10-02: "Play config may also have details around allocation. This should be a subset of the
 * playbook allocation"). An account gives a strategy one allocation; each ticker it runs that
 * strategy on is its own subscription with its own budget; the budgets cannot add up to more than
 * the allocation. Compounded gains ride on top, as today: the check reads the budgets the owner set
 * (`capitalAllocated`), never what compounding grew them to.
 *
 * WHAT IS NEVER REFUSED. A strategy with no allocation set is unrestricted, as before part 3. An
 * edit that keeps or lowers a budget always goes through, so a rule the owner tightened later can
 * never strand a live subscription (the plan's "never refuse Edit, Pause or Unsubscribe"); only a
 * write that RAISES a budget, uncaps one, or adds a ticker is checked. Setting an allocation is a
 * ceiling on what may be delegated, never delegation itself, so it is refused only when the budgets
 * already set would not fit under it.
 *
 * AND THE CONVICTION'S DATE (criteria 2 and 12). An owner's conviction is checked on a market day
 * still to come — today's would latch a verdict before the owner saw it — and within a year, so a
 * date is a test the tape will actually set, not a way of never being checked.
 */

/** A conviction's check day may sit at most this far out. */
export const MAX_CHECK_DAYS = 366;

const DAY_MS = 86_400_000;

const dollars = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** The strategy a playbook id trades, when the pair table names it. */
export function strategyOf(playbookId: string, lookup = findPair): StrategyId | undefined {
  return lookup(playbookId)?.strategy;
}

/** The account's subscriptions on one strategy, with their pairs. */
function onStrategy(
  subscriptions: readonly PlaybookSubscription[],
  strategy: StrategyId,
  lookup: (id: string) => Pair | undefined,
): { readonly sub: PlaybookSubscription; readonly pair: Pair }[] {
  return subscriptions.flatMap((sub) => {
    const pair = lookup(sub.playbookId);
    return pair?.strategy === strategy ? [{ sub, pair }] : [];
  });
}

/** What the account's tickers on a strategy are budgeted, together — on or paused, since a paused
 *  pair keeps its budget and resumes with it. Uncapped ones are named, never counted as $0. */
export function budgetedOn(
  subscriptions: readonly PlaybookSubscription[],
  strategy: StrategyId,
  lookup = findPair,
): { readonly total: number; readonly uncapped: readonly Pair[] } {
  const held = onStrategy(subscriptions, strategy, lookup);
  return {
    total: held.reduce((sum, { sub }) => sum + (sub.capitalAllocated ?? 0), 0),
    uncapped: held.filter(({ sub }) => sub.capitalAllocated === undefined).map(({ pair }) => pair),
  };
}

export interface BudgetWrite {
  readonly playbookId: string;
  /** The budget being written; undefined = uncapped. */
  readonly capitalAllocated: number | undefined;
  /** The account's subscriptions as they are now, on or paused. */
  readonly subscriptions: readonly PlaybookSubscription[];
  /** The account's allocations, by strategy. */
  readonly allocations: Readonly<Partial<Record<StrategyId, StrategyAllocation>>> | undefined;
  readonly lookup?: (id: string) => Pair | undefined;
}

/** The sentence a subscribe or an Edit is refused with because its budget would not fit inside its
 *  strategy's allocation, or undefined to take it. */
export function allocationRefusal(write: BudgetWrite): string | undefined {
  const { playbookId, capitalAllocated, subscriptions, allocations, lookup = findPair } = write;
  const pair = lookup(playbookId);
  const allocation = pair ? allocations?.[pair.strategy] : undefined;
  if (!(pair && allocation)) return undefined;
  const prior = subscriptions.find((sub) => sub.playbookId === playbookId);
  const raises =
    prior === undefined ||
    capitalAllocated === undefined ||
    (prior.capitalAllocated !== undefined && capitalAllocated > prior.capitalAllocated);
  if (!raises) return undefined;
  const strategy = STRATEGIES[pair.strategy].name;
  if (capitalAllocated === undefined) {
    return `${capitalized(pairName(pair))} needs a budget: you gave ${strategy} ${dollars(allocation.capitalAllocated)}, and an uncapped ticker would not fit inside it.`;
  }
  const others = subscriptions.filter((sub) => sub.playbookId !== playbookId);
  const { total, uncapped } = budgetedOn(others, pair.strategy, lookup);
  if (uncapped.length > 0) {
    return `${capitalized(pairName(uncapped[0] as Pair))} is uncapped, so nothing else fits inside the ${dollars(allocation.capitalAllocated)} you gave ${strategy}; give it a budget first.`;
  }
  if (total + capitalAllocated <= allocation.capitalAllocated) return undefined;
  const left = Math.max(0, allocation.capitalAllocated - total);
  return `That would put ${dollars(total + capitalAllocated)} on ${strategy}, over the ${dollars(allocation.capitalAllocated)} you gave it; ${dollars(left)} is left for ${pair.symbols.join(", ") || "this pair"}.`;
}

/** The sentence an allocation is refused with — the budgets already set would not fit under it — or
 *  undefined to take it. Clearing an allocation (`undefined`) is never refused. */
export function allocationChangeRefusal(
  subscriptions: readonly PlaybookSubscription[],
  strategy: StrategyId,
  capitalAllocated: number | undefined,
  lookup = findPair,
): string | undefined {
  if (capitalAllocated === undefined) return undefined;
  const name = STRATEGIES[strategy].name;
  const { total, uncapped } = budgetedOn(subscriptions, strategy, lookup);
  if (uncapped.length > 0) {
    return `${capitalized(pairName(uncapped[0] as Pair))} is uncapped; give it a budget before setting an allocation for ${name}.`;
  }
  return total > capitalAllocated
    ? `Its tickers' budgets already add up to ${dollars(total)}; allocate at least that to ${name}, or lower a budget first.`
    : undefined;
}

/** The sentence a conviction's check day is refused with, or undefined to take it. */
export function checkOnRefusal(checkOn: string, asOfIso: string): string | undefined {
  const today = marketDayKey(asOfIso);
  if (checkOn <= today) return `A conviction is checked on a day still to come; ${checkOn} isn't.`;
  const latest = new Date(Date.parse(`${today}T00:00:00Z`) + MAX_CHECK_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);
  return checkOn > latest
    ? `Check a conviction within a year, by ${latest}, so the tape gets to judge it.`
    : undefined;
}
