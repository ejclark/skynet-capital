/**
 * ROUND-TRIP RECONSTRUCTION — the missing spine under "trade history" and "trade analysis".
 *
 * A broker hands back *fills*, not trades. "Bought 10 AAPL, bought 5 more, sold 12" is three fills
 * and one-and-a-bit trades; nothing downstream can say "your win rate" until those fills are
 * matched into closed round trips. Every serious journal does this, and does it with **FIFO lot
 * matching** — first shares in are the first shares out — because that is the industry (and IRS)
 * default, so a number computed here reconciles with a brokerage statement instead of quietly
 * disagreeing with it.
 *
 * Honesty invariants (asserted by specs):
 *  - a fill with no recorded fill price cannot produce a P/L, so it is **excluded and counted**
 *    (`unpricedFills`) rather than silently treated as a $0 fill.
 *  - unfilled/partial orders contribute only their FILLED quantity — a submitted order is not a
 *    trade.
 *  - the fill window is finite (the broker returns the last N orders), so a **stock** sell with no
 *    visible opening lot is **dropped and flagged** (`truncated`), never matched against an
 *    unrelated later buy. It means "opened before this window": `engine/guards.ts` clamps every
 *    sell to the held quantity, so the stock path cannot short.
 *  - **options are the exception, because there the sell is genuinely an opening** — a written put
 *    or covered call (course 201/202) starts with a sell-to-open. So on an OCC symbol an unmatched
 *    sell opens a **short lot**, which later closes on a buy-to-close or on an expiry/assignment
 *    (#838). Its `realized` is premium received − cost to close, and `returnPct` is measured
 *    against the premium, so a contract written for $420 and expiring worthless reads +$420 / +100%.
 *    The cost of that choice, stated plainly: a LONG option opened before the window and sold to
 *    close inside it now shows as a written lot in `open` instead of setting `truncated`. That is
 *    the narrower error — this app journals its own fills durably (`observatory/activity-store.ts`)
 *    and merges them with the broker window, so a leg it opened is in the record; whereas a written
 *    option that can never score is a permanent hole in every stat downstream.
 *  - what's still open is returned (`open`), so a caller can reconcile matched lots against the
 *    broker's live positions instead of assuming the window covered everything.
 */

import { isOccSymbol } from "./option-symbols.js";

/** One executed fill — the narrow shape round-tripping needs, independent of any broker payload. */
export interface TradeFill {
  readonly symbol: string;
  readonly side: "buy" | "sell";
  /** Shares actually filled. Zero-filled orders are ignored. */
  readonly quantity: number;
  /** Average fill price. Undefined when the broker recorded none — the fill is then excluded. */
  readonly price?: number;
  /** ISO-8601 execution time. */
  readonly at: string;
  /**
   * True for a "close" synthesized from a lifecycle event (an option expiring or being
   * assigned — #468 criterion 6) rather than a real order fill. The $0 price on one of these is
   * honest: no cash changes hands to close the leg either way, so it wipes out a long option's
   * premium and lets a written one's premium be kept in full.
   *
   * A synthetic fill is a **directionless close**: it ends whichever leg is open — a long lot
   * (bought, so it closes like a sell) or a short one (written, so it closes like a buy) — and it
   * never OPENS a lot, because an expiry or assignment can only end a position. Its nominal `side`
   * is therefore ignored by the matcher, which also means the broker's own `side` field on a
   * lifecycle activity cannot mis-steer the math. With nothing open it stays a no-op rather than
   * inflating `unmatchedSellQuantity` with a "history begins mid-trade" caveat it didn't earn.
   * Ordinary fills never set this and are unaffected.
   */
  readonly synthetic?: boolean;
}

/** A matched, closed trade: shares bought and later sold. */
export interface RoundTrip {
  readonly symbol: string;
  readonly quantity: number;
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly openedAt: string;
  readonly closedAt: string;
  /** Realized dollars: (exit − entry) × quantity. */
  readonly realized: number;
  /** Realized as a percent of the cost basis. */
  readonly returnPct: number;
  /** Milliseconds held, entry fill → exit fill. */
  readonly holdMs: number;
  /**
   * True when the trip was WRITTEN — opened with a sell (201/202) and closed with a buy, an
   * expiry, or an assignment. `entryPrice` is then the premium received and `exitPrice` what it
   * cost to close, so `realized` is entry − exit rather than exit − entry. Absent on an ordinary
   * long trip. Any reader rendering entry → exit needs this: for a written contract that expired,
   * "$420 → $0" is a full WIN, not a wipeout.
   */
  readonly short?: boolean;
}

/** An unmatched lot still open at the end of the fill window. */
interface OpenLot {
  readonly symbol: string;
  readonly quantity: number;
  readonly price: number;
  readonly at: string;
  /** True when the lot was sold to open (a written option): `price` is premium received and the
   *  lot closes with a buy. Absent on an ordinary long lot. */
  readonly short?: boolean;
}

export interface RoundTripLedger {
  /** Closed trades, oldest close first. */
  readonly trips: RoundTrip[];
  /** Lots still open when the fills ran out. */
  readonly open: OpenLot[];
  /** Fills dropped for want of a fill price — surfaced so the view can say so out loud. */
  readonly unpricedFills: number;
  /** Shares sold with no visible opening lot: history begins mid-trade. Dropped, never invented.
   *  Stock only — an option sell with nothing open is a written contract, so it opens a short lot
   *  instead of landing here (see the module doc). */
  readonly unmatchedSellQuantity: number;
  /** True when any sell went unmatched — the record is a window, not the whole story. */
  readonly truncated: boolean;
}

interface Lot {
  quantity: number;
  price: number;
  at: string;
}

