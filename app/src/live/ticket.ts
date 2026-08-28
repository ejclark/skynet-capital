/**
 * The pre-trade gate's client model (#738 phase 2e) — types mirror `TicketPreview` and
 * `DeskTradeResult` on the server. The client renders what the server said, verbatim; the review
 * is a courtesy and the SERVICE is the gate, so nothing here decides anything.
 */

import { postJson } from "./post";

export interface TicketDraft {
  readonly participantId: string;
  readonly symbol: string;
  readonly quantity: number;
  readonly action: "buy" | "sell";
}

export interface TicketPreview {
  readonly ok: boolean;
  readonly action: "buy" | "sell";
  readonly symbol: string;
  readonly quantity: number;
  readonly orderType: string;
  readonly estPrice?: number;
  readonly estNotional?: number;
  readonly estCashAfter?: number;
  readonly positionAfter?: number;
  readonly refusals: readonly string[];
  readonly warnings: readonly string[];
}

export type TicketResult =
  | {
      readonly ok: true;
      readonly orderId: string;
      readonly status: string;
      readonly symbol: string;
    }
  | { readonly ok: false; readonly refusals: readonly string[] };

export const reviewTicket = (draft: TicketDraft): Promise<{ preview: TicketPreview }> =>
  postJson("/api/trade/review", draft);

export const submitTicket = (draft: TicketDraft): Promise<TicketResult> =>
  postJson("/api/trade/submit", draft);

/** The dollars formatted client-side ONLY for the submit button's label — every displayed figure
 *  in the gate body comes from the server's own numbers. */
export const money = (value: number | undefined): string =>
  value === undefined ? "—" : value.toLocaleString("en-US", { style: "currency", currency: "USD" });
