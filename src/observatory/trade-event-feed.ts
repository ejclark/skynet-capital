import {
  type ActivityEvent,
  activityEventFromTradeRecord,
  forVisibility,
} from "./activity-event.js";
import type { TradeActivityRecord } from "./activity-record.js";

/**
 * TRADE EVENTS → FEED FACTS — the read half of #1211's envelope, and the first thing a member-facing
 * list is built from (#784 slice 1). `activity-event.ts` owns the write direction (a ledger line
 * becomes an `ActivityEvent`); this file owns the inverse: given events, what did a trade actually
 * do? That split is why Activity can later put feedback, milestones and deploys on the same list —
 * the list consumes envelopes, and each kind brings its own decoder, instead of the page re-joining
 * four ledgers by hand the way `wire-data.ts` used to.
 *
 * Two facts about the envelope shape this decoder has to live with:
 *
 * - **`payload` is `Record<string, unknown>` by design**, so every field is narrowed here rather
 *   than asserted. A line that cannot honestly yield a symbol, a side and a fill count is dropped,
 *   never defaulted — a feed row invented from a half-read payload would imply a trade that did not
 *   happen, which outranks showing more rows.
 * - **An order appears on several lines** as it progresses (new → partially_filled → filled), the
 *   same append-only journal `collapseActivity` folds. `collapseTradeEvents` is that same fold,
 *   keyed on the envelope's `correlationId` (the order) instead of the record's `orderId`, with the
 *   identical most-progressed-fill-wins rule, so the folded output matches line for line.
 */

/** The fill-bearing event types `activity-event.ts` emits for a trade. `order.submitted` is NOT
 *  one: it carries no fill, and its `owner-only` tier means it was never on the public feed. */
const TRADE_FILL_EVENT_TYPES: ReadonlySet<string> = new Set(["order.filled", "order.updated"]);

/** The cross-member feed is a public surface, so it reads only the public tier — the same
 *  `forVisibility` gate `desk-events-route.ts` applies to an owner's own stream. Belt and braces
 *  beside the event-type filter: both say "no submission lines", for two different reasons. */
const PUBLIC_ONLY = forVisibility(["public"]);

/** What one trade event says a fill did — the fields a feed row needs, decoded out of the envelope
 *  so no consumer narrows `payload` twice. `source` is kept raw (the envelope widens it past
 *  `ActivitySource` for non-trade emitters); the view decides what provenance to badge. */
export interface TradeEventFill {
  readonly orderId: string;
  readonly participantId: string;
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly filledQuantity: number;
  readonly price?: number;
  readonly at: string;
  readonly source: string;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * One event → one fill, or null when the event is not a public trade fill or its payload cannot
 * honestly yield one. Null is the common, expected answer on a mixed feed — a submission line, a
 * future feedback line, an owner-only tier — not an error.
 */
export function tradeFillFromEvent(event: ActivityEvent): TradeEventFill | null {
  if (!(TRADE_FILL_EVENT_TYPES.has(event.eventType) && PUBLIC_ONLY(event))) return null;
  const { symbol, side, filledQuantity, price } = event.payload;
  if (typeof symbol !== "string" || !symbol) return null;
  if (side !== "buy" && side !== "sell") return null;
  const filled = asFiniteNumber(filledQuantity);
  if (filled === undefined) return null;
  const parsedPrice = asFiniteNumber(price);
  return {
    orderId: event.correlationId,
    participantId: event.actor.participantId,
    symbol,
    side,
    filledQuantity: filled,
    ...(parsedPrice !== undefined ? { price: parsedPrice } : {}),
    at: event.at,
    source: event.source,
  };
}

/**
 * Fold a mixed event list into the latest known fill per order, newest first — `collapseActivity`'s
 * rule applied to envelopes: the most progressed fill wins, a later `at` breaks a tie, and a later
 * line in the input breaks what remains (so a backfilled event never regresses a live-captured
 * one). Non-trade and unparseable events are dropped by `tradeFillFromEvent`, so a caller can hand
 * this the whole bus.
 */
export function collapseTradeEvents(events: readonly ActivityEvent[]): TradeEventFill[] {
  const byOrder = new Map<string, TradeEventFill>();
  for (const event of events) {
    const fill = tradeFillFromEvent(event);
    if (!fill) continue;
    const held = byOrder.get(fill.orderId);
    if (
      !held ||
      fill.filledQuantity > held.filledQuantity ||
      (fill.filledQuantity === held.filledQuantity && fill.at >= held.at)
    ) {
      byOrder.set(fill.orderId, fill);
    }
  }
  return [...byOrder.values()].sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * THE BRIDGE WHILE THE BUS IS YOUNGER THAN THE LEDGER. The event log only starts at #1211's deploy;
 * every fill the desk booked before that lives on the durable trade ledger and nowhere else. So the
 * feed's source is the bus UNIONED with the ledger translated into the same envelope — reading the
 * bus alone would silently drop real history, which is the one thing a trade feed may never do.
 *
 * The union cannot double-count: `activityEventFromTradeRecord` derives `ActivityEvent.id`
 * deterministically from the record, so a record already published arrives with byte-identical
 * identity and is deduplicated on it. `events` (the bus) is emitted first and the translated ledger
 * second, so `collapseTradeEvents`'s later-line-wins tie-break resolves exactly as it did when the
 * ledger was the only input.
 *
 * This is deliberately the read-time twin of `scripts/backfill-activity-events.ts` — the same
 * translator, the same id-based skip — so the feed shows the same rows whether or not that one-time
 * CLI was ever run against the production volume. Which is why the union, and not "just run the
 * backfill": the backfill is an operator step on one machine that no reader can verify from here,
 * and the cost of assuming it ran is a real fill missing from the record. The leg retires when the
 * bus is confirmed to hold the ledger's full history, not before.
 */
export function mergeLedgerIntoEvents(
  events: readonly ActivityEvent[],
  records: readonly TradeActivityRecord[],
): ActivityEvent[] {
  const merged = [...events];
  const seen = new Set(events.map((e) => e.id));
  for (const record of records) {
    const event = activityEventFromTradeRecord(record);
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(event);
  }
  return merged;
}
