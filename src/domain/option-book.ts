import {
  OPTION_MULTIPLIER,
  type OptionContractParts,
  parseOccSymbol,
} from "../trading/option-symbols.js";
import { heldQuantity, positionFor } from "./portfolio.js";
import type {
  OptionContractQuote,
  OptionOrderIntent,
  OrderIntent,
  Portfolio,
  Side,
} from "./types.js";

/**
 * A bot's option book, read from its positions alone — what is held, what it already promises, and
 * what one more order would promise. PURE: no clock, no I/O. The guards and (later) the broker
 * adapter's fresh re-check call the same functions, so "is this put secured?" has one answer.
 *
 * Every number is in dollars or shares; a contract is `OPTION_MULTIPLIER` shares.
 */

/** A snapshot this process read longer ago than this is not a price to act on, however fresh the
 *  feed's own stamp — the guard and the contract picker share the bound. */
export const SNAPSHOT_MAX_AGE_MS = 120_000;

/** One held option contract. `quantity` is signed contracts: + long, − short. */
export interface HeldContract extends OptionContractParts {
  readonly occSymbol: string;
  readonly quantity: number;
  /** The broker's per-share average premium. */
  readonly avgPrice: number;
  /** The broker's own total-dollar mark, when it has one. */
  readonly marketValue?: number;
}

/** Everything a bot holds on one underlying. */
export interface OptionBook {
  readonly underlying: string;
  readonly shares: number;
  /** The shares' per-share average cost, when shares are held. */
  readonly shareCost?: number;
  readonly contracts: readonly HeldContract[];
}

/** Every option contract held, long or short, in position order. */
export function heldContracts(portfolio: Portfolio): HeldContract[] {
  const held: HeldContract[] = [];
  for (const position of portfolio.positions) {
    const parts = parseOccSymbol(position.symbol);
    if (!parts || position.quantity === 0) continue;
    held.push({
      ...parts,
      occSymbol: position.symbol,
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      ...(position.marketValue !== undefined ? { marketValue: position.marketValue } : {}),
    });
  }
  return held;
}

export function optionBook(portfolio: Portfolio, underlying: string): OptionBook {
  const shares = heldQuantity(portfolio, underlying);
  const sharePosition = positionFor(portfolio, underlying);
  return {
    underlying,
    shares,
    ...(shares > 0 && sharePosition ? { shareCost: sharePosition.avgPrice } : {}),
    contracts: heldContracts(portfolio).filter((c) => c.underlying === underlying),
  };
}

/** Whether an order adds risk. An option's direction is its `effect`, never its side — a sold put is
 *  a sell that OPENS risk. For shares this is exactly `side === "buy"`. */
export function opensRisk(intent: OrderIntent): boolean {
  return intent.option ? intent.option.effect === "open" : intent.side === "buy";
}

/** The Alpaca options level an order needs: 1 for a cash-secured put or covered call, 3 for a
 *  spread, 0 for a close (closing never needs an approval). */
export function requiredOptionLevel(option: OptionOrderIntent): 0 | 1 | 2 | 3 {
  if (option.effect === "close" || option.structure === "close") return 0;
  return option.structure === "call-debit-spread" ? 3 : 1;
}

/** One contract line the cover arithmetic sees. `contracts` is signed: + long, − short. */
export interface CoverLeg {
  readonly underlying: string;
  readonly type: "call" | "put";
  readonly strike: number;
  readonly expiration: string;
  readonly contracts: number;
}

/** What a set of contracts promises: cash set aside (in total and per underlying), and shares held
 *  back to cover sold calls (per underlying). */
export interface CoverNeeds {
  readonly cash: number;
  readonly cashByUnderlying: ReadonlyMap<string, number>;
  readonly sharesByUnderlying: ReadonlyMap<string, number>;
}

const addTo = (map: Map<string, number>, key: string, amount: number): void => {
  if (amount !== 0) map.set(key, (map.get(key) ?? 0) + amount);
};

const contractKey = (l: CoverLeg): string =>
  `${l.underlying}|${l.type}|${l.expiration}|${l.strike}`;

