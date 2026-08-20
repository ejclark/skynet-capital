import type { TicketContext } from "../trading/order-ticket.js";
import { matchRoundTrips, type RoundTripLedger, type TradeFill } from "../trading/round-trips.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { ActivityView, ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * The adapter between the observatory's account snapshot and the pure trading layer. It exists so
 * `src/trading/*` stays free of any view type (fills in, trips out) and the views stay free of any
 * matching logic — the seam that lets the FIFO matcher be tested on fixtures with no broker shape
 * anywhere near it.
 */

/** Only FILLED shares are trades. A submitted, cancelled, or rejected order is not history. */
export function fillsFrom(activity: readonly ActivityView[] | undefined): TradeFill[] {
  return (activity ?? [])
    .filter((row) => row.filledQuantity > 0 && (row.side === "buy" || row.side === "sell"))
    .map((row) => ({
      symbol: row.symbol,
      side: row.side as "buy" | "sell",
      quantity: row.filledQuantity,
      ...(row.price !== undefined ? { price: row.price } : {}),
      at: row.at,
    }));
}

/** A participant's closed-trade ledger, reconstructed from whatever fill window we hold. */
export function deskLedger(snapshot: ParticipantSnapshot): RoundTripLedger {
  return matchRoundTrips(fillsFrom(snapshot.activity));
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

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Hold time in the coarsest unit that stays truthful — "3d 4h", "45m", "under a minute". */
export function formatHold(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < MINUTE) return "<1m";
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`;
  if (ms < DAY) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.round((ms % HOUR) / MINUTE);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.round((ms % DAY) / HOUR);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
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

/** A ticket's warnings then refusals, in the house notice styles. */
export function reviewNotices(warnings: readonly string[], refusals: readonly string[]): string {
  return [
    ...warnings.map((warning) => `<p class="note-warn">${escapeHtml(warning)}</p>`),
    ...refusals.map((refusal) => `<p class="note-stop">${escapeHtml(refusal)}</p>`),
  ].join("");
}
