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
 *  - the fill window is finite (the broker returns the last N orders), so a sell with no visible
 *    opening lot is **dropped and flagged** (`truncated`), never matched against an unrelated
 *    later buy. For stock this means "opened before this window": `engine/guards.ts` clamps every
 *    sell to the held quantity, so the path cannot short. **Options are the exception** — a
 *    written put or covered call (course 201/202) opens with a sell, so its premium currently
 *    lands in `unmatchedSellQuantity` and sets `truncated` rather than opening a short lot. That
 *    is under-reporting, never over-reporting, and it is flagged rather than silent; short-lot
 *    matching is tracked on #468 and deliberately not faked here.
 *  - what's still open is returned (`open`), so a caller can reconcile matched lots against the
 *    broker's live positions instead of assuming the window covered everything.
 */

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
}

/** An unmatched lot still open at the end of the fill window. */
interface OpenLot {
  readonly symbol: string;
  readonly quantity: number;
  readonly price: number;
  readonly at: string;
}

export interface RoundTripLedger {
  /** Closed trades, oldest close first. */
  readonly trips: RoundTrip[];
  /** Lots still open when the fills ran out. */
  readonly open: OpenLot[];
  /** Fills dropped for want of a fill price — surfaced so the view can say so out loud. */
  readonly unpricedFills: number;
  /** Shares sold with no visible opening lot: history begins mid-trade. Dropped, never invented. */
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

function tripFrom(lot: Lot, fill: TradeFill, price: number, matched: number): RoundTrip {
  const realized = (price - lot.price) * matched;
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
  };
}

/** FIFO-match one symbol's fills. Returns the quantity sold with nothing open to match it. */
function matchSymbol(
  symbol: string,
  fills: readonly TradeFill[],
  trips: RoundTrip[],
  open: OpenLot[],
): number {
  const lots: Lot[] = [];
  let unmatchedSells = 0;

  for (const fill of fills) {
    const price = fill.price as number;
    if (fill.side === "buy") {
      lots.push({ quantity: fill.quantity, price, at: fill.at });
      continue;
    }
    let remaining = fill.quantity;
    while (remaining > 0 && lots.length > 0) {
      const lot = lots[0] as Lot;
      const matched = Math.min(remaining, lot.quantity);
      trips.push(tripFrom(lot, fill, price, matched));
      lot.quantity -= matched;
      remaining -= matched;
      if (lot.quantity <= 0) lots.shift();
    }
    unmatchedSells += remaining;
  }

  for (const lot of lots) {
    open.push({ symbol, quantity: lot.quantity, price: lot.price, at: lot.at });
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
