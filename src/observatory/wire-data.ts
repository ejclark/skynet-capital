import { paginateDesc } from "../server/pagination.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { ActivityEvent } from "./activity-event.js";
import type { OptionFillCost } from "./option-fill-cost.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { type ActivityItem, foldSpreadLegs, type SpreadOf } from "./spread-activity.js";
import { collapseTradeEvents, type TradeEventFill } from "./trade-event-feed.js";

/**
 * THE WIRE's data assembly — pure joins over data every other view already reads, kept out of
 * wire-view.ts so the merge/sort logic stays testable with no HTML in the loop (same split as
 * desk-data.ts / research-service.ts).
 *
 * Nothing here reads a store directly: wire-routes.ts hands in the events and whatever
 * `hub.getState()` already returned, so a fresh view over existing ledgers costs no new durable
 * state.
 *
 * The trade feed is built from `ActivityEvent`s, not from `TradeActivityRecord`s (#784 slice 1).
 * Activity's whole point is to be one funnel for everything the league does — trades, feedback,
 * milestones, deploys — so its rows are assembled from the shared envelope #1211 built, and each
 * kind brings its own decoder (`trade-event-feed.ts`). The old shape read one ledger directly,
 * which is exactly why feedback and milestones needed widgets of their own beside it.
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
  /** The broker's own order id — deliberately widened onto this row (PR 6, issue #2287; it used to
   *  be dropped here even though `TradeActivityRecord` always carries it) so the wire route can
   *  join a trade to the `DecisionRecord` that produced it via `DecisionDb.findByOrderId`'s exact
   *  index, rather than `decision-context.ts`'s fuzzy symbol+side+time match. */
  readonly orderId: string;
  /** A bot's spread, folded from the fills its legs reported (#4650): the spread in words, and its
   *  net cash once — read off the decision's own fill, absent while that is unconfirmed. On such a
   *  row `symbol` is the broker's own for a multi-leg order, none (`""`), `quantity` counts whole
   *  spreads and `price` is the net per share. Absent on every other row. */
  readonly spread?: { readonly display: string; readonly net?: OptionFillCost };
}

type WireFill = TradeEventFill & { readonly spread?: WireTradeRow["spread"] };

/** A spread whose every placed leg is in the feed, as one fill — or undefined while one is missing
 *  (or no whole spread has filled): one leg's numbers are never the spread's. */
function wholeSpread(item: Extract<ActivityItem<TradeEventFill>, { kind: "spread" }>) {
  const { spread, legs } = item;
  const quantity = Math.min(
    ...legs.map((leg) => Math.floor(leg.record.filledQuantity / leg.ratio)),
  );
  const allIn = spread.placedLegs.every((placed) =>
    legs.some((leg) => leg.record.symbol === placed.occSymbol),
  );
  const first = legs[0]?.record;
  if (!(allIn && first && quantity > 0)) return undefined;
  const recovered = legs.find((leg) => leg.record.source !== "stream")?.record.source;
  return {
    orderId: spread.orderId,
    participantId: first.participantId,
    symbol: "",
    side: spread.side,
    filledQuantity: quantity,
    ...(spread.net ? { price: spread.net.perShare } : {}),
    at: item.at,
    source: recovered ?? "stream",
    spread: { display: spread.display, ...(spread.net ? { net: spread.net } : {}) },
  } satisfies WireFill;
}

/** A bot's spread reaches the feed as one fill per leg, each under its leg's own order id — the
 *  same fold the account's Activity runs (`foldSpreadLegs`), so the row carries the spread's order
 *  id and its why joins. A spread still missing a leg stays as the contract fills it has: each is
 *  true, and only the whole spread's numbers are the spread's. Newest first, as handed in. */
function foldWireSpreads(fills: readonly TradeEventFill[], spreadOf?: SpreadOf): WireFill[] {
  if (!spreadOf) return [...fills];
  return foldSpreadLegs(fills, spreadOf)
    .flatMap((item): WireFill[] => {
      if (item.kind === "order") return [item.record];
      const whole = wholeSpread(item);
      return whole ? [whole] : item.legs.map((leg) => leg.record);
    })
    .sort((a, b) => b.at.localeCompare(a.at));
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

/** Collapse the event feed to one row per order, join in each order's participant, newest first,
 *  keyset-paginated (PR 5, issue #2287 — replaces the old bare `limit` cap). Unfilled/cancelled
 *  orders carry no honest side to show, so they're dropped (same rule as fillsFrom in
 *  desk-data.ts); `collapseTradeEvents` drops anything that isn't a public trade fill, so this may
 *  be handed the whole bus.
 *
 * `underlyingFilter`, when given, narrows to fills on that underlying (stock or option) BEFORE
 * pagination — #2017 Phase 1 slice 12. The unfiltered Wire's page bound is an unrelated window;
 * filtering after paginating would let it silently drop a symbol's own older fill, so the filter
 * always runs first. Omitted, behavior is byte-identical to the plain feed.
 *
 * `spreadOf` (the decision store's leg map) folds a bot's spread legs into one row, after that
 * filter and BEFORE pagination for the same reason: a spread is never split across two pages. */
export function buildWireTradeRows(
  events: readonly ActivityEvent[],
  participants: readonly ParticipantSnapshot[],
  opts: { readonly limit: number; readonly before?: string; readonly spreadOf?: SpreadOf },
  underlyingFilter?: string,
): WireTradeRowsPage {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const collapsed = collapseTradeEvents(events).filter((r) => r.filledQuantity > 0);
  const scoped = underlyingFilter
    ? collapsed.filter((r) => matchesUnderlying(r.symbol, underlyingFilter))
    : collapsed;
  const folded = foldWireSpreads(scoped, opts.spreadOf);
  const { items, nextCursor } = paginateDesc(folded, (r) => r.at, {
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
      orderId: r.orderId,
      ...(r.spread ? { spread: r.spread } : {}),
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
