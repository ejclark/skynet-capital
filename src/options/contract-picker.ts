import { daysBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { SNAPSHOT_MAX_AGE_MS } from "../domain/option-book.js";
import type { OptionContractQuote, OptionMarket, PlaybookMode, Side } from "../domain/types.js";
import {
  MAX_SPREAD_OF_MID,
  MIN_BID,
  MIN_OPEN_INTEREST,
  QUOTE_STALE_MS,
} from "./position-guidance-rules.js";
import { impliedVolatility, priceOption } from "./pricing.js";

/**
 * How a bot playbook picks a contract and a limit — PURE: no clock, no I/O. Every choice is a total
 * order, so the order rows arrive in from the feed never changes a pick. The liquidity numbers are
 * the guidance's own (`position-guidance-rules.ts`): one threshold, one place.
 */

/** Opens price this far from mid toward the natural side, by mode. */
export const OPEN_TOWARD_NATURAL: Readonly<Record<PlaybookMode, number>> = {
  conservative: 0,
  standard: 0.25,
  aggressive: 0.5,
};

export interface ExpiryBounds {
  readonly minDte?: number;
  readonly maxDte?: number;
  /** Strictly after this date. */
  readonly after?: string;
  /** Strictly before this date — a print blackout's first day, say. */
  readonly before: string;
}

/** The listed expirations inside the bounds, ascending. Never today or earlier (`minDte` ≥ 1). */
export function eligibleExpirations(
  listed: readonly string[],
  today: string,
  bounds: ExpiryBounds,
): string[] {
  const minDte = Math.max(1, bounds.minDte ?? 1);
  return [...new Set(listed)].sort().filter((expiration) => {
    const dte = daysBetween(today, expiration);
    return (
      dte >= minDte &&
      (bounds.maxDte === undefined || dte <= bounds.maxDte) &&
      (bounds.after === undefined || expiration > bounds.after) &&
      expiration < bounds.before
    );
  });
}

/** A quote a bot may trade against: a real bid, a tight spread, open interest when the feed has it,
 *  a feed stamp under 15 minutes old, and a read under 120 seconds old. */
export function liquid(quote: OptionContractQuote, asOfIso: string): boolean {
  const { bid, ask } = quote;
  if (bid === undefined || ask === undefined || !(bid >= MIN_BID && ask >= bid)) return false;
  if ((ask - bid) / ((ask + bid) / 2) > MAX_SPREAD_OF_MID) return false;
  if (quote.openInterest !== undefined && quote.openInterest < MIN_OPEN_INTEREST) return false;
  const asOf = Date.parse(asOfIso);
  if (quote.quotedAt === undefined || !(asOf - Date.parse(quote.quotedAt) <= QUOTE_STALE_MS)) {
    return false;
  }
  return asOf - Date.parse(quote.fetchedAt) <= SNAPSHOT_MAX_AGE_MS;
}

export interface AbsDelta {
  readonly value: number;
  readonly source: "feed" | "model";
}

/** |delta|: the feed's greek when it has one, else solved from the mid through the house model. */
export function absDeltaOf(
  quote: OptionContractQuote,
  spot: number,
  today: string,
): AbsDelta | undefined {
  if (quote.delta !== undefined && Number.isFinite(quote.delta)) {
    return { value: Math.abs(quote.delta), source: "feed" };
  }
  if (quote.bid === undefined || quote.ask === undefined) return undefined;
  const daysToExpiry = Math.max(1, daysBetween(today, quote.expiration));
  const input = { spot, strike: quote.strike, daysToExpiry, type: quote.type } as const;
  const volatility = impliedVolatility({ ...input, marketPrice: (quote.bid + quote.ask) / 2 });
  if (volatility === undefined) return undefined;
  const delta = priceOption({ ...input, volatility })?.delta;
  return delta === undefined ? undefined : { value: Math.abs(delta), source: "model" };
}

/** One chain out of a cycle's snapshot — every quoted strike of one type at one expiry, in no
 *  particular order (every pick below is a total order, so the order never matters). */
export function chainQuotes(
  market: OptionMarket | undefined,
  underlying: string,
  expiration: string,
  type: "call" | "put",
): OptionContractQuote[] {
  return Object.values(market?.contracts ?? {}).filter(
    (q) => q.underlying === underlying && q.expiration === expiration && q.type === type,
  );
}

export interface PickBounds {
  readonly minStrike?: number;
  readonly maxStrike?: number;
  /** Out-of-the-money rows only (a call above spot, a put below). Default true. */
  readonly otm?: boolean;
  /** How far |delta| may sit from the target. Without it "nearest" has no limit: when only
   *  near-the-money rows are liquid, a 0.20 target would sell a 0.45 strike. */
  readonly maxDeltaMiss?: number;
  /** The highest |delta| a pick may carry — a sold strike's ceiling. */
  readonly maxAbsDelta?: number;
}

export interface DeltaPick {
  readonly quote: OptionContractQuote;
  readonly absDelta: number;
  readonly deltaSource: "feed" | "model";
  /** Liquid rows inside the strike bounds — the audit trail's "out of how many" the delta rule
   *  chose from. */
  readonly candidates: number;
}

const spreadOfMid = (q: OptionContractQuote): number =>
  ((q.ask ?? 0) - (q.bid ?? 0)) / (((q.ask ?? 0) + (q.bid ?? 0)) / 2);

const roundTo = (x: number, scale: number): number => Math.round(x * scale) / scale;

const outOfTheMoney = (q: OptionContractQuote, spot: number): boolean =>
  q.type === "call" ? q.strike > spot : q.strike < spot;

const insideStrikes = (q: OptionContractQuote, spot: number, bounds: PickBounds): boolean =>
  (bounds.minStrike === undefined || q.strike >= bounds.minStrike) &&
  (bounds.maxStrike === undefined || q.strike <= bounds.maxStrike) &&
  (!(bounds.otm ?? true) || outOfTheMoney(q, spot));

const insideDeltaWindow = (absDelta: number, distance: number, bounds: PickBounds): boolean =>
  (bounds.maxDeltaMiss === undefined || distance <= roundTo(bounds.maxDeltaMiss, 1e6)) &&
  (bounds.maxAbsDelta === undefined || roundTo(absDelta, 1e6) <= bounds.maxAbsDelta);

/**
 * The liquid row whose |delta| sits nearest `target`, inside the strike bounds and the delta window
 * (`maxDeltaMiss`, `maxAbsDelta`) — `undefined` when no row fits, so nothing trades rather than a
 * strike far from what the play promises. Ties go to the tighter spread, then the farther
 * out-of-the-money strike, then the OCC symbol — a total order. `asOfIso` is the cycle's clock: it
 * judges each row's freshness and sets "today" for the model.
 */
export function pickByDelta(
  rows: readonly OptionContractQuote[],
  target: number,
  spot: number,
  asOfIso: string,
  bounds: PickBounds = {},
): DeltaPick | undefined {
  const today = marketDayKey(asOfIso);
  let candidates = 0;
  const scored: (DeltaPick & { readonly distance: number; readonly spread: number })[] = [];
  for (const quote of rows) {
    if (!(liquid(quote, asOfIso) && insideStrikes(quote, spot, bounds))) continue;
    const delta = absDeltaOf(quote, spot, today);
    if (!delta) continue;
    candidates += 1;
    // Rounded so float noise (0.21 − 0.20 vs 0.20 − 0.19) never decides — the tie-breaks and the
    // window edges do.
    const distance = roundTo(Math.abs(delta.value - target), 1e6);
    if (!insideDeltaWindow(delta.value, distance, bounds)) continue;
    scored.push({
      quote,
      absDelta: delta.value,
      deltaSource: delta.source,
      candidates: 0,
      distance,
      spread: roundTo(spreadOfMid(quote), 1e9),
    });
  }
  scored.sort(
    (a, b) =>
      a.distance - b.distance ||
      a.spread - b.spread ||
      (a.quote.type === "call"
        ? b.quote.strike - a.quote.strike
        : a.quote.strike - b.quote.strike) ||
      a.quote.occSymbol.localeCompare(b.quote.occSymbol),
  );
  const best = scored[0];
  return best
    ? {
        quote: best.quote,
        absDelta: best.absDelta,
        deltaSource: best.deltaSource,
        candidates,
      }
    : undefined;
}

const SINGLE_LEG_TICKS = [0.1, 0.05, 0.01] as const;
const isMultiple = (x: number, tick: number): boolean =>
  Math.abs(Math.round(x / tick) * tick - x) < 1e-9;

/** A single leg's price increment, read off its own quotes: the coarsest of $0.10/$0.05/$0.01 both
 *  sides sit on, never coarser than $0.05 below a $3 ask or $0.10 at or above it. A vertical's net
 *  prices in $0.01. */
export function singleLegTick(bid: number, ask: number): number {
  const cap = ask < 3 ? 0.05 : 0.1;
  return (
    SINGLE_LEG_TICKS.find((t) => t <= cap + 1e-12 && isMultiple(bid, t) && isMultiple(ask, t)) ??
    0.01
  );
}

/**
 * A limit on the tick grid inside `[low, high]`: from mid, `towardNatural` of the way to the natural
 * side (a buy's ask, a sell's bid). The grid point nearest that target wins; a tie goes to the better
 * price for the bot. `undefined` when no grid point fits the band.
 *
 * A vertical in Alpaca's signed net is always priced as a "buy" on its signed band — a lower number
 * is the better one for the bot either way.
 */
export function priceInside(
  band: { readonly low: number; readonly high: number },
  side: Side,
  towardNatural: number,
  tick: number,
): number | undefined {
  const { low, high } = band;
  if (!(Number.isFinite(low) && Number.isFinite(high) && low <= high && tick > 0)) return undefined;
  const t = Math.min(1, Math.max(0, towardNatural));
  const mid = (low + high) / 2;
  const target = side === "buy" ? mid + t * (high - mid) : mid - t * (mid - low);
  const first = Math.ceil(low / tick - 1e-9);
  const last = Math.floor(high / tick + 1e-9);
  if (first > last) return undefined;
  const clampK = (k: number) => Math.min(last, Math.max(first, k));
  const below = clampK(Math.floor(target / tick + 1e-9));
  const above = clampK(Math.ceil(target / tick - 1e-9));
  const gap = (k: number) => Math.abs(k * tick - target);
  const better = side === "buy" ? below : above;
  const k =
    Math.abs(gap(below) - gap(above)) < 1e-9 ? better : gap(below) < gap(above) ? below : above;
  return Math.round(k * tick * 100) / 100;
}

/**
 * How hard a due close leans toward the natural side, by sessions past its due date and the ET time:
 * mid first, a third by 14:00, two thirds by 15:30; the session after, two thirds then natural from
 * 14:00; two sessions late, natural. A close must never starve at mid.
 */
export function closeAggression(sessionsSinceDue: number, etTime: string): number {
  if (sessionsSinceDue <= 0) return etTime < "14:00" ? 0 : etTime < "15:30" ? 1 / 3 : 2 / 3;
  if (sessionsSinceDue === 1) return etTime < "14:00" ? 2 / 3 : 1;
  return 1;
}
