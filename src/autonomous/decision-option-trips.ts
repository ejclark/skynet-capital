import type { Side } from "../domain/types.js";
import {
  LIFECYCLE_STATUS,
  lifecycleClosingFill,
  type OptionLifecycleType,
} from "../trading/option-lifecycle.js";
import { OPTION_MULTIPLIER } from "../trading/option-symbols.js";
import { matchRoundTrips, type RoundTrip, type TradeFill } from "../trading/round-trips.js";
import type { RetrospectiveInsert } from "./decision-retrospectives.js";

/**
 * A bot's OPTION round trips (#4642 slice 8), for the same `retrospectives` table its share trips
 * fill — so `realizedPlForPlaybook`, and the compounding budget built on it, see what an option
 * play made. Before this, option fills were kept out of the share ledger (a contract is never a
 * share lot) and scored nowhere: the CRWV wheel's premium read $0 however many puts expired.
 *
 * PURE and DB-free, like `decision-retrospectives.ts`. The matching is the member ledger's own
 * FIFO (`matchRoundTrips`), per contract: a sell with nothing open writes a contract (a short lot),
 * and the broker's expiry or assignment report closes it at $0 (`lifecycleClosingFill`), so a put
 * sold for $205 that expires worthless scores +$205.
 *
 * ONE ORDER, ONE TRADE. A spread's legs are separate contracts, so the FIFO pairs each leg on its
 * own; the legs that one order opened and one event closed are then summed back into a single
 * retrospective. Two per-leg rows would put a +37% long call and a −66% short call into the
 * expectancy as two trades when the spread made +22% as one ($75 on $335 paid, the spec's case).
 * The spread's return is measured against its net premium — the debit paid, or the credit
 * received — matching how a single short contract is measured against its premium.
 *
 * What it does not score, said plainly: the 100 shares an assignment delivers. That share trade
 * (`OPTRD`) is not confirmed against a live account (`option-lifecycle.ts`), so the wheel's share
 * leg after assignment is outside this ledger, the same as on a member's. Nor an exercise: a long
 * contract that became shares transferred its value rather than losing it, so it stays open here
 * instead of reading as a total loss.
 */

/** One leg's fill of one filled option intent, as the store reads it back. */
export interface OptionLegFillRow {
  readonly intentId: number;
  readonly orderId: string;
  readonly occSymbol: string;
  readonly side: Side;
  /** Contracts this leg filled — the order's filled quantity times the leg's ratio. */
  readonly quantity: number;
  /** Per share, as the broker reported it; absent when it never confirmed one. */
  readonly price?: number;
  /** The decision cycle's epoch ms. */
  readonly at: number;
  readonly reason: string;
  readonly momentum?: number;
  readonly sentiment?: number;
}

/** An expiry or assignment the broker reported for one contract (`option_lifecycle`). */
export interface OptionLifecycleRow {
  readonly type: OptionLifecycleType;
  readonly occSymbol: string;
  readonly quantity: number;
  /** Epoch ms — the end of the expiry day when the broker gave only a date. */
  readonly at: number;
}

/** The closing "order id" a lifecycle close carries through the matcher, so the legs one expiry
 *  or one assignment ended group together, and the trip can say which event ended it. */
const LIFECYCLE_CLOSE = "lifecycle:";

/** The dedup key for one option retrospective. The symbol is part of it because two legs of one
 *  order can end at the same instant by different events (one expires, one is assigned). */
export function optionRetrospectiveKey(entryIntentId: number, at: number, symbol: string): string {
  return `${entryIntentId}:${at}:${symbol}`;
}

/** Every leg of an intent, or none: a spread with one unpriced leg would score as half a trade. */
function pricedLegs(rows: readonly OptionLegFillRow[]): OptionLegFillRow[] {
  const unpriced = new Set(rows.filter((r) => r.price === undefined).map((r) => r.intentId));
  return rows.filter((r) => !unpriced.has(r.intentId));
}

