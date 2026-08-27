import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";
import { escapeHtml } from "../ui/escape-html.js";
import { formatPrice } from "./desk-data.js";

/**
 * THE OPEN ORDERS PANEL — directly on the Trade page, not a separate Portfolio view (#674: the
 * member's own ask, and a real improvement over how the market leader buries pending orders under
 * Account → History → Pending, a screen away from where the order was placed).
 *
 * Alpaca is the store of record for a pending order — this panel renders straight off
 * `AlpacaTradingClient.listOrders`, no local persistence. A filled or canceled order stays visible,
 * subdued, for a short window after it leaves the open state, then this panel simply stops showing
 * it (it lives in ordinary trade history from then on). Split out of `ticket-view.ts` to keep that
 * file's own size in budget.
 */

/** How long a just-filled or just-canceled order stays visible here, subdued, before this panel
 *  drops it — a fixed timer, not tied to any refresh cadence (Eric, in-session, on #674's plan). */
const TRANSIENT_WINDOW_MS = 10_000;

type OrderBucket = "open" | "filled" | "canceled" | "omit";

/** Every non-terminal Alpaca status reads as "open" here — the member doesn't need the broker's
 *  full state machine, just whether it's still live. */
const OPEN_STATUSES = new Set([
  "new",
  "accepted",
  "pending_new",
  "accepted_for_bidding",
  "held",
  "partially_filled",
  "pending_cancel",
  "pending_replace",
  "replaced",
]);

/** "Didn't end up filled" statuses all read the same way here — expired/rejected/stopped are as
 *  uncommon on a paper desk as they are hard to explain distinctly without inventing vocabulary
 *  the member never asked for. */
const CANCELED_LIKE_STATUSES = new Set([
  "canceled",
  "expired",
  "rejected",
  "stopped",
  "done_for_day",
  "suspended",
]);

function withinTransientWindow(at: string | null | undefined, now: number): boolean {
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && now - t >= 0 && now - t <= TRANSIENT_WINDOW_MS;
}

function bucketFor(order: AlpacaOrder, now: number): OrderBucket {
  if (order.status === "filled") {
    return withinTransientWindow(order.filled_at, now) ? "filled" : "omit";
  }
  if (CANCELED_LIKE_STATUSES.has(order.status)) {
    return withinTransientWindow(order.canceled_at ?? order.filled_at, now) ? "canceled" : "omit";
  }
  return OPEN_STATUSES.has(order.status) ? "open" : "omit";
}

function priceLabel(order: AlpacaOrder): string {
  if (order.limit_price) return `limit ${formatPrice(Number(order.limit_price))}`;
  if (order.stop_price) return `stop ${formatPrice(Number(order.stop_price))}`;
  return "market";
}

function statusCell(bucket: OrderBucket, order: AlpacaOrder): string {
  if (bucket === "filled") {
    const price = order.filled_avg_price ? formatPrice(Number(order.filled_avg_price)) : "—";
    return `Filled · ${price}`;
  }
  return bucket === "canceled" ? "Canceled" : "Open";
}

function cancelForm(order: AlpacaOrder): string {
  return `<form method="post" action="/trade" style="display:inline">
      <input type="hidden" name="cancelOrder" value="${escapeHtml(order.id)}">
      <button class="btn" type="submit">Cancel</button>
    </form>`;
}

function orderRow(order: AlpacaOrder, bucket: OrderBucket): string {
  return `<tr${bucket !== "open" ? ' style="opacity:.55"' : ""}>
      <td class="tcell">${escapeHtml(order.symbol)}</td>
      <td>${escapeHtml(order.side.toUpperCase())}</td>
      <td>${escapeHtml((order.type ?? "market").toUpperCase())}</td>
      <td class="num">${escapeHtml(order.qty)}</td>
      <td>${escapeHtml(priceLabel(order))}</td>
      <td>${escapeHtml(statusCell(bucket, order))}</td>
      <td>${bucket === "open" ? cancelForm(order) : ""}</td>
    </tr>`;
}

/** Renders nothing when `orders` is undefined (no trading client for this viewer — the ticket
 *  degrades honestly rather than claiming an empty list). An empty or fully-settled order list
 *  still renders the section with its own honest empty state, so the panel stays discoverable. */
export function openOrdersPanel(
  orders: readonly AlpacaOrder[] | undefined,
  now: number = Date.now(),
): string {
  if (orders === undefined) return "";
  const rows = orders
    .map((order) => ({ order, bucket: bucketFor(order, now) }))
    .filter(
      (entry): entry is { order: AlpacaOrder; bucket: Exclude<OrderBucket, "omit"> } =>
        entry.bucket !== "omit",
    );
  const body = rows.length
    ? `<div class="blotter-inline"><table class="blotter">
        <thead><tr><th>Symbol</th><th>Side</th><th>Type</th><th class="num">Qty</th><th>Price</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map(({ order, bucket }) => orderRow(order, bucket)).join("")}</tbody>
      </table></div>`
    : `<p class="desk-note">No open orders right now.</p>`;
  return `<section class="panel" style="margin-bottom:16px">
    <div class="desk-k" style="letter-spacing:.16em;margin-bottom:12px">Open orders</div>
    ${body}
  </section>`;
}
