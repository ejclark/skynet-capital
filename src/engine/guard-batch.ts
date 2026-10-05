import {
  type CoverLeg,
  type CoverNeeds,
  coverNeeds,
  heldCoverLegs,
  orderLegs,
} from "../domain/option-book.js";
import { heldQuantity, positionValue } from "../domain/portfolio.js";
import type {
  MarketContext,
  OptionOrderIntent,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import { parseOccSymbol } from "../trading/option-symbols.js";

/**
 * What one batch of intents has already claimed, so the next intent in the SAME batch cannot claim
 * it again. Guards size every intent against the cycle's starting book; without this, a sold put and
 * a share buy in one cycle could both spend the same cash, and two share buys could jointly eat a
 * put's collateral.
 *
 * Option orders are kept WHOLE, not as sums (#4645 red-team). A held long contract's power to cap a
 * short is a pairing, not an amount: two opens could each lean on the same long, or a close could
 * pull the long out from under an open approved a moment earlier — each correct alone, a naked short
 * together. And every approved order may fill or not, independently (a vertical fills as one), so a
 * promise is the WORST case over every fill/no-fill combination of the orders approved so far —
 * cash and shares each at their own worst (`worstOn`). "Assume they all fill" would pass a
 * leg-by-leg close whose first leg then never fills; "count only their sold legs" would invent a
 * bare short out of a vertical close and lock shares nothing actually promises.
 *
 * Active only when the batch carries an option order or the book already holds a short (cash or
 * shares promised). Inactive, every read is the starting book's and every write is skipped — a
 * share-only cycle with no option positions sizes exactly as it always has.
 */
export interface GuardLedger {
  readonly active: boolean;
  /** Every contract held at the start of the cycle. */
  readonly held: readonly CoverLeg[];
  /** Dollars paid out by approved intents: share buys' cost, premiums and debits. Never collateral
   *  — that is a promise, read from `orders`. */
  spent: number;
  /** Shares sold per underlying by approved share sells. */
  readonly sold: Map<string, number>;
  /** Option orders approved this batch, in order. Each fills whole or not at all. */
  readonly orders: ApprovedOptionOrder[];
  /** Option risk claimed per playbook, against its Store allocation. */
  readonly byPlaybook: Map<string, number>;
}

/** One approved option order: its legs as cover lines, and per contract the signed change it makes. */
interface ApprovedOptionOrder {
  readonly underlying: string;
  readonly legs: readonly CoverLeg[];
  readonly changes: ReadonlyMap<string, number>;
}

/** Past this many approved orders on one underlying, `worstOn` stops enumerating combinations
 *  (2^n) and bounds them instead. One play per ticker plus a few expiry closes never gets near it. */
const MAX_ENUMERATED_ORDERS = 10;

export function openLedger(
  intents: readonly OrderIntent[],
  book: CoverNeeds,
  portfolio: Portfolio,
): GuardLedger {
  const promisesShares = [...book.sharesByUnderlying.values()].some((n) => n > 0);
  return {
    active: intents.some((i) => i.option !== undefined) || book.cash > 0 || promisesShares,
    held: heldCoverLegs(portfolio),
    spent: 0,
    sold: new Map(),
    orders: [],
    byPlaybook: new Map(),
  };
}

/** What a book promises on one underlying: cash set aside and shares held back. */
export interface Promised {
  readonly cash: number;
  readonly shares: number;
}

/**
 * The most `underlying` can promise — cash and shares each at its worst — over every combination of
 * this batch's approved orders on it filling or not, with `extra` (the order being judged, whole)
 * filled. Every outcome is valued by the same one-to-one cap assignment the guards always used.
 * Past `MAX_ENUMERATED_ORDERS` it values one book instead: the approved orders' SOLD legs only (new
 * shorts, longs given up), which promises at least as much real cover as any outcome — stricter,
 * never looser.
 */
function worstOn(
  ledger: GuardLedger,
  underlying: string,
  extra: readonly CoverLeg[] = [],
): Promised {
  const start = [...ledger.held.filter((l) => l.underlying === underlying), ...extra];
  const orders = ledger.active ? ledger.orders.filter((o) => o.underlying === underlying) : [];
  const promisedBy = (legs: readonly CoverLeg[]): Promised => {
    const needs = coverNeeds(legs);
    return {
      cash: needs.cashByUnderlying.get(underlying) ?? 0,
      shares: needs.sharesByUnderlying.get(underlying) ?? 0,
    };
  };
  if (orders.length > MAX_ENUMERATED_ORDERS) {
    return promisedBy([...start, ...orders.flatMap((o) => o.legs.filter((l) => l.contracts < 0))]);
  }
  let cash = 0;
  let shares = 0;
  for (let filled = 0; filled < 2 ** orders.length; filled++) {
    const legs = [...start];
    orders.forEach((order, i) => {
      if (filled & (2 ** i)) legs.push(...order.legs);
    });
    const outcome = promisedBy(legs);
    cash = Math.max(cash, outcome.cash);
    shares = Math.max(shares, outcome.shares);
  }
  return { cash, shares };
}

/** Every underlying the starting book or the batch's orders touch. */
function underlyings(ledger: GuardLedger): Set<string> {
  return new Set([...ledger.held, ...ledger.orders].map((x) => x.underlying));
}

/** Cash the whole book promises at its worst, across every underlying. */
function promisedCash(ledger: GuardLedger, book: CoverNeeds): number {
  if (!ledger.active) return book.cash;
  let total = 0;
  for (const underlying of underlyings(ledger)) total += worstOn(ledger, underlying).cash;
  return total;
}

/** Cash neither paid out this batch nor promised as collateral, at worst. With no short options and
 *  no option intents it is exactly the account's cash. */
export function spendableCash(portfolio: Portfolio, ledger: GuardLedger, book: CoverNeeds): number {
  return portfolio.cash - promisedCash(ledger, book) - (ledger.active ? ledger.spent : 0);
}

/** Cash not yet paid out this batch — the money in the account, before any promise. */
export function unspentCash(portfolio: Portfolio, ledger: GuardLedger): number {
  return portfolio.cash - (ledger.active ? ledger.spent : 0);
}

/** Shares of `underlying` held back to cover sold calls, at worst. */
export function promisedShares(ledger: GuardLedger, book: CoverNeeds, underlying: string): number {
  if (!ledger.active) return book.sharesByUnderlying.get(underlying) ?? 0;
  return worstOn(ledger, underlying).shares;
}

/** Shares of `underlying` approved share sells already took this batch. */
export function soldShares(ledger: GuardLedger, underlying: string): number {
  return ledger.active ? (ledger.sold.get(underlying) ?? 0) : 0;
}

/**
 * What one option order would do to its underlying's promises, judged against the worst case of
 * everything approved before it: `before` without it, `after` with it filled, and `elsewhere` — the
 * cash every OTHER underlying promises at its worst.
 */
export function coverWith(
  ledger: GuardLedger,
  book: CoverNeeds,
  underlying: string,
  legs: readonly CoverLeg[],
): { readonly before: Promised; readonly after: Promised; readonly elsewhere: number } {
  const before = worstOn(ledger, underlying);
  return {
    before,
    after: worstOn(ledger, underlying, legs),
    elsewhere: promisedCash(ledger, book) - before.cash,
  };
}

/**
 * Contracts of `occSymbol` a close may still take, after the closes approved earlier this batch: a
 * long, less what earlier orders sold of it; a short, less what they bought back. An earlier OPEN of
 * the same contract never adds anything to close — it may not fill.
 */
export function closableContracts(
  ledger: GuardLedger,
  occSymbol: string,
  held: number,
  side: "buy" | "sell",
): number {
  let taken = 0;
  for (const order of ledger.orders) {
    const change = order.changes.get(occSymbol) ?? 0;
    if (side === "sell" ? change < 0 : change > 0) taken += Math.abs(change);
  }
  return side === "sell" ? Math.max(0, held - taken) : Math.max(0, -held - taken);
}

/** Record what an approved intent claimed. A no-op on an inactive ledger. */
export function claim(
  ledger: GuardLedger,
  claimed: {
    /** Dollars paid out: a share buy's cost, a premium or debit. */
    readonly spent?: number;
    /** Shares a share sell takes. */
    readonly sold?: { readonly underlying: string; readonly shares: number };
    /** An approved option order, whole. */
    readonly order?: {
      readonly underlying: string;
      readonly option: OptionOrderIntent;
      readonly units: number;
    };
    readonly playbookId?: string;
    readonly risk?: number;
  },
): void {
  if (!ledger.active) return;
  ledger.spent += Math.max(0, claimed.spent ?? 0);
  if (claimed.sold && claimed.sold.shares > 0) {
    const { underlying, shares } = claimed.sold;
    ledger.sold.set(underlying, (ledger.sold.get(underlying) ?? 0) + shares);
  }
  if (claimed.order) {
    const { underlying, option, units } = claimed.order;
    const changes = new Map<string, number>();
    for (const leg of option.legs) {
      const signed = (leg.side === "buy" ? 1 : -1) * leg.ratio * units;
      changes.set(leg.occSymbol, (changes.get(leg.occSymbol) ?? 0) + signed);
    }
    ledger.orders.push({ underlying, legs: orderLegs(option, units), changes });
  }
  if (claimed.playbookId !== undefined && (claimed.risk ?? 0) > 0) {
    const prior = ledger.byPlaybook.get(claimed.playbookId) ?? 0;
    ledger.byPlaybook.set(claimed.playbookId, prior + (claimed.risk ?? 0));
  }
}

/** The enabled subscription an intent's playbook trades under, if any. */
function subscriptionFor(
  intent: OrderIntent,
  subscriptions: readonly PlaybookSubscription[] | undefined,
): PlaybookSubscription | undefined {
  return intent.playbookId
    ? subscriptions?.find((s) => s.playbookId === intent.playbookId && s.enabled)
    : undefined;
}

/** The subscription rules a buy and an option open share: which subscription the intent trades
 *  under, whether its symbol filter refuses this ticker (#885 — entries only), and what it has
 *  realized when it compounds (#3527 slice 3, off by default). One spelling for both, so a change
 *  to either rule can never skip option opens. */
export function subscriptionTerms(
  intent: OrderIntent,
  config: {
    readonly subscriptions?: readonly PlaybookSubscription[];
    readonly realizedPlForPlaybook?: (playbookId: string) => number;
  },
): {
  readonly subscription?: PlaybookSubscription;
  readonly refusesSymbol: boolean;
  readonly realizedPl: number;
} {
  const subscription = subscriptionFor(intent, config.subscriptions);
  const refusesSymbol = Boolean(
    subscription?.symbols?.length && !subscription.symbols.includes(intent.symbol),
  );
  const realizedPl =
    subscription?.compoundAllocation && intent.playbookId
      ? (config.realizedPlForPlaybook?.(intent.playbookId) ?? 0)
      : 0;
  return { ...(subscription ? { subscription } : {}), refusesSymbol, realizedPl };
}

/**
 * Dollars a playbook already has committed against its Store allocation: its basket's shares at
 * the ask, the collateral its sold puts hold, its long contracts at their marks, and what earlier
 * intents in this batch claimed. A share buy and an option open both size against this, so a
 * playbook can never commit its allocation twice — once in shares, once in put collateral.
 * With no option positions and an inactive ledger it is exactly the basket's share value, which is
 * what share sizing always used (or this symbol's alone, when no basket is registered).
 */
export function committedToPlaybook(
  intent: OrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  playbookSymbols: ReadonlyMap<string, readonly string[]> | undefined,
  { ledger, book }: { readonly ledger: GuardLedger; readonly book: CoverNeeds },
): number {
  const playbookId = intent.playbookId ?? "";
  const basket = playbookSymbols?.get(playbookId) ?? [intent.symbol];
  let committed = ledger.active ? (ledger.byPlaybook.get(playbookId) ?? 0) : 0;
  for (const symbol of basket) {
    const ask = context.quotes[symbol]?.ask;
    if (ask !== undefined) committed += heldQuantity(portfolio, symbol) * ask;
    committed += book.cashByUnderlying.get(symbol) ?? 0;
  }
  for (const position of portfolio.positions) {
    const parts = parseOccSymbol(position.symbol);
    if (parts && position.quantity > 0 && basket.includes(parts.underlying)) {
      committed += positionValue(position, undefined);
    }
  }
  return committed;
}