/** Same contract, one line: a buy against a held short (or a sell against a held long) nets. */
function netLegs(legs: readonly CoverLeg[]): CoverLeg[] {
  const byContract = new Map<string, CoverLeg>();
  for (const leg of legs) {
    const key = contractKey(leg);
    const prior = byContract.get(key);
    byContract.set(key, prior ? { ...prior, contracts: prior.contracts + leg.contracts } : leg);
  }
  return [...byContract.values()].filter((l) => l.contracts !== 0);
}

/** Per short contract: cash it needs when capped by a long at `capStrike`, or bare. */
function shortRequirement(short: CoverLeg, capStrike: number | undefined): number {
  if (short.type === "call") {
    return capStrike === undefined ? 0 : Math.max(0, capStrike - short.strike) * OPTION_MULTIPLIER;
  }
  return (
    (capStrike === undefined ? short.strike : Math.max(0, short.strike - capStrike)) *
    OPTION_MULTIPLIER
  );
}

/** The cheapest long for a short: calls — the lowest strike; puts — the highest; then the earliest
 *  expiry (so a later short keeps the longer cap), then the strike-and-expiry key for a total order. */
function capOrder(type: "call" | "put"): (a: CoverLeg, b: CoverLeg) => number {
  return (a, b) =>
    (type === "call" ? a.strike - b.strike : b.strike - a.strike) ||
    a.expiration.localeCompare(b.expiration) ||
    contractKey(a).localeCompare(contractKey(b));
}

/**
 * What a set of contracts promises, by ONE-TO-ONE cap assignment — a long caps at most as many shorts
 * as it has contracts, unlike `draft-order.ts`'s `cappingLeg`, which may find one long for several
 * shorts. Per (underlying, type): shorts in expiration order each take capacity from unused longs
 * expiring no earlier, cheapest first.
 *
 *   capped call:  cash   += max(0, L−S)·100·n      uncapped call: shares += 100·n
 *   capped put:   cash   += max(0, S−L)·100·n      uncapped put:  cash   += S·100·n
 *
 * So a debit spread (long the lower call, short the higher, same expiry) promises nothing at all —
 * its short call never locks shares, and a guard never blocks selling the stock under it.
 */
export function coverNeeds(legs: readonly CoverLeg[]): CoverNeeds {
  const cashByUnderlying = new Map<string, number>();
  const sharesByUnderlying = new Map<string, number>();
  const groups = new Map<string, CoverLeg[]>();
  for (const leg of netLegs(legs)) {
    const key = `${leg.underlying}|${leg.type}`;
    groups.set(key, [...(groups.get(key) ?? []), leg]);
  }
  for (const group of groups.values()) {
    for (const { short, capStrike, contracts } of assignCaps(group)) {
      if (capStrike === undefined && short.type === "call") {
        addTo(sharesByUnderlying, short.underlying, OPTION_MULTIPLIER * contracts);
      } else {
        addTo(cashByUnderlying, short.underlying, shortRequirement(short, capStrike) * contracts);
      }
    }
  }
  const cash = [...cashByUnderlying.values()].reduce((sum, n) => sum + n, 0);
  return { cash, cashByUnderlying, sharesByUnderlying };
}

/** One (underlying, type) group's shorts, each split into the contracts a long caps (at its strike)
 *  and the contracts left bare (`capStrike` undefined). */
function assignCaps(group: readonly CoverLeg[]): {
  readonly short: CoverLeg;
  readonly capStrike: number | undefined;
  readonly contracts: number;
}[] {
  const capacity = new Map<CoverLeg, number>();
  for (const leg of group) if (leg.contracts > 0) capacity.set(leg, leg.contracts);
  // Within one expiry the higher strike goes first: capping it costs the least cash for a call, and
  // saves the most for a put.
  const shorts = group
    .filter((l) => l.contracts < 0)
    .sort((a, b) => a.expiration.localeCompare(b.expiration) || b.strike - a.strike);
  const assigned: { short: CoverLeg; capStrike: number | undefined; contracts: number }[] = [];
  for (const short of shorts) {
    let left = -short.contracts;
    const caps = [...capacity.keys()]
      .filter((long) => long.expiration >= short.expiration && (capacity.get(long) ?? 0) > 0)
      .sort(capOrder(short.type));
    for (const long of caps) {
      if (left === 0) break;
      const take = Math.min(left, capacity.get(long) ?? 0);
      capacity.set(long, (capacity.get(long) ?? 0) - take);
      assigned.push({ short, capStrike: long.strike, contracts: take });
      left -= take;
    }
    if (left > 0) assigned.push({ short, capStrike: undefined, contracts: left });
  }
  return assigned;
}

