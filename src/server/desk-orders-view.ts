import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";

/**
 * THE WORKING-ORDERS VIEW — the broker's order record as the desk's own honest vocabulary
 * (#3407, P1 slice 1). Alpaca is the store of record for a pending order, so this is a pure
 * projection over `AlpacaTradingClient.listOrders`, no local persistence and no state machine of
 * its own. Every lo-fi shape in the parity study needs the same two lists whatever its layout:
 *
 *   - `working`  — orders the member can still act on (cancel; replace a limit or stop), including
 *                  a partial fill, which is still live for its remainder.
 *   - `recent`   — orders that reached a terminal state inside `RECENT_WINDOW_MS`, so the row a
 *                  member just submitted keeps telling its story (filled at what, cancelled,
 *                  rejected, expired) instead of vanishing the moment it stops being open.
 *
 * The broker's status alphabet collapses to six words a member can read without a glossary; an
 * unknown status maps to `working` when Alpaca still lists it open and is otherwise dropped —
 * never mislabelled. Time in force rides every row because the study found ours was hard-coded
 * and never shown (`docs/research/trading-parity-2026-09.md` §3.1).
 */

export type DeskOrderState =
  | "working"
  | "partial"
  | "filled"
  | "cancelled"
  | "replaced"
  | "rejected"
  | "expired";

export interface DeskOrderRow {
  readonly id: string;
  readonly symbol: string;
  readonly side: "buy" | "sell";
  /** "market" | "limit" | "stop" | … — the broker's echo, lowercased. */
  readonly orderType: string;
  readonly quantity: number;
  readonly filledQuantity: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly avgFillPrice?: number;
  /** "day" | "gtc" | … — the broker's echo; absent only on a record that predates the field. */
  readonly timeInForce?: string;
  readonly submittedAt?: string;
  /** When the order left the working state — the fill or cancel stamp, whichever applies. */
  readonly settledAt?: string;
  readonly state: DeskOrderState;
  /** True exactly when a cancel can still reach the broker. */
  readonly cancelable: boolean;
  /** True when a replace can: a working limit or stop (Alpaca's rule — a market order is on its
   *  way, and the type never changes; a different type is a new order) (#3407 P1 1b). */
  readonly replaceable: boolean;
  /** The order this one superseded, when the broker says it did. */
  readonly replaces?: string;
  /** The order that superseded this one — a `replaced` row's forward pointer. */
  readonly replacedBy?: string;
}

export interface DeskOrdersView {
  readonly working: readonly DeskOrderRow[];
  readonly recent: readonly DeskOrderRow[];
}

/** How long a settled order stays in `recent` — long enough for a member who submitted before
 *  lunch to find the fill after; short enough that the view never becomes trade history (that
 *  is the activity ledger's job). */
export const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Every non-terminal Alpaca status reads as still live here. */
const WORKING_STATUSES = new Set([
  "new",
  "accepted",
  "pending_new",
  "accepted_for_bidding",
  "held",
  "pending_cancel",
  "pending_replace",
  "calculated",
]);

const TERMINAL: Record<string, Exclude<DeskOrderState, "working" | "partial">> = {
  filled: "filled",
  // A replaced order is done — its successor carries the working state under a new id.
  replaced: "replaced",
  canceled: "cancelled",
  cancelled: "cancelled",
  done_for_day: "cancelled",
  stopped: "cancelled",
  suspended: "cancelled",
  rejected: "rejected",
  expired: "expired",
};

function num(raw: string | number | null | undefined): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function stateFor(order: AlpacaOrder): DeskOrderState | undefined {
  if (order.status === "partially_filled") return "partial";
  if (WORKING_STATUSES.has(order.status)) return "working";
  return TERMINAL[order.status];
}

function settledStamp(order: AlpacaOrder, state: DeskOrderState): string | undefined {
  if (state === "filled") return order.filled_at ?? undefined;
  // Alpaca stamps a replaced order's `replaced_at`; it is not on our record, so the cancel or
  // submit stamp keeps the row inside the recent window instead of dropping it.
  if (state === "replaced") return order.canceled_at ?? order.submitted_at ?? undefined;
  return order.canceled_at ?? order.filled_at ?? undefined;
}

const REPLACEABLE_TYPES = new Set(["limit", "stop", "stop_limit"]);

/** One broker record → one desk row, or undefined when the status is one this view can't
 *  honestly name. */
export function deskOrderRow(order: AlpacaOrder): DeskOrderRow | undefined {
  const state = stateFor(order);
  if (!state) return undefined;
  const limitPrice = num(order.limit_price);
  const stopPrice = num(order.stop_price);
  const avgFillPrice = num(order.filled_avg_price);
  const settledAt = settledStamp(order, state);
  return {
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    orderType: (order.type ?? "market").toLowerCase(),
    quantity: num(order.qty) ?? 0,
    filledQuantity: num(order.filled_qty) ?? 0,
    ...(limitPrice !== undefined ? { limitPrice } : {}),
    ...(stopPrice !== undefined ? { stopPrice } : {}),
    ...(avgFillPrice !== undefined ? { avgFillPrice } : {}),
    ...(order.time_in_force ? { timeInForce: order.time_in_force.toLowerCase() } : {}),
    ...(order.submitted_at ? { submittedAt: order.submitted_at } : {}),
    ...(settledAt ? { settledAt } : {}),
    ...(order.replaces ? { replaces: order.replaces } : {}),
    ...(order.replaced_by ? { replacedBy: order.replaced_by } : {}),
    state,
    cancelable: state === "working" || state === "partial",
    replaceable:
      (state === "working" || state === "partial") &&
      REPLACEABLE_TYPES.has((order.type ?? "market").toLowerCase()),
  };
}

function withinRecentWindow(row: DeskOrderRow, now: number): boolean {
  const stamp = row.settledAt ?? row.submittedAt;
  if (!stamp) return false;
  const t = Date.parse(stamp);
  return Number.isFinite(t) && now - t >= 0 && now - t <= RECENT_WINDOW_MS;
}

/** Project a broker order list (any status mix, any order) into the two desk lists, newest
 *  first in each. Takes `now` so the recent window is testable. */
export function deskOrdersView(
  orders: readonly AlpacaOrder[],
  now: number = Date.now(),
): DeskOrdersView {
  const rows = orders.map(deskOrderRow).filter((row): row is DeskOrderRow => row !== undefined);
  const newestFirst = (a: DeskOrderRow, b: DeskOrderRow): number =>
    Date.parse(b.submittedAt ?? "") - Date.parse(a.submittedAt ?? "") || 0;
  return {
    working: rows.filter((row) => row.cancelable).sort(newestFirst),
    recent: rows.filter((row) => !row.cancelable && withinRecentWindow(row, now)).sort(newestFirst),
  };
}
