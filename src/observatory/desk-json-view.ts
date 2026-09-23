import type { PlaybookStoreEntry } from "../discovery/playbook-store.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginateDesc } from "../server/pagination.js";
import { humanizeOptionSymbol, isOccSymbol } from "../trading/option-symbols.js";
import type { OpenLot, RoundTripLedger } from "../trading/round-trips.js";
import type { TradeActivityRecord } from "./activity-record.js";
import { collapseActivity } from "./activity-store.js";
import {
  type ConsiderationChip,
  considerationsFor,
  type PositionForConsiderations,
} from "./considerations-view.js";
import { formatPrice } from "./desk-data.js";
import {
  NO_ORIGIN_EVIDENCE,
  type OrderOrigin,
  type OrderOriginIndex,
  orderOrigin,
} from "./order-origin.js";
import { participantInvested, participantUnrealized } from "./participant-card.js";
import {
  costBasis,
  dayPl,
  type ParticipantSnapshot,
  unrealizedPl,
} from "./participant-snapshot.js";
import { formatCurrency, formatSigned, formatTimestamp, pct, plClass } from "./render-atoms.js";

/**
 * THE DESK AS DATA — the JSON view `/api/desk/:id` serves the React shell.
 *
 * The same numbers the server-rendered blotter shows (`positions-view.ts`), formatted by the same
 * helpers, so the two renderers can never disagree about a figure. Raw numerics ride alongside the
 * formatted strings only where the client needs them for FILTERING (`pl:>0`, `is:option`) — never
 * for re-deriving a display value.
 */

type Tone = "pos" | "neg" | "flat";

/**
 * One still-open tax lot inside a position — the same 9 numeric/display fields as
 * `DeskPositionView` itself (Slice 1 of #3186: a lot row must share the parent row's exact
 * column set), plus a label identifying which fill opened it. Only ever attached when the
 * lots reconstructed from the fill ledger provably account for the whole position (see
 * `lotsFor`) — a position this app cannot honestly decompose renders with no `lots` at all
 * rather than a partial or approximate breakdown.
 */
export interface PositionLot {
  readonly lotId: string;
  /** Pre-formatted, like every other display field on this view — never a raw ISO timestamp
   *  for the client to reformat. */
  readonly openedAt: string;
  readonly quantity: string;
  readonly costPerShare: string;
  readonly price: string;
  readonly costBasis: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly returnPct: string;
  readonly totalTone: Tone;
}

interface DeskPositionView {
  readonly symbol: string;
  readonly display: string;
  readonly detail: string;
  readonly isOption: boolean;
  readonly quantity: string;
  readonly costPerShare: string;
  readonly price: string;
  readonly costBasis: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayPct: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly totalPlRaw: number;
  readonly returnPct: string;
  readonly totalTone: Tone;
  readonly weightPct: number;
  /** Present only when the fill ledger's open lots for this symbol are all long and their
   *  quantities sum exactly to the position's own — see `lotsFor`. */
  readonly lots?: readonly PositionLot[];
}

/**
 * Reconstruct a position's lot breakdown from the round-trip matcher's `open` lots (Slice 1 of
 * #3186) — never independently re-derived, so a lot's qty/cost-basis/value/P&L are each a
 * strict partition of the position's own (same `mark`, same `lastdayPrice` rule as the parent),
 * and summing them algebraically reduces to exactly the parent row's figures.
 *
 * Deliberately conservative: a written/short lot has inverted P&L semantics this view doesn't
 * attempt to render yet, and a truncated fill window can leave the reconstructed quantity short
 * of the broker's own. Either case means an honest breakdown isn't possible, so `undefined` is
 * returned — the caller falls back to today's aggregate-only row rather than showing a partial
 * or silently-wrong lot list.
 */
