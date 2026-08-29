import { isOccSymbol } from "../trading/option-symbols.js";
import type { TicketContext } from "../trading/order-ticket.js";
import { matchRoundTrips, type RoundTripLedger, type TradeFill } from "../trading/round-trips.js";
import { escapeHtml } from "../ui/escape-html.js";
import {
  collapseActivity,
  recordsFromActivity,
  type TradeActivityRecord,
} from "./activity-store.js";
import { OPTION_MULTIPLIER } from "./broker-positions.js";
import type { ActivityView, ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * The adapter between the observatory's account snapshot and the pure trading layer. It exists so
 * `src/trading/*` stays free of any view type (fills in, trips out) and the views stay free of any
 * matching logic — the seam that lets the FIFO matcher be tested on fixtures with no broker shape
 * anywhere near it.
 */

/**
 * Only FILLED shares are trades. A submitted, cancelled, or rejected order is not history.
 *
 * Option fills arrive as a PER-SHARE premium against a contract count, so the premium is scaled to
 * per-contract dollars here — the same scaling `positionsFrom` applies to every per-share broker
 * price. Scaling the price rather than the quantity keeps `quantity` reading as contracts (what
 * the blotter says) while `realized`, `basis` and `returnPct` all come out in real dollars.
 * Without it a closed option trade reported 1/100th of its true P/L, and the positions tab and the
 * history tab contradicted each other about the same trade.
 */
function fillsFrom(activity: readonly ActivityView[] | undefined): TradeFill[] {
  return (activity ?? [])
    .filter((row) => row.filledQuantity > 0 && (row.side === "buy" || row.side === "sell"))
    .map((row) => {
      const scale = isOccSymbol(row.symbol) ? OPTION_MULTIPLIER : 1;
      return {
        symbol: row.symbol,
        side: row.side as "buy" | "sell",
        quantity: row.filledQuantity,
        ...(row.price !== undefined ? { price: row.price * scale } : {}),
        at: row.at,
      };
    });
}

/**
 * The one activity feed a desk view should read: the durable trade ledger merged with the broker's
 * recent-order window, folded to one row per order. With no durable records the broker window
 * passes through untouched (exactly the pre-ledger behavior), so a deployment without the
 * activity store loses nothing — it just stays bounded by the broker's window.
 */
function mergedDeskActivity(
  snapshot: ParticipantSnapshot,
  durable?: readonly TradeActivityRecord[],
): readonly ActivityView[] {
  if (!durable || durable.length === 0) return snapshot.activity ?? [];
  return collapseActivity([...durable, ...recordsFromActivity(snapshot.activity, snapshot.id)]);
}

/** A participant's closed-trade ledger — over the full durable record when one is supplied,
 *  else whatever fill window the snapshot holds. */
export function deskLedger(
  snapshot: ParticipantSnapshot,
  durable?: readonly TradeActivityRecord[],
): RoundTripLedger {
  return matchRoundTrips(fillsFrom(mergedDeskActivity(snapshot, durable)));
}

/** The account state an order ticket is reviewed against. */
export function ticketContext(
  snapshot: ParticipantSnapshot,
  options: { tradingEnabled: boolean; isSelf: boolean; marketOpen?: boolean },
): TicketContext {
  return {
    cash: snapshot.cash,
    positions: snapshot.positions,
    tradingEnabled: options.tradingEnabled,
    isSelf: options.isSelf,
    ...(options.marketOpen !== undefined ? { marketOpen: options.marketOpen } : {}),
  };
}

/**
 * A per-share price, to the cent. Deliberately NOT the house `formatCurrency`, which rounds to
 * whole dollars: rounding is right for an equity total and wrong for a fill price — "$32" for a
 * $31.50 entry is a number the trader can't reconcile against their broker statement.
 */
export function formatPrice(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * A ratio rendered to two decimals, or an em-dash when the stat is unmeasurable. The rendering half
 * of the "null is not zero" invariant: a stat with no data must never reach the screen as `0.00`.
 */
export function formatRatio(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${value.toFixed(2)}${suffix}`;
}

/** A percentage that renders "—" when unmeasurable rather than a confident 0%. */
export function formatPctOrDash(value: number | null, signed = false): string {
  if (value === null) return "—";
  const sign = signed && value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** One label/value line on a review screen — shared by the share and option review views. */
export function reviewLine(label: string, value: string, cls?: string): string {
  return `<div class="review-line"><span>${escapeHtml(label)}</span><span${
    cls ? ` class="${cls}"` : ""
  }>${escapeHtml(value)}</span></div>`;
}
