import { type EarningsPrint, nextPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { PlaybookSubscription } from "../domain/types.js";
import { findPair, isStale, type Pair, pairName, STRATEGIES } from "../playbooks/pair-table.js";
import { findPlaybook } from "../playbooks/registry.js";

/**
 * WHAT A NEW SUBSCRIPTION NEEDS BEFORE IT IS TAKEN (#4469 slice 3a, criterion 9) — said in words, so
 * the Store can show why a row can't be subscribed and the API refuses with the same sentence.
 *
 * NEW SUBSCRIPTIONS ONLY. A pair the bot already subscribes to (on or paused) is never refused here:
 * Edit, Pause, Unsubscribe and a re-subscribe that replaces it go through untouched, so a rule added
 * later can never strand a live subscription (both of Eric's — `CRWV-WHEEL`, `S1-NVDA` — included).
 *
 * The checks that need only the code and the calendar live here; the ones that need a live quote
 * (a liquid chain, one contract's collateral against the budget, the feed streaming the ticker) and
 * the account's options level are the next part of 3a. A confirmed date and a live price stay
 * entry-time checks, as the guards already make them.
 */

/** Why a pair's tickers are another pair's on this bot — and whether that refuses or hands off. */
interface Claim {
  /** The other pair, already subscribed here. */
  readonly by: Pair;
  readonly symbol: string;
}

/** A pair that trades one ticker. Baskets (HC-SAURON, SAURON) and the forced pick neither take a
 *  ticker from a pair nor are refused for one: their own yield rules already hand a name over. */
const single = (pair: Pair): string | undefined =>
  pair.symbols.length === 1 ? pair.symbols[0] : undefined;

const instrumentOf = (pair: Pair) => STRATEGIES[pair.strategy].instrument;

const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** The bot's subscriptions (on or paused — a paused pair keeps its names, #4651) resolved to pairs,
 *  in the order the bot reads them. An id no row names (an authored play) claims nothing here. */
export function subscribedPairs(
  subscriptions: readonly Pick<PlaybookSubscription, "playbookId">[],
  lookup: (id: string) => Pair | undefined,
): Pair[] {
  return subscriptions.flatMap((sub) => {
    const pair = lookup(sub.playbookId);
    return pair ? [pair] : [];
  });
}

/** The first pair of the SAME instrument on this bot that already trades `pair`'s ticker — share
 *  pair against share pair, option pair against option pair (criterion 9: "a symbol is taken only
 *  by another pair of the same kind on that bot"). */
export function takenBy(pair: Pair, others: readonly Pair[]): Claim | undefined {
  const symbol = single(pair);
  if (symbol === undefined) return undefined;
  const by = others.find(
    (other) =>
      other.id !== pair.id &&
      single(other) === symbol &&
      instrumentOf(other) === instrumentOf(pair),
  );
  return by ? { by, symbol } : undefined;
}

/** "the call spread trades NVDA on this bot; the pre-print run-up yields it" — an option pair over a
 *  share pair or a basket keeps today's hand-off (`claimOptionUnderlyings`): not a refusal, drawn on
 *  the share row so its owner can see why it is quiet on that ticker. Undefined when nothing yields. */
export function handOffNote(pair: Pair, others: readonly Pair[]): string | undefined {
  if (instrumentOf(pair) !== "shares") return undefined;
  for (const other of others) {
    const symbol = single(other);
    if (instrumentOf(other) === "options" && symbol && pair.symbols.includes(symbol)) {
      return `${capitalized(STRATEGIES[other.strategy].name)} trades ${symbol} on this bot; ${STRATEGIES[pair.strategy].name} yields it.`;
    }
  }
  return undefined;
}

export interface EligibilityInput {
  readonly playbookId: string;
  /** The bot's own subscriptions, on or paused. */
  readonly subscriptions: readonly Pick<PlaybookSubscription, "playbookId">[];
  readonly asOfIso: string;
  /** The caller's own authored plays (#809) — nothing persists one yet, so callers pass none. */
  readonly authoredIds?: readonly string[];
  readonly prints?: readonly EarningsPrint[];
  /** Test seam: a pair row the table does not have (the same seam `callSpread` takes). */
  readonly lookup?: (id: string) => Pair | undefined;
  /** Test seam: whether the bots can run an id — the house registry by default. */
  readonly runnable?: (id: string) => boolean;
}

/**
 * The sentence a NEW subscription is refused with, or undefined to take it. Checked in the order an
 * owner can act on: does it exist, can the bots run it, is its research current, does its window
 * have a print to count toward, is its ticker free on this bot.
 */
export function newSubscriptionRefusal(input: EligibilityInput): string | undefined {
  const {
    playbookId,
    subscriptions,
    asOfIso,
    authoredIds = [],
    prints = UPCOMING_PRINTS,
    lookup = findPair,
    runnable = (id) => findPlaybook(id) !== undefined,
  } = input;
  if (subscriptions.some((sub) => sub.playbookId === playbookId)) return undefined;
  if (authoredIds.includes(playbookId)) return undefined;
  const pair = lookup(playbookId);
  if (!pair) {
    return runnable(playbookId) ? undefined : `No playbook is called ${playbookId}.`;
  }
  const name = pairName(pair);
  // Deploy order: the bots learn a pair before the app offers it, so a row they cannot run yet is
  // refused rather than saved as a subscription that trades nothing.
  if (!runnable(playbookId)) {
    return `${capitalized(name)} isn't running on the bots yet.`;
  }
  const { evidence } = pair;
  if (isStale(evidence, asOfIso)) {
    return `${capitalized(name)}'s research ran past its shelf date (${evidence.shelfOn}); it takes no new subscriptions until it is re-researched.`;
  }
  if (STRATEGIES[pair.strategy].dateKeyed) {
    if (!evidence.measuredExit) {
      return `${capitalized(name)} has no window a study measured, so it can't take a subscription.`;
    }
    const missing = pair.symbols.find((symbol) => !nextPrint(symbol, asOfIso, prints));
    if (missing) {
      return `${capitalized(name)} needs ${missing}'s next earnings date on file, and the calendar has none.`;
    }
  }
  const claim = takenBy(pair, subscribedPairs(subscriptions, lookup));
  if (claim) {
    const kind = instrumentOf(pair) === "options" ? "option" : "share";
    return `${capitalized(STRATEGIES[claim.by.strategy].name)} already trades ${claim.symbol} ${kind}s on this bot; a bot runs one ${kind} playbook per symbol.`;
  }
  return undefined;
}

/**
 * "not trading — the call spread owns NVDA": a bot reading two option pairs on one ticker runs the
 * first and refuses the rest (`claimOptionUnderlyings`, first in roster order wins). New subscriptions
 * can no longer pair them (`takenBy` above); this names the ones already saved before it could.
 */
export function notTradingNote(
  pair: Pair,
  subscriptionsInOrder: readonly Pair[],
): string | undefined {
  if (instrumentOf(pair) !== "options") return undefined;
  const index = subscriptionsInOrder.findIndex((other) => other.id === pair.id);
  if (index < 0) return undefined;
  const claim = takenBy(pair, subscriptionsInOrder.slice(0, index));
  return claim
    ? `not trading — ${STRATEGIES[claim.by.strategy].name} owns ${claim.symbol}`
    : undefined;
}