function lotsFor(
  symbol: string,
  openLots: readonly OpenLot[] | undefined,
  position: {
    readonly quantity: number;
    readonly marketValue: number;
    readonly lastdayPrice?: number;
  },
  mark: number,
): PositionLot[] | undefined {
  const lots = (openLots ?? []).filter((lot) => lot.symbol === symbol);
  if (lots.length === 0) return undefined;
  if (lots.some((lot) => lot.short)) return undefined;

  const wantQty = Math.abs(position.quantity);
  const gotQty = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  if (Math.abs(gotQty - wantQty) > 1e-6) return undefined;

  const lastday = position.lastdayPrice ?? 0;
  return lots.map((lot, index): PositionLot => {
    const value = lot.quantity * mark;
    const basis = lot.quantity * lot.price;
    const dayBase = lastday > 0 ? lastday * lot.quantity : basis;
    const day = value - dayBase;
    const total = value - basis;
    return {
      lotId: `${symbol}-${index}-${lot.at}`,
      openedAt: formatTimestamp(lot.at),
      quantity: lot.quantity.toLocaleString("en-US"),
      costPerShare: formatPrice(lot.price),
      price: formatPrice(mark),
      costBasis: formatCurrency(basis),
      value: formatCurrency(value),
      dayPl: formatSigned(day),
      dayTone: plClass(day),
      totalPl: formatSigned(total),
      returnPct: basis > 0 ? pct((total / basis) * 100) : "—",
      totalTone: plClass(total),
    };
  });
}

interface DeskTiles {
  readonly openPositions: number;
  readonly invested: string;
  /** Raw twin of `invested`, for cross-account summing (#2321) — never for display. */
  readonly investedRaw: number;
  readonly dayPl: string;
  readonly dayTone: Tone;
  /** Raw twin of `dayPl`. */
  readonly dayPlRaw: number;
  readonly unrealized: string;
  readonly unrealizedNote: string;
  readonly unrealizedTone: Tone;
  /** Raw twin of `unrealized`. */
  readonly unrealizedRaw: number;
  readonly cash: string;
  /** Raw twin of `cash`. */
  readonly cashRaw: number;
}

export interface DeskView {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly error?: string;
  readonly tiles: DeskTiles;
  readonly positions: readonly DeskPositionView[];
  readonly considerations: readonly ConsiderationChip[];
}

