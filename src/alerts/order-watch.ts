import type { ActivityEvent } from "../observatory/activity-event.js";
import { humanizeOptionSymbol, parseOccSymbol } from "../trading/option-symbols.js";
import type { Alert, AlertPriority } from "./alert.js";

/**
 * ORDER WATCH — what a member's own orders did while they were not looking (#3407 P4 slice 2;
 * the study's row 19, "order-status push / fill notice"). Robinhood's order-status push,
 * Fidelity's "notifications for all of your orders", thinkorswim's "Working orders filling":
 * here, the same facts read back from the activity ledger the desk already publishes to
 * (`activity-event.ts`), as rows a member can dismiss instead of a toast that vanished.
 *
 * Pure over the events: the caller hands in one account's log and a clock; only lifecycle
 * states a member would want to be TOLD about become alerts — a fill, a partial fill, a
 * cancellation, a rejection, an expiry, a replacement. A working order is not news (the
 * Working orders list shows it); a submission the member just confirmed is not news either.
 * Every number is the ledger's own; nothing here is a claim about P/L.
 */

export const ORDER_WATCH_SOURCE = "order-watch";
/** How far back a settled order stays worth telling — the same day the working-orders view keeps. */
export const ORDER_WATCH_WINDOW_MS = 24 * 60 * 60 * 1000;

const WORDS: Record<string, { readonly word: string; readonly priority: AlertPriority }> = {
  filled: { word: "filled", priority: "info" },
  partially_filled: { word: "partly filled", priority: "info" },
  canceled: { word: "cancelled", priority: "info" },
  cancelled: { word: "cancelled", priority: "info" },
  done_for_day: { word: "cancelled at the close", priority: "info" },
  expired: { word: "expired", priority: "info" },
  replaced: { word: "replaced", priority: "info" },
  rejected: { word: "rejected", priority: "warning" },
};

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "5 of 10 " for a partial, "5 " for a fill, nothing otherwise — the size in the ledger's numbers. */
function sizeWords(status: string, payload: ActivityEvent["payload"]): string {
  const quantity = num(payload.quantity);
  const filled = num(payload.filledQuantity);
  if (status === "partially_filled" && filled !== undefined && quantity !== undefined) {
    return `${filled} of ${quantity} `;
  }
  return status === "filled" && filled !== undefined ? `${filled} ` : "";
}

function priceWords(status: string, payload: ActivityEvent["payload"]): string {
  const price = num(payload.price);
  const filled = status === "filled" || status === "partially_filled";
  return price !== undefined && filled ? ` @ ${money(price)}` : "";
}

const BODY: Partial<Record<string, string>> = {
  rejected:
    "The broker refused it. The ticket's review shows the reason the next time you send one.",
  replaced: "Your change went through under a new order id — the working row reads 'changed from'.",
};

function statusOf(event: ActivityEvent): string {
  if (event.eventType === "order.filled") return "filled";
  return (str(event.payload.status) ?? "").toLowerCase();
}

function orderAlert(event: ActivityEvent): Alert | undefined {
  if (event.target.kind !== "order") return undefined;
  const status = statusOf(event);
  const words = WORDS[status];
  if (!words) return undefined;
  const at = Date.parse(event.at);
  if (!Number.isFinite(at)) return undefined;
  const wire = str(event.payload.symbol);
  const parts = wire ? parseOccSymbol(wire) : undefined;
  const display = wire ? (parts ? humanizeOptionSymbol(wire) : wire) : "order";
  const body = BODY[status];
  return {
    id: `${ORDER_WATCH_SOURCE}:${event.id}`,
    at,
    source: ORDER_WATCH_SOURCE,
    priority: words.priority,
    ...(parts ? { symbol: parts.underlying } : wire ? { symbol: wire } : {}),
    title: `Order ${event.target.id} ${words.word} — ${sizeWords(status, event.payload)}${display}${priceWords(status, event.payload)}`,
    ...(body ? { body } : {}),
    // One alert per order per state: a re-read never duplicates a fill; a partial fill that then
    // fills is genuinely new news.
    dedupeKey: `${status}:${event.target.id}`,
    data: { orderId: event.target.id, status, eventId: event.id },
  };
}

/** The order alerts inside the window, newest event per (order, state); loudness ordering is the
 *  consumer's (`sortAlerts`). */
export function orderAlerts(
  events: readonly ActivityEvent[],
  now: number,
  windowMs: number = ORDER_WATCH_WINDOW_MS,
): Alert[] {
  const latest = new Map<string, Alert>();
  for (const event of events) {
    const alert = orderAlert(event);
    if (!alert || now - alert.at > windowMs || alert.at > now + 60_000) continue;
    const key = alert.dedupeKey ?? alert.title;
    const held = latest.get(key);
    if (!held || alert.at >= held.at) latest.set(key, alert);
  }
  return [...latest.values()];
}
