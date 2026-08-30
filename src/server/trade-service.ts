import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { positionsFrom } from "../observatory/broker-positions.js";
import {
  normalizeSymbol,
  previewOrder,
  type TicketAction,
  type TicketOrderType,
  type TicketPreview,
} from "../trading/order-ticket.js";
import type { VerifyAccess } from "./account-identity-gate.js";
import { marketOpen, readReview, submitAndAudit } from "./desk-gate.js";
import type { OrderAuditRecord } from "./order-audit-log.js";

/**
 * THE DESK EXECUTION SEAM — where a member-initiated order actually reaches the broker. Open:
 * this file never holds a raw broker-client factory, only a `VerifyAccess` closure bound
 * in `account-identity-gate.ts` (protected) — the identity check that closure enforces is not
 * this file's concern to get right, only to call.
 *
 * Everything here is a re-check of something the browser already showed, and that is the point:
 * **the review screen is a courtesy, the service is the gate.** A form post can claim any symbol,
 * any quantity, any account. So this layer re-reads the live account, re-runs the same pure
 * `previewOrder` rules against fresh numbers, and only then submits — a stale mark or a position
 * that moved between review and confirm gets caught here rather than being sent.
 *
 * The one non-tunable rule left in this file: **no shorting, no fractional shares, no spending
 * cash you don't have** — inherited whole from `trading/order-ticket.ts`, so the desk and the
 * bots obey the same limits. "Your own account only" lives one file over now.
 */

interface DeskTradeRequest {
  /** The account to trade. Must equal the requester's own resolved id (enforced by `VerifyAccess`). */
  readonly participantId: string;
  readonly symbol: string;
  readonly quantity: number;
  readonly action: TicketAction;
  readonly orderType?: TicketOrderType;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

export type DeskTradeResult =
  | {
      readonly ok: true;
      readonly orderId: string;
      readonly status: string;
      readonly symbol: string;
    }
  | { readonly ok: false; readonly refusals: string[] };

export interface TradeServiceDeps {
  /** The bound identity gate — the only way this service can reach a broker client. */
  readonly verifyAccess: VerifyAccess;
  /** Appends the per-order audit line after a successful broker submit. Optional so
   *  offline/test wiring can omit it. */
  readonly recordAudit?: (entry: OrderAuditRecord) => Promise<void>;
  readonly now?: () => Date;
}

export type SubmitDeskTrade = (
  request: DeskTradeRequest,
  requesterId: string | undefined,
) => Promise<DeskTradeResult>;

/** Re-read the account and re-run the ticket rules against live numbers. */
async function reviewLive(
  client: AlpacaTradingClient,
  request: DeskTradeRequest,
): Promise<TicketPreview> {
  const [account, positions, open] = await Promise.all([
    client.getAccount(),
    client.getPositions(),
    marketOpen(client),
  ]);
  return previewOrder(
    {
      symbol: request.symbol,
      quantity: request.quantity,
      action: request.action,
      ...(request.orderType ? { orderType: request.orderType } : {}),
      ...(request.limitPrice !== undefined ? { limitPrice: request.limitPrice } : {}),
      ...(request.stopPrice !== undefined ? { stopPrice: request.stopPrice } : {}),
    },
    {
      cash: Number(account.cash),
      positions: positionsFrom(positions),
      tradingEnabled: true,
      isSelf: true,
      ...(open !== undefined ? { marketOpen: open } : {}),
    },
  );
}

export function createTradeService(deps: TradeServiceDeps): SubmitDeskTrade {
  return async (request, requesterId) => {
    const access = deps.verifyAccess(request.participantId, requesterId);
    if (!("participant" in access)) {
      return access;
    }
    const reviewed = await readReview(() => reviewLive(access.client, request));
    if ("refusals" in reviewed) {
      return { ok: false, refusals: reviewed.refusals };
    }
    const preview: TicketPreview = reviewed.preview;
    if (!preview.ok) {
      return { ok: false, refusals: preview.refusals };
    }

    return submitAndAudit(
      () =>
        access.client.placeOrder({
          symbol: normalizeSymbol(request.symbol),
          qty: request.quantity,
          side: request.action,
          ...(preview.orderType !== "market" ? { type: preview.orderType } : {}),
          ...(preview.limitPrice !== undefined ? { limit_price: preview.limitPrice } : {}),
          ...(preview.stopPrice !== undefined ? { stop_price: preview.stopPrice } : {}),
        }),
      access.participant,
      deps,
      {
        code: request.action === "buy" ? "101" : "102",
        intent: request.action === "buy" ? "open" : "close",
        side: request.action,
      },
    );
  };
}