function legFill(row: OptionLegFillRow): TradeFill {
  return {
    symbol: row.occSymbol,
    side: row.side,
    quantity: row.quantity,
    // Per share → per contract, as the matcher's dollars must be.
    price: row.price === undefined ? undefined : row.price * OPTION_MULTIPLIER,
    at: new Date(row.at).toISOString(),
    orderId: row.orderId,
    entryIntentId: row.intentId,
  };
}

function lifecycleFill(row: OptionLifecycleRow): TradeFill | undefined {
  const close = lifecycleClosingFill({
    id: "",
    type: row.type,
    symbol: row.occSymbol,
    quantity: row.quantity,
    at: new Date(row.at).toISOString(),
  });
  return close ? { ...close, orderId: `${LIFECYCLE_CLOSE}${row.type}` } : undefined;
}

/** What one order's legs, closed by one event, add up to. */
function merged(trips: readonly RoundTrip[]): { realized: number; returnPct: number } {
  const realized = trips.reduce((sum, t) => sum + t.realized, 0);
  // Paid for a long leg, received for a written one: the net is the spread's premium.
  const premium = Math.abs(
    trips.reduce((sum, t) => sum + (t.short ? -1 : 1) * t.entryPrice * t.quantity, 0),
  );
  return {
    // Cents: a per-share price ×100 carries a float's tail ($2.05 → 204.99999999999997).
    realized: Math.round(realized * 100) / 100,
    returnPct: premium > 0 ? (realized / premium) * 100 : 0,
  };
}

function delta(exit: number | undefined, entry: number | undefined): number | null {
  return exit !== undefined && entry !== undefined ? exit - entry : null;
}

/**
 * Every option round trip one (persona, underlying) has closed, one per order and closing event,
 * EXCLUDING those already recorded (`optionRetrospectiveKey`). Deterministic over the same rows,
 * so a caller may recompute after every fill or lifecycle report.
 */
export function optionRetrospectives(
  legs: readonly OptionLegFillRow[],
  lifecycle: readonly OptionLifecycleRow[],
  alreadyRecorded: ReadonlySet<string>,
): RetrospectiveInsert[] {
  const priced = pricedLegs(legs);
  const byIntent = new Map(priced.map((r) => [r.intentId, r] as const));
  const byOrder = new Map(priced.map((r) => [r.orderId, r] as const));
  const fills = [...priced.map(legFill), ...lifecycle.flatMap((row) => lifecycleFill(row) ?? [])];

  const groups = new Map<string, RoundTrip[]>();
  for (const trip of matchRoundTrips(fills).trips) {
    if (trip.entryIntentId === undefined) continue; // nothing to attribute it to
    const key = `${trip.entryIntentId}|${trip.closedAt}|${trip.orderId ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), trip]);
  }

  const inserts: RetrospectiveInsert[] = [];
  for (const trips of groups.values()) {
    const [first] = trips as [RoundTrip, ...RoundTrip[]];
    const entryIntentId = first.entryIntentId as number;
    const at = new Date(first.closedAt).getTime();
    // Sorted, so a recompute keys a spread the same way whatever order its legs were read in.
    const symbol = [...new Set(trips.map((t) => t.symbol))].sort().join("/");
    if (alreadyRecorded.has(optionRetrospectiveKey(entryIntentId, at, symbol))) continue;
    const closing = first.orderId ?? "";
    const lifecycleType = closing.startsWith(LIFECYCLE_CLOSE)
      ? (closing.slice(LIFECYCLE_CLOSE.length) as OptionLifecycleType)
      : undefined;
    const entry = byIntent.get(entryIntentId);
    const exit = lifecycleType ? undefined : byOrder.get(closing);
    inserts.push({
      at,
      symbol,
      entryIntentId,
      exitReason: lifecycleType ? LIFECYCLE_STATUS[lifecycleType] : (exit?.reason ?? null),
      ...merged(trips),
      sentimentDelta: delta(exit?.sentiment, entry?.sentiment),
      momentumDelta: delta(exit?.momentum, entry?.momentum),
    });
  }
  return inserts;
}
