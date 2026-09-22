import type { Side } from "../domain/types.js";
import { matchRoundTrips, type TradeFill } from "../trading/round-trips.js";

/**
 * The retrospective writer (#2287 PR 7) — turns closed positions into `retrospectives` rows,
 * triggered off the fill event itself (Eric's call: "transactions happening inside skynet — we
 * can trigger the action to call", not a periodic reconciliation pass). Pure and DB-free so it is
 * unit-testable without SQLite; `decision-db.ts` is the only caller, feeding it every FILLED
 * intent it has ever recorded for one (persona, symbol) and writing back whatever this returns.
 *
 * Reuses `matchRoundTrips` (`trading/round-trips.ts`) rather than a second FIFO engine — the same
 * lot-matching a member's own P/L ledger uses, so a bot's realized dollars are computed identically
 * to a human's and reconcile with the broker the same way theirs does.
 */

/** One filled intent, exactly what `decision-db.ts` can read back from its own tables — the
 *  narrow shape this module needs, independent of `StoredIntentRow`'s full shape. */
export interface FilledIntentRow {
  readonly intentId: number;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Side;
  readonly quantity: number;
  /** Undefined when the broker never confirmed a price (a fill recorded before #2386's poll, or
   *  one where the poll never resolved) — `matchRoundTrips` excludes it honestly rather than
   *  inventing a $0 fill, same invariant the dashboard's own P/L ledger already relies on. */
  readonly price?: number;
  /** The decision cycle's epoch-ms timestamp — `DecisionRecord.at`. */
  readonly at: number;
  readonly reason: string;
  readonly momentum?: number;
  readonly sentiment?: number;
}

/** One retrospective row ready to insert — column-shaped so `decision-db.ts` can bind it directly. */
export interface RetrospectiveInsert {
  readonly at: number;
  readonly symbol: string;
  readonly entryIntentId: number;
  readonly exitReason: string | null;
  readonly realized: number;
  readonly returnPct: number;
  readonly sentimentDelta: number | null;
  readonly momentumDelta: number | null;
}

function toFill(row: FilledIntentRow): TradeFill {
  return {
    symbol: row.symbol,
    side: row.side,
    quantity: row.quantity,
    price: row.price,
    at: new Date(row.at).toISOString(),
    orderId: row.orderId,
    entryIntentId: row.intentId,
  };
}

function delta(exit: number | undefined, entry: number | undefined): number | null {
  return exit !== undefined && entry !== undefined ? exit - entry : null;
}

/**
 * FIFO-matches every filled intent for one (persona, symbol) and returns the retrospective rows
 * for trips that closed, EXCLUDING any already recorded. `alreadyRecorded` is the
 * `(entryIntentId, at)` pairs a caller has already written — the natural dedup key, since closing
 * the SAME entry lot twice at the SAME decision timestamp cannot happen (one decision cycle
 * produces at most one closing fill per symbol per persona).
 */
export function pendingRetrospectives(
  rows: readonly FilledIntentRow[],
  alreadyRecorded: ReadonlySet<string>,
): RetrospectiveInsert[] {
  const byIntentId = new Map(rows.map((r) => [r.intentId, r] as const));
  const byOrderId = new Map(rows.map((r) => [r.orderId, r] as const));
  const ledger = matchRoundTrips(rows.map(toFill));

  const inserts: RetrospectiveInsert[] = [];
  for (const trip of ledger.trips) {
    if (trip.entryIntentId === undefined) continue; // no entry to attribute — never fabricate one
    const closedAtMs = new Date(trip.closedAt).getTime();
    const key = `${trip.entryIntentId}:${closedAtMs}`;
    if (alreadyRecorded.has(key)) continue;

    const entryRow = byIntentId.get(trip.entryIntentId);
    const exitRow = trip.orderId ? byOrderId.get(trip.orderId) : undefined;
    inserts.push({
      at: closedAtMs,
      symbol: trip.symbol,
      entryIntentId: trip.entryIntentId,
      exitReason: exitRow?.reason ?? null,
      realized: trip.realized,
      returnPct: trip.returnPct,
      sentimentDelta: delta(exitRow?.sentiment, entryRow?.sentiment),
      momentumDelta: delta(exitRow?.momentum, entryRow?.momentum),
    });
  }
  return inserts;
}