/** Past this many contracts of one type on one side (short or long) on one underlying,
 *  `coverShortfall` stops searching every assignment and reports the greedy one, marked inexact. */
const MAX_EXACT_CONTRACTS = 12;

/** What one underlying's contracts still need once the shares free to cover them are counted. */
export interface Shortfall {
  /** Shares the sold calls need beyond the shares free to cover them. */
  readonly shares: number;
  /** Cash the shorts need, under the assignment that best fits those shares. */
  readonly cash: number;
  /** False past `MAX_EXACT_CONTRACTS`: a valid assignment, not necessarily the best one. */
  readonly exact: boolean;
}

type Unit = { readonly strike: number; readonly expiration: string };

/** One contract per entry, so an assignment can pair them one to one. */
function unitsOf(
  legs: readonly CoverLeg[],
  type: "call" | "put",
): { shorts: Unit[]; longs: Unit[] } {
  const shorts: Unit[] = [];
  const longs: Unit[] = [];
  for (const leg of legs) {
    if (leg.type !== type) continue;
    for (let n = 0; n < Math.abs(leg.contracts); n += 1) {
      (leg.contracts < 0 ? shorts : longs).push({ strike: leg.strike, expiration: leg.expiration });
    }
  }
  return { shorts, longs };
}

/** Every (shares, cash) a set of short calls can be covered at — each by 100 shares, or by a distinct
 *  long call expiring no earlier at its strikes' width in cash — keeping only the points no other
 *  point beats on both. */
function callFrontier(shorts: readonly Unit[], longs: readonly Unit[]): [number, number][] {
  const memo = new Map<string, [number, number][]>();
  const best = (points: [number, number][]): [number, number][] => {
    points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const kept: [number, number][] = [];
    for (const point of points) {
      if (kept.length === 0 || point[1] < (kept[kept.length - 1] as [number, number])[1]) {
        kept.push(point);
      }
    }
    return kept;
  };
  const search = (i: number, used: number): [number, number][] => {
    if (i === shorts.length) return [[0, 0]];
    const key = `${i}:${used}`;
    const hit = memo.get(key);
    if (hit) return hit;
    const short = shorts[i] as Unit;
    const points: [number, number][] = [];
    for (const [shares, cash] of search(i + 1, used))
      points.push([shares + OPTION_MULTIPLIER, cash]);
    longs.forEach((long, j) => {
      if (used & (1 << j) || long.expiration < short.expiration) return;
      const width = Math.max(0, long.strike - short.strike) * OPTION_MULTIPLIER;
      for (const [shares, cash] of search(i + 1, used | (1 << j)))
        points.push([shares, cash + width]);
    });
    const kept = best(points);
    memo.set(key, kept);
    return kept;
  };
  return search(0, 0);
}

/** The least cash a set of short puts can be secured with — each by its strike, or by a distinct long
 *  put expiring no earlier at the strikes' width. */
