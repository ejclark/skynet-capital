import { humanizeOptionSymbol, isOccSymbol } from "../trading/option-symbols.js";
import type { TradeActivityRecord } from "./activity-record.js";
import { collapseActivity } from "./activity-store.js";
import { formatPrice } from "./desk-data.js";
import { participantInvested, participantUnrealized } from "./participant-card.js";
import {
  costBasis,
  dayPl,
  type ParticipantSnapshot,
  unrealizedPl,
} from "./participant-snapshot.js";
import { formatCurrency, formatSigned, pct, plClass } from "./render-atoms.js";

/**
 * THE DESK AS DATA — the JSON view `/api/desk/:id` serves the React shell (#738 phase 2c).
 *
 * The same numbers the server-rendered blotter shows (`positions-view.ts`), formatted by the same
 * helpers, so the two renderers can never disagree about a figure. Raw numerics ride alongside the
 * formatted strings only where the client needs them for FILTERING (`pl:>0`, `is:option`) — never
 * for re-deriving a display value.
 */

type Tone = "pos" | "neg" | "flat";

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
}

interface DeskTiles {
  readonly openPositions: number;
  readonly invested: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly unrealized: string;
  readonly unrealizedNote: string;
  readonly unrealizedTone: Tone;
  readonly cash: string;
}

export interface DeskView {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly error?: string;
  readonly tiles: DeskTiles;
  readonly positions: readonly DeskPositionView[];
}

export function deskView(snapshot: ParticipantSnapshot): DeskView {
  const invested = participantInvested(snapshot);
  const unrealized = participantUnrealized(snapshot);
  const returnOnCost = invested > 0 ? (unrealized / invested) * 100 : 0;
  const dayTotal = snapshot.positions.reduce((sum, p) => sum + dayPl(p).amount, 0);
  const positions = [...snapshot.positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((position): DeskPositionView => {
      const pl = unrealizedPl(position);
      const basis = costBasis(position);
      const day = dayPl(position);
      const mark = position.quantity !== 0 ? position.marketValue / position.quantity : 0;
      const option = isOccSymbol(position.symbol);
      return {
        symbol: position.symbol,
        display: humanizeOptionSymbol(position.symbol),
        detail: option ? `${Math.abs(position.quantity)} ct` : "common shares",
        isOption: option,
        quantity: position.quantity.toLocaleString("en-US"),
        costPerShare: formatPrice(position.avgPrice),
        price: formatPrice(mark),
        costBasis: formatPrice(basis),
        value: formatCurrency(position.marketValue),
        dayPl: formatSigned(day.amount),
        dayPct: day.pct === null ? "—" : pct(day.pct),
        dayTone: plClass(day.amount),
        totalPl: formatSigned(pl),
        totalPlRaw: pl,
        returnPct: basis > 0 ? pct((pl / basis) * 100) : "—",
        totalTone: plClass(pl),
        weightPct: invested > 0 ? (Math.max(0, position.marketValue) / invested) * 100 : 0,
      };
    });
  return {
    id: snapshot.id,
    name: snapshot.displayName,
    kind: snapshot.kind === "bot" ? "bot" : "human",
    ...(snapshot.error ? { error: snapshot.error } : {}),
    tiles: {
      openPositions: snapshot.positions.length,
      invested: formatCurrency(invested),
      dayPl: formatSigned(dayTotal),
      dayTone: plClass(dayTotal),
      unrealized: formatSigned(unrealized),
      unrealizedNote: `${pct(returnOnCost)} on cost`,
      unrealizedTone: plClass(unrealized),
      cash: formatCurrency(snapshot.cash),
    },
    positions,
  };
}

/** One fill/order event on a desk's timeline, formatted. `backfilled` keeps provenance honest —
 *  the record never implies we watched a trade land when we actually recovered it later. */
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
}

const ACTIVITY_CAP = 80;

/** The desk's recent activity as data (`/api/desk/:id/activity`): journal lines collapsed to the
 *  latest state per order (the store's own fold), newest first, capped. */
export function deskActivityView(records: readonly TradeActivityRecord[]): DeskActivityEvent[] {
  return collapseActivity(records)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, ACTIVITY_CAP)
    .map((record) => ({
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
    }));
}
