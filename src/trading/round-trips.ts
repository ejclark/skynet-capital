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
 *    sell to the held quantity, so the path cannot short, so a truncated stock sell is always a
 *    genuine gap, never a write.
 *
 * **Short lots (#838, closing the gap #468/#825 left open).** A written put or covered call
 * (course 201/202) opens with a sell and has no matching long lot — the *opposite* direction from
 * every other position this matcher opens. Rather than folding that into the generic "no visible
 * opening lot" gap above, a sell with nothing open left to close **opens a short lot** — but only
 * when the symbol is option-shaped (`isOccSymbol`). That gate is what keeps stock's "no accidental
 * shorting" invariant intact: `option-ticket.ts`'s 201/202 tickets are the *only* path in this app
 * that lets a member sell a contract they don't hold, so an unmatched real sell on an option
 * symbol is reliably a write-to-open, not a stray close of a stale position — the same certainty
 * `guards.ts` gives the stock path by construction. A short lot then closes symmetrically to a
 * long one: a later **buy** (buying back the written contract) or a **synthetic** close
 * (`TradeFill.synthetic` — `OPEXP`/`OPASN` from `option-lifecycle.ts`) matches it FIFO, with the
 * realized math reversed (premium collected minus price paid to close, not exit minus entry).
 * `RoundTrip.direction` and the open lot's `direction` are set to `"short"` on this path and
 * omitted (defaulting to long) everywhere else, so every long-lot fixture is unaffected.
 *
 * This still inherits one narrow slice of the window-truncation gap above: a long option whose
 * *own opening buy* fell outside the fetched window would, on a later sell with nothing to close,
 * also read as "nothing open" and open a short lot instead of flagging truncated. That is the same
 * category of imperfection the stock case already accepts (a position opened before the window is
 * fundamentally unknowable from fills alone) — narrower here because it only bites a contract
 * whose entire lifecycle sits outside one fetch, not a general ambiguity.
 *
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
   * honest (no cash changed hands to close the leg), and it still closes a genuine open lot
   * exactly like a real fill would — a LONG lot first (a bought option expiring worthless), and,
   * failing that, a SHORT lot (a written option expiring worthless or getting assigned — #838),
   * scored with the reversed short-side math so the premium collected comes out as a gain rather
   * than a loss. Only when NEITHER kind of lot is open does it fall through as a safe no-op — the
   * write itself was never seen in this fill window, so there is nothing honest to close.
   * Ordinary fills never set this and are unaffected.
   */
  readonly synthetic?: boolean;
}

/** A matched, closed trade: shares bought and later sold — or, for a written option, sold to
 *  open and later bought back (or closed at $0 by expiry/assignment). */
export interface RoundTrip {
  readonly symbol: string;
  readonly quantity: number;
  /** The opening fill's price — what was paid (long) or collected (short) per share. */
  readonly entryPrice: number;
  /** The closing fill's price — what was received (long) or paid (short) per share. */
  readonly exitPrice: number;
  readonly openedAt: string;
  readonly closedAt: string;
  /** Realized dollars: (exit − entry) × quantity for a long round trip, reversed — (entry − exit)
   *  × quantity — for a short one, so the premium collected on a written option comes out as a
   *  gain and buying it back for more than that comes out as a loss. */
  readonly realized: number;
  /** Realized as a percent of the entry-side basis. */
  readonly returnPct: number;
  /** Milliseconds held, entry fill → exit fill. */
  readonly holdMs: number;
  /** `"short"` for a written option's round trip (opened by a sell, closed by a buy or a
   *  synthetic $0 close); omitted — never `"long"` — for the default long round trip, so every
   *  existing long-lot fixture matches unchanged. */
  readonly direction?: "short";
}

/** An unmatched lot still open at the end of the fill window. */
interface OpenLot {
  readonly symbol: string;
  readonly quantity: number;
  readonly price: number;
  readonly at: string;
  /** `"short"` for a still-open written option (sold to open, not yet bought back or closed by
   *  expiry/assignment); omitted for the default long lot. */
  readonly direction?: "short";
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

/** `direction` picks the realized-P/L sign: long is (exit − entry), short is the mirror image
 *  (entry − exit) — the same matched quantity and lot either way. */
function tripFrom(
  lot: Lot,
  fill: TradeFill,
  price: number,
  matched: number,
  direction: "long" | "short",
): RoundTrip {
  const realized =
    direction === "long" ? (price - lot.price) * matched : (lot.price - price) * matched;
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
    ...(direction === "short" ? { direction } : {}),
  };
}

/** Drain `lots` FIFO against `remaining`, pushing a `direction` trip for each match. Returns the
 *  quantity still unmatched (0 when `lots` covered it all). Shared by both matching directions —
 *  a sell closing long lots, and a buy or synthetic close closing short ones. */
function closeAgainst(
  lots: Lot[],
  remaining: number,
  fill: TradeFill,
  price: number,
  direction: "long" | "short",
  trips: RoundTrip[],
): number {
  let left = remaining;
  while (left > 0 && lots.length > 0) {
    const lot = lots[0] as Lot;
    const matched = Math.min(left, lot.quantity);
    trips.push(tripFrom(lot, fill, price, matched, direction));
    lot.quantity -= matched;
    left -= matched;
    if (lot.quantity <= 0) lots.shift();
  }
  return left;
}

/** FIFO-match one symbol's fills. Returns the quantity sold with nothing open to match it. */
function matchSymbol(
  symbol: string,
  fills: readonly TradeFill[],
  trips: RoundTrip[],
  open: OpenLot[],
): number {
  const longLots: Lot[] = [];
  const shortLots: Lot[] = [];
  // Whether a bare sell with nothing left to close can open a NEW short lot (#838). Gated to
  // option-shaped symbols — see the module doc's "Short lots" section for why that gate is safe.
  const optionShaped = isOccSymbol(symbol);
  let unmatchedSells = 0;

  for (const fill of fills) {
    const price = fill.price as number;

    if (fill.side === "buy") {
      // Buying back a written option closes its short lot first (a real fill only — a synthetic
      // close is always modeled as a sell, see `TradeFill.synthetic`); anything left over opens a
      // new long lot exactly as before.
      const remaining = closeAgainst(shortLots, fill.quantity, fill, price, "short", trips);
      if (remaining > 0) longLots.push({ quantity: remaining, price, at: fill.at });
      continue;
    }

    // Sell: close long lots first, exactly as before.
    let remaining = closeAgainst(longLots, fill.quantity, fill, price, "long", trips);

    if (remaining > 0 && optionShaped) {
      if (fill.synthetic) {
        // A lifecycle close (`OPEXP`/`OPASN`) with no long lot left: it's closing a WRITTEN
        // option at $0, not a no-op — buy it back against the short lot instead.
        remaining = closeAgainst(shortLots, remaining, fill, price, "short", trips);
      } else {
        // A real sell with nothing long to close, on an option contract, is a sell-to-open
        // (course 201/202) — this app has no other path to a bare option short. Open it.
        shortLots.push({ quantity: remaining, price, at: fill.at });
        remaining = 0;
      }
    }

    // A synthetic close that still found nothing to close (neither long nor short) is a safe
    // no-op — the write itself fell outside this fill window, so there is nothing honest to
    // close. A real, non-synthetic unmatched sell is the genuine "history begins mid-trade" gap.
    if (!fill.synthetic) unmatchedSells += remaining;
  }

  for (const lot of longLots) {
    open.push({ symbol, quantity: lot.quantity, price: lot.price, at: lot.at });
  }
  for (const lot of shortLots) {
    open.push({ symbol, quantity: lot.quantity, price: lot.price, at: lot.at, direction: "short" });
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
