import { paginateDesc } from "../server/pagination.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import { collapseActivity, type TradeActivityRecord } from "./activity-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * THE WIRE's data assembly — pure joins over data every other view already reads, kept out of
 * wire-view.ts so the merge/sort logic stays testable with no HTML in the loop (same split as
 * desk-data.ts / research-service.ts).
 *
 * Nothing here reads a store directly: wire-routes.ts hands in whatever `readAllTradeActivity`
 * and `hub.getState()` already returned, so a fresh view over existing ledgers costs no new
 * durable state.
 */

export interface WireTradeRow {
  readonly participantId: string;
  readonly participantName: string;
  readonly kind: ParticipantSnapshot["kind"];
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly quantity: number;
  readonly price?: number;
  readonly at: string;
  /** True for a row recovered after the fact (backfill/broker-window) rather than captured live —
   *  same provenance activity-store.ts already tracks, surfaced so the wire never implies a trade
   *  was watched landing when it was actually reconstructed. */
  readonly reconstructed: boolean;
}

/** True when a raw broker order symbol names a fill in `underlying` — a plain stock symbol
 *  matches itself, and an OCC option-contract string (`NVDA261016C00185000`) matches when its
 *  parsed `.underlying` does. A naive `record.symbol === underlying` would silently miss every
 *  option fill on that name (`src/trading/option-symbols.ts`'s `parseOccSymbol`). */
function matchesUnderlying(recordSymbol: string, underlying: string): boolean {
  if (recordSymbol === underlying) return true;
  return parseOccSymbol(recordSymbol)?.underlying === underlying;
}

export interface WireTradeRowsPage {
  readonly rows: WireTradeRow[];
  /** ISO timestamp of the oldest row on this page — pass back as `before` for the next page.
   *  Absent means this page wasn't full, so there's nothing further back to fetch. */
  readonly nextCursor?: string;
}

/** Collapse the durable ledger to one row per order, join in each order's participant, newest
 *  first, keyset-paginated (PR 5, issue #2287 — replaces the old bare `limit` cap). Unfilled/
 *  cancelled orders carry no honest side to show, so they're dropped (same rule as fillsFrom in
 *  desk-data.ts).
 *
 * `underlyingFilter`, when given, narrows to fills on that underlying (stock or option) BEFORE
 * pagination — #2017 Phase 1 slice 12. The unfiltered Wire's page bound is an unrelated window;
 * filtering after paginating would let it silently drop a symbol's own older fill, so the filter
 * always runs first. Omitted, behavior is byte-identical to the plain feed. */
export function buildWireTradeRows(
  records: readonly TradeActivityRecord[],
  participants: readonly ParticipantSnapshot[],
  opts: { readonly limit: number; readonly before?: string },
  underlyingFilter?: string,
): WireTradeRowsPage {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const collapsed = collapseActivity(records).filter(
    (r) => r.filledQuantity > 0 && (r.side === "buy" || r.side === "sell"),
  );
  const scoped = underlyingFilter
    ? collapsed.filter((r) => matchesUnderlying(r.symbol, underlyingFilter))
    : collapsed;
  const { items, nextCursor } = paginateDesc(scoped, (r) => r.at, {
    limit: opts.limit,
    ...(opts.before !== undefined ? { before: opts.before } : {}),
  });
  const rows = items.map((r) => {
    const participant = byId.get(r.participantId);
    return {
      participantId: r.participantId,
      participantName: participant?.displayName ?? r.participantId,
      kind: participant?.kind ?? "human",
      symbol: r.symbol,
      side: r.side,
      quantity: r.filledQuantity,
      ...(r.price !== undefined ? { price: r.price } : {}),
      at: r.at,
      reconstructed: r.source !== "stream",
    };
  });
  return { rows, ...(nextCursor !== undefined ? { nextCursor } : {}) };
}

export interface WirePnlRow {
  readonly participantId: string;
  readonly participantName: string;
  readonly kind: ParticipantSnapshot["kind"];
  readonly realizedPl: number;
}

/** Booked P&L per participant, richest first. Only participants with a known `realizedPl` show —
 *  a pure Alpaca read with none yet is omitted rather than rendered as a misleading $0. */
export function buildWirePnlRows(participants: readonly ParticipantSnapshot[]): WirePnlRow[] {
  return participants
    .filter((p): p is ParticipantSnapshot & { realizedPl: number } => p.realizedPl !== undefined)
    .map((p) => ({
      participantId: p.id,
      participantName: p.displayName,
      kind: p.kind,
      realizedPl: p.realizedPl,
    }))
    .sort((a, b) => b.realizedPl - a.realizedPl);
}
