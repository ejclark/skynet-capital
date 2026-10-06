import {
  type CoverLeg,
  type CoverNeeds,
  coverShortfall,
  heldCoverLegs,
  orderLegs,
  premiumOut,
  type Shortfall,
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
 * together. And every approved order may fill or not, independently (a vertical fills as one), so
 * what the book needs is the WORST case over every fill/no-fill combination of the orders approved
 * so far — share shortfall and cash each at its own worst (`worstOn`), every outcome valued by its
 * best cover assignment against the shares actually free (`coverShortfall`). "Assume they all fill" would pass a
 * leg-by-leg close whose first leg then never fills; "count only their sold legs" would invent a
 * bare short out of a vertical close and lock shares nothing actually promises.
 *
 * The option arithmetic runs only when the ledger is ACTIVE — the batch carries an option order or
 * the book already holds a short (cash or shares promised). What share orders claim — cash a buy
 * spends, shares a sell takes, a playbook's allocation a buy uses — is kept in every batch, so two
 * share orders on one ticker in one cycle never jointly oversell or overspend (#4670). A share-only
 * batch whose orders do not compete sizes exactly as it always has.
 */
export interface GuardLedger {
  readonly active: boolean;
  /** Every contract held at the start of the cycle. */
  readonly held: readonly CoverLeg[];
  /** Dollars approved share buys pay out. An option order's premium or debit rides with the order
   *  (`ApprovedOptionOrder.pays`) — counted only in the outcomes where it fills — and collateral is a
   *  need, read from `orders`. */
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
  /** Cash it pays out if it fills: a premium, a debit. */
  readonly pays: number;
}

/** Past this many approved orders on one underlying, `worstOn` stops enumerating combinations
 *  (2^n) and judges one bounding book instead. One play per ticker plus a few expiry closes never
 *  gets near it. */
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

/** What one fill/no-fill outcome on one underlying needs: shares its sold calls lack, and cash —
 *  collateral under the best assignment plus the premiums its filled orders paid. */
interface Outcome {
  readonly shares: number;
  readonly cash: number;
}

/**
 * Every fill/no-fill outcome of this batch's approved orders on `underlying` (index = the set that
 * filled, as bits), each with `extra` — the change being judged, whole — filled and paying `pays`,
 * against `freeShares`. Each outcome is valued by `coverShortfall`'s best assignment.
 *
 * Past `MAX_ENUMERATED_ORDERS` it values one bounding book instead — the approved orders' SOLD legs
 * only (new shorts, longs given up) with every premium paid — and marks the answer inexact, so the
 * caller judges it outright rather than outcome by outcome.
 */
function outcomesOn(
  ledger: GuardLedger,
  underlying: string,
  freeShares: number,
  extra: { readonly legs?: readonly CoverLeg[]; readonly pays?: number } = {},
): { readonly outcomes: readonly Outcome[]; readonly exact: boolean } {
  const start = [...ledger.held.filter((l) => l.underlying === underlying), ...(extra.legs ?? [])];
  const pays = Math.max(0, extra.pays ?? 0);
  const orders = ledger.active ? ledger.orders.filter((o) => o.underlying === underlying) : [];
  if (orders.length > MAX_ENUMERATED_ORDERS) {
    const sold = orders.flatMap((o) => o.legs.filter((l) => l.contracts < 0));
    const bound = coverShortfall([...start, ...sold], underlying, freeShares);
    const paid = orders.reduce((sum, o) => sum + o.pays, pays);
    return { outcomes: [{ shares: bound.shares, cash: bound.cash + paid }], exact: false };
  }
  const outcomes: Outcome[] = [];
  let exact = true;
  for (let filled = 0; filled < 2 ** orders.length; filled++) {
    const legs = [...start];
    let paid = pays;
    orders.forEach((order, i) => {
      if (!(filled & (2 ** i))) return;
      legs.push(...order.legs);
      paid += order.pays;
    });
    const outcome: Shortfall = coverShortfall(legs, underlying, freeShares);
    outcomes.push({ shares: outcome.shares, cash: outcome.cash + paid });
    exact &&= outcome.exact;
  }
  return { outcomes, exact };
}

/** The worst outcome on `underlying` — share shortfall and cash, each at its own worst. Every outcome
 *  is covered exactly when the worst of each is. */
function worstOn(ledger: GuardLedger, underlying: string, freeShares: number): Outcome {
  const { outcomes } = outcomesOn(ledger, underlying, freeShares);
  return {
    shares: Math.max(0, ...outcomes.map((o) => o.shares)),
    cash: Math.max(0, ...outcomes.map((o) => o.cash)),
  };
}

/** Every underlying the starting book or the batch's orders touch. */
function underlyings(ledger: GuardLedger): Set<string> {
  return new Set([...ledger.held, ...ledger.orders].map((x) => x.underlying));
}

/** Shares of `underlying` held and not sold by an approved sell this batch. */
function freeSharesOf(portfolio: Portfolio, ledger: GuardLedger, underlying: string): number {
  return Math.max(0, heldQuantity(portfolio, underlying)) - soldShares(ledger, underlying);
}

/** Cash every underlying but `except` needs at its worst, premiums included. */
function cashElsewhere(portfolio: Portfolio, ledger: GuardLedger, except?: string): number {
  let total = 0;
  for (const underlying of underlyings(ledger)) {
    if (underlying === except) continue;
    total += worstOn(ledger, underlying, freeSharesOf(portfolio, ledger, underlying)).cash;
  }
  return total;
}

/** Cash neither paid out this batch nor needed by its options, at worst. With no short options and
 *  no option intents it is exactly the account's cash. */
export function spendableCash(portfolio: Portfolio, ledger: GuardLedger, book: CoverNeeds): number {
  if (!ledger.active) return unspentCash(portfolio, ledger) - book.cash;
  return unspentCash(portfolio, ledger) - cashElsewhere(portfolio, ledger);
}

/** Cash not yet paid out by this batch's share buys — the money in the account, before any option
 *  need. */
export function unspentCash(portfolio: Portfolio, ledger: GuardLedger): number {
  return portfolio.cash - ledger.spent;
}

/** Shares of `underlying` approved share sells already took this batch. */
export function soldShares(ledger: GuardLedger, underlying: string): number {
  return ledger.sold.get(underlying) ?? 0;
}

/** Whether a change makes its underlying's cover worse — in shares its sold calls lack, or in cash
 *  the account lacks for every need. */
export interface Worsening {
  readonly shares: boolean;
  readonly cash: boolean;
  /** Cash the change newly needs at worst: collateral it adds plus what it pays out. */
  readonly newCash: number;
}

/**
 * Judge one change on `underlying` — an option order's legs and payment, and/or a share sale —
 * outcome by outcome against everything approved before it. It WORSENS cover when, in ANY fill/no-fill
 * combination of the earlier orders, the book with it filled lacks more shares, or the account more
 * cash, than the same combination without it. So a covered book stays covered in every outcome, and a
 * book already short of cover can still shed risk.
 *
 * Outcome by outcome, not worst against worst (#4645 fuzz): an earlier spread's premium counted as
 * paid while its collateral was read from the outcome where it did not fill made a covered book look
 * short of cash, and "no worse than that" then let the next spread through.
 */
export function worsens(
  portfolio: Portfolio,
  ledger: GuardLedger,
  underlying: string,
  change: { readonly legs?: readonly CoverLeg[]; readonly sells?: number; readonly pays?: number },
): Worsening {
  const free = freeSharesOf(portfolio, ledger, underlying);
  const before = outcomesOn(ledger, underlying, free);
  const after = outcomesOn(ledger, underlying, free - (change.sells ?? 0), change);
  const available = unspentCash(portfolio, ledger) - cashElsewhere(portfolio, ledger, underlying);
  const short = (o: Outcome): number => Math.max(0, o.cash - available);
  let shares = false;
  let cash = false;
  let newCash = 0;
  after.outcomes.forEach((then, i) => {
    // Inexact (a bounding book past MAX_ENUMERATED_ORDERS or MAX_EXACT_CONTRACTS): "no worse than
    // before" means nothing against an estimate, so the change must leave cover whole outright.
    const now = before.exact && after.exact ? before.outcomes[i] : undefined;
    shares ||= now ? then.shares > now.shares : then.shares > 0;
    cash ||= now ? short(then) > short(now) : short(then) > 0;
    newCash = Math.max(newCash, then.cash - (now ?? before.outcomes[0] ?? then).cash);
  });
  return { shares, cash, newCash };
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

/** Record what an approved intent claimed. */
export function claim(
  ledger: GuardLedger,
  claimed: {
    /** Dollars a share buy pays out. (An option order's premium rides with `order`.) */
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
    ledger.orders.push({
      underlying,
      legs: orderLegs(option, units),
      changes,
      pays: premiumOut(option) * units,
    });
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
  let committed = ledger.byPlaybook.get(playbookId) ?? 0;
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
