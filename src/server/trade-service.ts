import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { positionsFrom } from "../observatory/broker-positions.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import type { Participant } from "../participants/participant.js";
import {
  normalizeSymbol,
  previewOrder,
  type TicketAction,
  type TicketPreview,
} from "../trading/order-ticket.js";

/**
 * THE DESK EXECUTION SEAM — where a member-initiated order actually reaches the broker.
 *
 * Everything here is a re-check of something the browser already showed, and that is the point:
 * **the review screen is a courtesy, the service is the gate.** A form post can claim any symbol,
 * any quantity, any account. So this layer re-reads the live account, re-runs the same pure
 * `previewOrder` rules against fresh numbers, and only then submits — a stale mark or a position
 * that moved between review and confirm gets caught here rather than being sent.
 *
 * Three refusals are structural, not tunable:
 *  1. **Off by default.** Member-initiated trading ships switched off; enabling it is the owner's
 *     call (`docs/CLAUDE.md` — governance and anything outward-facing is never self-authorized).
 *  2. **Your own account only.** The requester's resolved identity must equal the target. Without a
 *     resolved identity (no OAuth configured) there is nothing to match, so the answer is no.
 *  3. **No shorting, no fractional shares, no spending cash you don't have** — inherited whole from
 *     `trading/order-ticket.ts`, so the desk and the bots obey the same limits.
 */

interface DeskTradeRequest {
  /** The account to trade. Must equal the requester's own resolved id. */
  readonly participantId: string;
  readonly symbol: string;
  readonly quantity: number;
  readonly action: TicketAction;
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
}

export type SubmitDeskTrade = (
  request: DeskTradeRequest,
  requesterId: string | undefined,
) => Promise<DeskTradeResult>;

async function marketOpen(client: AlpacaTradingClient): Promise<boolean | undefined> {
  try {
    return await client.isMarketOpen();
  } catch {
    // An unknown clock must make no claim in either direction — the preview simply omits the
    // market-hours line rather than asserting a session that may not exist.
    return undefined;
  }
}

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
    { symbol: request.symbol, quantity: request.quantity, action: request.action },
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
 * Read the deployment's desk-trading switch and build the execution seam behind it. Enabled only
 * when `SKYNET_DESK_TRADING=on` **and** an authenticator is configured: with no signed-in identity
 * there is no account to match an order to, and the service would refuse every request anyway —
 * better to say so at boot than to leave a member clicking a button that can never work.
 */
export function resolveDeskTrading(
  env: NodeJS.ProcessEnv,
  deps: Omit<TradeServiceDeps, "tradingEnabled"> & { authConfigured: boolean },
): { enabled: boolean; submit: SubmitDeskTrade } {
  const requested = env.SKYNET_DESK_TRADING === "on";
  const enabled = requested && deps.authConfigured;
  if (requested && !deps.authConfigured) {
    console.warn(
      "⚠️  SKYNET_DESK_TRADING=on but no OAuth is configured — desk orders stay refused, since no session resolves to an account.",
    );
  }
  return {
    enabled,
    submit: createTradeService({
      findParticipant: deps.findParticipant,
      clientFactory: deps.clientFactory,
      tradingEnabled: enabled,
    }),
  };
}

export function createTradeService(deps: TradeServiceDeps): SubmitDeskTrade {
  return async (request, requesterId) => {
    if (!deps.tradingEnabled) {
      return {
        ok: false,
        refusals: ["Trading from the desk is switched off for this deployment."],
      };
    }
    if (!requesterId || requesterId !== request.participantId) {
      return { ok: false, refusals: ["You can only trade your own account."] };
    }
    const participant = deps.findParticipant(request.participantId);
    if (!participant) {
      return { ok: false, refusals: ["That account isn't on the board."] };
    }

    const client = deps.clientFactory(participant);
    let preview: TicketPreview;
    try {
      preview = await reviewLive(client, request);
    } catch (error) {
      return { ok: false, refusals: [`Couldn't read the account to check this order: ${error}`] };
    }
    if (!preview.ok) {
      return { ok: false, refusals: preview.refusals };
    }

    try {
      const order = await client.placeOrder({
        symbol: normalizeSymbol(request.symbol),
        qty: request.quantity,
        side: request.action,
      });
      return { ok: true, orderId: order.id, status: order.status, symbol: order.symbol };
    } catch (error) {
      return { ok: false, refusals: [`The broker rejected the order: ${error}`] };
    }
  };
}
