import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { positionsFrom } from "../observatory/broker-positions.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import type { Participant } from "../participants/participant.js";
import {
  normalizeSymbol,
  previewOrder,
  type TicketAction,
  type TicketOrderType,
  type TicketPreview,
} from "../trading/order-ticket.js";
import { marketOpen, openDesk, readReview, submitAndAudit } from "./desk-gate.js";
import {
  createOptionTradeService,
  type OptionTradeServiceDeps,
  type SubmitOptionTrade,
} from "./option-trade-service.js";
import type { OrderAuditRecord } from "./order-audit-log.js";

/**
 * THE DESK EXECUTION SEAM — where a member-initiated order actually reaches the broker.
 *
 * Everything here is a re-check of something the browser already showed, and that is the point:
 * **the review screen is a courtesy, the service is the gate.** A form post can claim any symbol,
 * any quantity, any account. So this layer re-reads the live account, re-runs the same pure
 * `previewOrder` rules against fresh numbers, and only then submits — a stale mark or a position
 * that moved between review and confirm gets caught here rather than being sent.
 *
 * Two refusals are structural, not tunable:
 *  1. **Your own account only, sign-in required.** The requester's resolved identity — the owner
 *     link stamped at `/add` (see `dashboard-server.ts`'s `resolveOwnerId`) — must equal the
 *     target. No resolved identity (no OAuth configured, or the account has no owner link yet)
 *     means nothing to match, so the answer is no. There is deliberately no separate kill switch
 *     (Eric's ruling, 2026-08-21, #466): the moment a member's account is linked, they may trade it.
 *  2. **No shorting, no fractional shares, no spending cash you don't have** — inherited whole from
 *     `trading/order-ticket.ts`, so the desk and the bots obey the same limits.
 */

interface DeskTradeRequest {
  /** The account to trade. Must equal the requester's own resolved id. */
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
  /** Resolve a participant (with credentials) by id — the roster plus the self-service store. */
  readonly findParticipant: (id: string) => Participant | undefined;
  readonly clientFactory: TradingClientFactory;
  /** Member-initiated trading is enabled for this deployment. */
  readonly tradingEnabled: boolean;
  /** Appends the per-order audit line (#466) after a successful broker submit. Optional so
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

/**
 * Build the execution seams behind the desk gate — shares and options together. Trading is
 * enabled purely by an authenticator being configured: with no signed-in identity there is no
 * account to match an order to, so the services would refuse every request anyway. There is
 * deliberately no separate on/off switch (Eric's ruling, 2026-08-21, #466 — `SKYNET_DESK_TRADING`
 * is removed): the moment a member's account carries an owner link, they may trade it.
 */
export function resolveDeskTrading(
  deps: Omit<TradeServiceDeps, "tradingEnabled"> & {
    authConfigured: boolean;
    optionsClientFactory: OptionTradeServiceDeps["optionsClientFactory"];
  },
): {
  enabled: boolean;
  submit: SubmitDeskTrade;
  submitOption: SubmitOptionTrade;
} {
  const enabled = deps.authConfigured;
  return {
    enabled,
    submit: createTradeService({
      findParticipant: deps.findParticipant,
      clientFactory: deps.clientFactory,
      tradingEnabled: enabled,
      ...(deps.recordAudit ? { recordAudit: deps.recordAudit } : {}),
      ...(deps.now ? { now: deps.now } : {}),
    }),
    submitOption: createOptionTradeService({
      findParticipant: deps.findParticipant,
      clientFactory: deps.clientFactory,
      optionsClientFactory: deps.optionsClientFactory,
      tradingEnabled: enabled,
      ...(deps.recordAudit ? { recordAudit: deps.recordAudit } : {}),
      ...(deps.now ? { now: deps.now } : {}),
    }),
  };
}

export function createTradeService(deps: TradeServiceDeps): SubmitDeskTrade {
  return async (request, requesterId) => {
    const desk = openDesk(deps, request.participantId, requesterId);
    if ("refusals" in desk) {
      return desk;
    }
    const reviewed = await readReview(() => reviewLive(desk.client, request));
    if ("refusals" in reviewed) {
      return { ok: false, refusals: reviewed.refusals };
    }
    const preview: TicketPreview = reviewed.preview;
    if (!preview.ok) {
      return { ok: false, refusals: preview.refusals };
    }

    return submitAndAudit(
      () =>
        desk.client.placeOrder({
          symbol: normalizeSymbol(request.symbol),
          qty: request.quantity,
          side: request.action,
          ...(preview.orderType !== "market" ? { type: preview.orderType } : {}),
          ...(preview.limitPrice !== undefined ? { limit_price: preview.limitPrice } : {}),
          ...(preview.stopPrice !== undefined ? { stop_price: preview.stopPrice } : {}),
        }),
      desk.participant,
      deps,
      {
        code: request.action === "buy" ? "101" : "102",
        intent: request.action === "buy" ? "open" : "close",
        side: request.action,
      },
    );
  };
}
