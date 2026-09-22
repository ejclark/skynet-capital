/**
 * The order lifecycle's client model (#3407, P1 slice 1) — types mirror `desk-orders-view.ts`
 * and `trade-orders-routes.ts` on the server. The client renders what the server said; Alpaca is
 * the store of record, so nothing here caches or decides. Shape-independent on purpose: every
 * lo-fi candidate for where working orders live (the #674 fork) reads these same two lists.
 */

import { postJson } from "./post";

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
  readonly orderType: string;
  readonly quantity: number;
  readonly filledQuantity: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly avgFillPrice?: number;
  readonly timeInForce?: string;
  readonly submittedAt?: string;
  readonly settledAt?: string;
  readonly state: DeskOrderState;
  readonly cancelable: boolean;
  /** A working limit or stop — the kind the broker lets a member change in place (P1 1b). */
  readonly replaceable?: boolean;
  readonly replaces?: string;
  readonly replacedBy?: string;
}

export type DeskOrders =
  | {
      readonly available: true;
      readonly asOf: string;
      readonly working: readonly DeskOrderRow[];
      readonly recent: readonly DeskOrderRow[];
    }
  | {
      readonly available: false;
      readonly reason: "unlinked" | "unreachable";
      readonly working: readonly [];
      readonly recent: readonly [];
    };

export type CancelResult =
  | { readonly ok: true; readonly orderId: string }
  | { readonly ok: false; readonly refusals: readonly string[] };

export async function fetchOrders(participantId: string): Promise<DeskOrders> {
  const res = await fetch(`/api/trade/orders?participantId=${encodeURIComponent(participantId)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/trade/orders → ${res.status}`);
  return (await res.json()) as DeskOrders;
}

export const cancelOrder = (participantId: string, orderId: string): Promise<CancelResult> =>
  postJson("/api/trade/cancel", { participantId, orderId });

/** What a modify may change — only the fields the member touched are sent. */
export interface OrderChange {
  readonly quantity?: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly timeInForce?: "day" | "gtc";
}

export type ReplaceResult =
  | {
      readonly ok: true;
      /** The broker's NEW id — the old one is now `replaced`. */
      readonly orderId: string;
      readonly replaces: string;
      readonly status: string;
    }
  | { readonly ok: false; readonly refusals: readonly string[] };

export const replaceOrder = (
  participantId: string,
  orderId: string,
  change: OrderChange,
): Promise<ReplaceResult> => postJson("/api/trade/replace", { participantId, orderId, ...change });