export function deskView(
  snapshot: ParticipantSnapshot,
  ledger?: RoundTripLedger,
  playbooks: readonly PlaybookStoreEntry[] = [],
): DeskView {
  const invested = participantInvested(snapshot);
  const unrealized = participantUnrealized(snapshot);
  const returnOnCost = invested > 0 ? (unrealized / invested) * 100 : 0;
  const dayTotal = snapshot.positions.reduce((sum, p) => sum + dayPl(p).amount, 0);
  const forConsiderations: PositionForConsiderations[] = [];
  const positions = [...snapshot.positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((position): DeskPositionView => {
      const pl = unrealizedPl(position);
      const basis = costBasis(position);
      const day = dayPl(position);
      const mark = position.quantity !== 0 ? position.marketValue / position.quantity : 0;
      const option = isOccSymbol(position.symbol);
      const lots = lotsFor(position.symbol, ledger?.open, position, mark);
      const display = humanizeOptionSymbol(position.symbol);
      forConsiderations.push({
        symbol: position.symbol,
        display,
        marketValue: position.marketValue,
        totalPl: pl,
        returnPct: basis > 0 ? (pl / basis) * 100 : null,
      });
      return {
        symbol: position.symbol,
        display,
        // Stock positions get no detail line — "common shares" was a static label that never
        // varied by position and told the reader nothing the Qty column doesn't already show.
        // Options keep their contract count: it's the one place `isOption` positions read as
        // options rather than a plain symbol before you reach the Qty column.
        detail: option ? `${Math.abs(position.quantity)} ct` : "",
        isOption: option,
        quantity: position.quantity.toLocaleString("en-US"),
        costPerShare: formatPrice(position.avgPrice),
        price: formatPrice(mark),
        // Whole dollars for TOTAL-dollar figures (#3186 slice 1) — costPerShare/price above stay
        // per-unit precision since an option premium can be sub-$1 and rounding it away loses the
        // number entirely; costBasis is a total, same as value/dayPl/totalPl below.
        costBasis: formatCurrency(basis),
        value: formatCurrency(position.marketValue),
        dayPl: formatSigned(day.amount),
        dayPct: day.pct === null ? "—" : pct(day.pct),
        dayTone: plClass(day.amount),
        totalPl: formatSigned(pl),
        totalPlRaw: pl,
        returnPct: basis > 0 ? pct((pl / basis) * 100) : "—",
        totalTone: plClass(pl),
        weightPct: invested > 0 ? (Math.max(0, position.marketValue) / invested) * 100 : 0,
        ...(lots ? { lots } : {}),
      };
    });
  return {
    id: snapshot.id,
    name: snapshot.displayName,
    kind: snapshot.kind === "bot" ? "bot" : "human",
    ...(snapshot.error ? { error: snapshot.error } : {}),
    considerations: considerationsFor(forConsiderations, playbooks),
    tiles: {
      openPositions: snapshot.positions.length,
      invested: formatCurrency(invested),
      investedRaw: invested,
      dayPl: formatSigned(dayTotal),
      dayTone: plClass(dayTotal),
      dayPlRaw: dayTotal,
      unrealized: formatSigned(unrealized),
      unrealizedNote: `${pct(returnOnCost)} on cost`,
      unrealizedTone: plClass(unrealized),
      unrealizedRaw: unrealized,
      cash: formatCurrency(snapshot.cash),
      cashRaw: snapshot.cash,
    },
    positions,
  };
}

/** One fill/order event on a desk's timeline, formatted. Two independent honesty fields ride
 *  along: `backfilled` says the row was recovered rather than watched landing, and `origin` says
 *  who placed it (`order-origin.ts`) — knowledge and authorship are different questions. */
export interface DeskActivityEvent {
  readonly orderId: string;
  readonly symbol: string;
  readonly display: string;
  readonly side: "buy" | "sell";
  readonly quantity: number;
  readonly filled: number;
  readonly price: string;
  readonly status: string;
  readonly at: string;
  readonly backfilled: boolean;
  readonly origin: OrderOrigin;
  /** Realized P/L on a closing fill — absent on opening fills and fills that didn't close a lot. */
  readonly realizedPl?: string;
  /** Return percentage on a closing fill — absent on opening fills. */
  readonly returnPct?: string;
  /** Tone for the realized P/L — `pos`/`neg`/`flat`, absent when no P/L. */
  readonly realizedTone?: Tone;
}

export interface DeskActivityPage {
  readonly activity: DeskActivityEvent[];
  /** ISO timestamp of the oldest row on this page — pass back as `before` for the next page.
   *  Absent means this page wasn't full, so there's nothing further back to fetch. */
  readonly nextCursor?: string;
}

/** The desk's recent activity as data (`/api/desk/:id/activity`): journal lines collapsed to the
 *  latest state per order (the store's own fold), newest first, keyset-paginated (PR 5). Without
 *  an origin index every row reads `unknown` — the honest default when no audit evidence was
 *  handed in. `realizedByOrder` carries the per-order realized P/L the round-trip matcher computed
 *  from the full ledger — attached to closing fills so the activity table shows what each close
 *  earned, absent on opens. */
export function deskActivityView(
  records: readonly TradeActivityRecord[],
  origins: OrderOriginIndex = NO_ORIGIN_EVIDENCE,
  opts: {
    readonly limit?: number;
    readonly before?: string;
    readonly realizedByOrder?: ReadonlyMap<
      string,
      { readonly realized: number; readonly returnPct: number }
    >;
  } = {},
): DeskActivityPage {
  const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
  const { items, nextCursor } = paginateDesc(
    collapseActivity(records).sort((a, b) => (a.at < b.at ? 1 : -1)),
    (record) => record.at,
    { limit, ...(opts.before !== undefined ? { before: opts.before } : {}) },
  );
  const activity = items.map((record) => {
    const pl = opts.realizedByOrder?.get(record.orderId);
    return {
      orderId: record.orderId,
      symbol: record.symbol,
      display: humanizeOptionSymbol(record.symbol),
      side: record.side,
      quantity: record.quantity,
      filled: record.filledQuantity,
      price: record.price === undefined ? "—" : formatPrice(record.price),
      status: record.status,
      at: record.at,
      backfilled: record.source === "backfill",
      origin: orderOrigin(record, origins),
      ...(pl
        ? {
            realizedPl: formatSigned(pl.realized),
            returnPct: pct(pl.returnPct),
            realizedTone: plClass(pl.realized) as Tone,
          }
        : {}),
    };
  });
  return { activity, ...(nextCursor !== undefined ? { nextCursor } : {}) };
}