function putCash(shorts: readonly Unit[], longs: readonly Unit[]): number {
  const memo = new Map<string, number>();
  const search = (i: number, used: number): number => {
    if (i === shorts.length) return 0;
    const key = `${i}:${used}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const short = shorts[i] as Unit;
    let least = short.strike * OPTION_MULTIPLIER + search(i + 1, used);
    longs.forEach((long, j) => {
      if (used & (1 << j) || long.expiration < short.expiration) return;
      const width = Math.max(0, short.strike - long.strike) * OPTION_MULTIPLIER;
      least = Math.min(least, width + search(i + 1, used | (1 << j)));
    });
    memo.set(key, least);
    return least;
  };
  return search(0, 0);
}

/**
 * What one underlying's contracts need, judged against the shares actually free to cover its sold
 * calls — under the BEST one-to-one assignment, not a greedy one. A sold call can be covered by 100
 * shares or by a long call (at its strikes' width in cash); which is right depends on what is held,
 * and `coverNeeds`' greedy pick, blind to the shares, read a fully covered book as short of cash
 * (#4645 fuzz). Of every assignment, the one that leaves the fewest calls without shares wins, then
 * the one needing the least cash.
 *
 * Exact means a guard may judge an order by whether it makes this WORSE: a covered book stays
 * covered, and a book already short of cover can still shed risk. Past `MAX_EXACT_CONTRACTS` it falls
 * back to `coverNeeds` (a valid assignment, so never an understatement of what that assignment needs)
 * and says so.
 */
export function coverShortfall(
  legs: readonly CoverLeg[],
  underlying: string,
  freeShares: number,
): Shortfall {
  const own = netLegs(legs).filter((l) => l.underlying === underlying);
  const calls = unitsOf(own, "call");
  const puts = unitsOf(own, "put");
  const room = Math.max(0, freeShares);
  const tooMany = [calls.shorts, calls.longs, puts.shorts, puts.longs].some(
    (units) => units.length > MAX_EXACT_CONTRACTS,
  );
  if (tooMany) {
    const greedy = coverNeeds(own);
    const shares = greedy.sharesByUnderlying.get(underlying) ?? 0;
    return {
      shares: Math.max(0, shares - room),
      cash: greedy.cashByUnderlying.get(underlying) ?? 0,
      exact: false,
    };
  }
  const short = (shares: number): number => Math.max(0, shares - room);
  const [fewestShort, leastCash] = callFrontier(calls.shorts, calls.longs).reduce<[number, number]>(
    (chosen, [shares, cash]) =>
      short(shares) < chosen[0] || (short(shares) === chosen[0] && cash < chosen[1])
        ? [short(shares), cash]
        : chosen,
    [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
  );
  return {
    shares: fewestShort,
    cash: leastCash + putCash(puts.shorts, puts.longs),
    exact: true,
  };
}

const coverLegOf = (c: HeldContract): CoverLeg => ({
  underlying: c.underlying,
  type: c.type,
  strike: c.strike,
  expiration: c.expiration,
  contracts: c.quantity,
});

/** Every contract held, as the cover arithmetic sees it. */
export function heldCoverLegs(portfolio: Portfolio): CoverLeg[] {
  return heldContracts(portfolio).map(coverLegOf);
}

/** What everything already held promises. */
export function bookNeeds(portfolio: Portfolio): CoverNeeds {
  return coverNeeds(heldCoverLegs(portfolio));
}

/** Cash not set aside to secure a sold put (or a spread's width). */
export function freeCash(portfolio: Portfolio, book: CoverNeeds = bookNeeds(portfolio)): number {
  return portfolio.cash - book.cash;
}

/** Shares of `underlying` not held back to cover a sold call. Negative when calls are already bare. */
export function freeShares(
  portfolio: Portfolio,
  underlying: string,
  book: CoverNeeds = bookNeeds(portfolio),
): number {
  return (
    Math.max(0, heldQuantity(portfolio, underlying)) -
    (book.sharesByUnderlying.get(underlying) ?? 0)
  );
}

const signOf = (side: Side): number => (side === "buy" ? 1 : -1);

/** The order's legs as signed contract lines: a buy adds contracts, a sell takes them away. */
export function orderLegs(option: OptionOrderIntent, units: number): CoverLeg[] {
  const legs: CoverLeg[] = [];
  for (const leg of option.legs) {
    const parts = parseOccSymbol(leg.occSymbol);
    if (!parts) continue;
    const sign = signOf(leg.side);
    legs.push({ ...parts, contracts: sign * leg.ratio * units });
  }
  return legs;
}

/** What the book would promise once `units` of this order filled. */
function needsWith(portfolio: Portfolio, option: OptionOrderIntent, units: number): CoverNeeds {
  return coverNeeds([...heldCoverLegs(portfolio), ...orderLegs(option, units)]);
}

function difference(after: CoverNeeds, before: CoverNeeds): CoverNeeds {
  const minus = (a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>) => {
    const out = new Map<string, number>();
    for (const key of new Set([...a.keys(), ...b.keys()])) {
      addTo(out, key, (a.get(key) ?? 0) - (b.get(key) ?? 0));
    }
    return out;
  };
  return {
    cash: after.cash - before.cash,
    cashByUnderlying: minus(after.cashByUnderlying, before.cashByUnderlying),
    sharesByUnderlying: minus(after.sharesByUnderlying, before.sharesByUnderlying),
  };
}

/** What `units` of an OPEN add to the book's promises — `coverNeeds(book ∪ order) − coverNeeds(book)`,
 *  per field. Negative where the order caps a short already held. */
export function marginalNeeds(
  portfolio: Portfolio,
  option: OptionOrderIntent,
  units: number,
): CoverNeeds {
  return difference(needsWith(portfolio, option, units), bookNeeds(portfolio));
}

/** What the book still promises once `units` of a CLOSE filled — closing the long that caps a short
 *  can leave that short bare. */
export function needsAfterClose(
  portfolio: Portfolio,
  option: OptionOrderIntent,
  units: number,
): CoverNeeds {
  return needsWith(portfolio, option, units);
}

/** Cash one unit of an order pays out in premium, in dollars: a bought single leg its limit, a
 *  vertical its net debit, a sold leg nothing. */
export function premiumOut(option: OptionOrderIntent): number {
  const [only, second] = option.legs;
  const perShare =
    second !== undefined
      ? Math.max(0, option.limitPrice)
      : only?.side === "buy"
        ? option.limitPrice
        : 0;
  return perShare * OPTION_MULTIPLIER;
}

/** Half a cent of slack when a cents limit meets a quoted band — float sums, never a price. */
const LIMIT_EPSILON = 0.005;

/** Whether a limit sits inside a quoted band (in the limit's own sign convention). The guards and
 *  the order flow's last re-check before sending share this, so they cannot disagree. */
export function limitInsideBand(
  limitPrice: number,
  band: { readonly low: number; readonly high: number },
): boolean {
  return limitPrice >= band.low - LIMIT_EPSILON && limitPrice <= band.high + LIMIT_EPSILON;
}

/** Sums of per-share quotes drift in the 15th decimal; a band is compared against a cents limit. */
const tidy = (x: number): number => Math.round(x * 1e6) / 1e6;

/** The band the market quotes for this order, per share, in its limit's sign convention. */
export interface QuotedBand {
  readonly low: number;
  readonly high: number;
  /** The oldest feed stamp among the legs; absent when any leg's quote carries none. */
  readonly at?: string;
}

/**
 * The quoted band an order's limit must sit inside. One leg: `[bid, ask]`. Two legs, in Alpaca's
 * signed net (+ debit, − credit): `low = Σ(buy ? bid : −ask)`, `high = Σ(buy ? ask : −bid)` — the
 * one formula prices a debit-spread open and its close. `undefined` when a leg has no two-sided quote.
 */
export function quoteBand(
  option: OptionOrderIntent,
  quotes: Readonly<Record<string, OptionContractQuote>>,
): QuotedBand | undefined {
  const legQuotes = option.legs.map((leg) => ({ leg, quote: quotes[leg.occSymbol] }));
  let low = 0;
  let high = 0;
  const stamps: string[] = [];
  let stampMissing = false;
  for (const { leg, quote } of legQuotes) {
    // Two real numbers, ask at or above bid — a null, infinite or inverted side prices nothing.
    const bid = quote?.bid;
    const ask = quote?.ask;
    if (bid === undefined || ask === undefined || !Number.isFinite(bid) || !Number.isFinite(ask)) {
      return undefined;
    }
    if (ask < bid) return undefined;
    if (legQuotes.length === 1) {
      low = bid;
      high = ask;
    } else {
      low += leg.ratio * (leg.side === "buy" ? bid : -ask);
      high += leg.ratio * (leg.side === "buy" ? ask : -bid);
    }
    if (quote?.quotedAt === undefined) stampMissing = true;
    else stamps.push(quote.quotedAt);
  }
  const oldest = [...stamps].sort((a, b) => Date.parse(a) - Date.parse(b))[0];
  return {
    low: tidy(low),
    high: tidy(high),
    ...(stampMissing || oldest === undefined ? {} : { at: oldest }),
  };
}