function isUsable(fill: TradeFill): boolean {
  return Number.isFinite(fill.quantity) && fill.quantity > 0;
}

function holdMs(openedAt: string, closedAt: string): number {
  const open = new Date(openedAt).getTime();
  const close = new Date(closedAt).getTime();
  if (!(Number.isFinite(open) && Number.isFinite(close))) return 0;
  return Math.max(0, close - open);
}

/** Which way a symbol's open lots point. A netted FIFO position is never both at once, which is
 *  what lets one lot queue serve both directions instead of a parallel short-lot structure. */
type LotDirection = "long" | "short";

function tripFrom(
  lot: Lot,
  fill: TradeFill,
  price: number,
  matched: number,
  direction: LotDirection,
): RoundTrip {
  // A short lot earns the premium it was written for and pays whatever closing it costs, so its
  // realized dollars run the other way. The basis is the premium in both readings — it is what the
  // lot was opened at — so `returnPct` stays "percent of what went in".
  const short = direction === "short";
  const realized = (short ? lot.price - price : price - lot.price) * matched;
  const basis = lot.price * matched;
  return {
    symbol: fill.symbol,
    quantity: matched,
    entryPrice: lot.price,
    exitPrice: price,
    openedAt: lot.at,
    closedAt: fill.at,
    realized,
    returnPct: basis > 0 ? (realized / basis) * 100 : 0,
    holdMs: holdMs(lot.at, fill.at),
    ...(short ? { short: true } : {}),
  };
}

/**
 * Does this fill close what is open, rather than add to it? A sell closes long lots and a buy
 * closes short ones; a synthetic lifecycle close ends whichever leg is open (`TradeFill.synthetic`).
 */
function closesPosition(fill: TradeFill, direction: LotDirection): boolean {
  if (fill.synthetic) return true;
  return direction === "long" ? fill.side === "sell" : fill.side === "buy";
}

/** Consume open lots FIFO against a closing fill. Returns the quantity it could not close. */
function closeAgainst(
  lots: Lot[],
  fill: TradeFill,
  price: number,
  quantity: number,
  direction: LotDirection,
  trips: RoundTrip[],
): number {
  let remaining = quantity;
  while (remaining > 0 && lots.length > 0) {
    const lot = lots[0] as Lot;
    const matched = Math.min(remaining, lot.quantity);
    trips.push(tripFrom(lot, fill, price, matched, direction));
    lot.quantity -= matched;
    remaining -= matched;
    if (lot.quantity <= 0) lots.shift();
  }
  return remaining;
}

/**
 * FIFO-match one symbol's fills, in either direction. Returns the quantity sold with nothing open
 * to match it — which, per the module doc, can only happen on a symbol that cannot be sold to open.
 */
function matchSymbol(
  symbol: string,
  fills: readonly TradeFill[],
  trips: RoundTrip[],
  open: OpenLot[],
): number {
  const lots: Lot[] = [];
  let direction: LotDirection = "long";
  let unmatchedSells = 0;
  // Only an option can be sold to open here (201/202). A stock sell is clamped to the held
  // quantity upstream (`engine/guards.ts`), so an unmatched one is a truncated window, not a short.
  const canWrite = isOccSymbol(symbol);

  for (const fill of fills) {
    const price = fill.price as number;
    let remaining = fill.quantity;
    if (lots.length > 0 && closesPosition(fill, direction)) {
      remaining = closeAgainst(lots, fill, price, remaining, direction, trips);
    }

    // Whatever is left OPENS a lot in this fill's own direction — with two exceptions. An expiry
    // or assignment ends a position and can never start one, so a synthetic leftover is dropped.
    if (remaining <= 0 || fill.synthetic) continue;
    if (fill.side === "sell" && !canWrite) {
      unmatchedSells += remaining;
      continue;
    }
    // Flat, so this fill sets the direction; otherwise it is adding to the leg already open.
    if (lots.length === 0) direction = fill.side === "buy" ? "long" : "short";
    lots.push({ quantity: remaining, price, at: fill.at });
  }

  for (const lot of lots) {
    open.push({
      symbol,
      quantity: lot.quantity,
      price: lot.price,
      at: lot.at,
      ...(direction === "short" ? { short: true } : {}),
    });
  }
  return unmatchedSells;
}

/**
 * Fills → closed trades. Fills may arrive in any order (brokers return newest-first); they are
 * sorted oldest-first before matching so FIFO means what it says.
 */
export function matchRoundTrips(fills: readonly TradeFill[]): RoundTripLedger {
  const usable = fills.filter(isUsable);
  const unpricedFills = usable.filter((f) => !Number.isFinite(f.price as number)).length;
  const priced = usable
    .filter((f) => Number.isFinite(f.price as number))
    .sort((a, b) => a.at.localeCompare(b.at));

  const bySymbol = new Map<string, TradeFill[]>();
  for (const fill of priced) {
    const list = bySymbol.get(fill.symbol);
    if (list) list.push(fill);
    else bySymbol.set(fill.symbol, [fill]);
  }

  const trips: RoundTrip[] = [];
  const open: OpenLot[] = [];
  let unmatchedSellQuantity = 0;
  for (const [symbol, symbolFills] of bySymbol) {
    unmatchedSellQuantity += matchSymbol(symbol, symbolFills, trips, open);
  }
  trips.sort((a, b) => a.closedAt.localeCompare(b.closedAt));
  return {
    trips,
    open,
    unpricedFills,
    unmatchedSellQuantity,
    truncated: unmatchedSellQuantity > 0,
  };
}

/** Total realized dollars across a set of trips — the one place this sum lives. */
export function totalRealized(trips: readonly RoundTrip[]): number {
  return trips.reduce((sum, trip) => sum + trip.realized, 0);
}
