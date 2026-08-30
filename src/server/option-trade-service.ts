import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { positionsFrom } from "../observatory/broker-positions.js";
import {
  type OptionPlayCode,
  type OptionTicketContext,
  type OptionTicketPreview,
  previewOptionClose,
  previewOptionOrder,
} from "../trading/option-ticket.js";
import type { VerifyAccess } from "./account-identity-gate.js";
import { type DeskSubmitResult, marketOpen, readReview, submitAndAudit } from "./desk-gate.js";
import type { OrderAuditRecord } from "./order-audit-log.js";

/**
 * THE OPTIONS EXECUTION SEAM — the desk's option orders reach the broker only through here,
 * exactly as `trade-service.ts` does for shares. Open, for the same reason: this file
 * never holds a raw broker-client factory, only a `VerifyAccess` closure bound in
 * `account-identity-gate.ts` (protected).
 *
 * This layer re-reads the live account and positions, re-fetches the CONTRACT itself (it must
 * exist and be tradable — a hand-edited strike dies here, not at the broker), re-runs the same
 * pure `previewOptionOrder`/`previewOptionClose` rules on fresh numbers, and only then submits.
 * The discipline rules from `option-ticket.ts` (cash-secured means secured, covered means
 * covered, no naked premium) are the one non-tunable rule left in this file — "your own account
 * only" lives one file over now.
 */

export type DeskOptionRequest =
  | {
      readonly kind: "open";
      readonly participantId: string;
      readonly code: OptionPlayCode;
      readonly underlying: string;
      readonly contracts: number;
      readonly strike: number;
      readonly expiration: string;
      readonly orderType: "limit" | "market";
      readonly limitPrice?: number;
    }
  | {
      readonly kind: "close";
      readonly participantId: string;
      readonly occSymbol: string;
      readonly contracts?: number;
    };

type DeskOptionResult = DeskSubmitResult;

export interface OptionTradeServiceDeps {
  /** The bound identity gate — the only way this service can reach a broker client. */
  readonly verifyAccess: VerifyAccess;
  /** Appends the per-order audit line after a successful broker submit. Optional so
   *  offline/test wiring can omit it. */
  readonly recordAudit?: (entry: OrderAuditRecord) => Promise<void>;
  readonly now?: () => Date;
}

export type SubmitOptionTrade = (
  request: DeskOptionRequest,
  requesterId: string | undefined,
) => Promise<DeskOptionResult>;

/** Alpaca's own approval tier for the account, parsed defensively. Absent or unparseable means
 *  "unknown here" (never fabricated as 0) — `previewOptionOrder`'s level check treats that the
 *  same way it treats a missing premium: skip the check rather than assert a refusal nobody can
 *  back up. A real, present value is what actually gates a play. */
function optionsTradingLevel(account: {
  options_trading_level?: string | number;
}): number | undefined {
  const level = Number(account.options_trading_level);
  return Number.isFinite(level) ? level : undefined;
}

/** Fresh account context for the pure ticket rules — same read the share desk re-runs. */
async function liveContext(
  client: AlpacaTradingClient,
  extras: { premium?: number; underlyingPrice?: number },
): Promise<OptionTicketContext> {
  const [account, positions, open] = await Promise.all([
    client.getAccount(),
    client.getPositions(),
    marketOpen(client),
  ]);
  const level = optionsTradingLevel(account);
  return {
    cash: Number(account.cash),
    positions: positionsFrom(positions),
    tradingEnabled: true,
    isSelf: true,
    ...(open !== undefined ? { marketOpen: open } : {}),
    ...(extras.premium !== undefined ? { premium: extras.premium } : {}),
    ...(extras.underlyingPrice !== undefined ? { underlyingPrice: extras.underlyingPrice } : {}),
    ...(level !== undefined ? { optionsTradingLevel: level } : {}),
  };
}

/** Re-verify an OPEN on fresh data: the contract must exist, then the rules must pass. */
async function reviewOpen(
  request: Extract<DeskOptionRequest, { kind: "open" }>,
  client: AlpacaTradingClient,
  options: AlpacaOptionsClient,
): Promise<{ preview: OptionTicketPreview } | { refusals: string[] }> {
  // The chain the browser saw is stale by definition; re-resolve the exact contract now.
  const chain = await options.getChain(
    request.underlying.trim().toUpperCase(),
    request.expiration,
    request.code === "201" || request.code === "301" ? "put" : "call",
  );
  const row = chain.find((r) => r.strike === request.strike);
  if (!row) {
    return {
      refusals: [
        `No listed ${request.expiration} contract at a $${request.strike} strike — pick a strike from the chain.`,
      ],
    };
  }
  const premium = rowPremium(row);
  const underlyingPrice = await options.getUnderlyingPrice(request.underlying.trim().toUpperCase());
  const context = await liveContext(client, {
    ...(premium !== undefined ? { premium } : {}),
    ...(underlyingPrice !== undefined ? { underlyingPrice } : {}),
  });
  const preview = previewOptionOrder(request, context);
  if (!preview.ok) return { refusals: preview.refusals };
  // Trust the exchange's naming over our own arithmetic for the wire symbol.
  return { preview: { ...preview, occSymbol: row.occSymbol } };
}

/** Re-verify a CLOSE on fresh positions: direction and size come from the live holding. */
async function reviewClose(
  request: Extract<DeskOptionRequest, { kind: "close" }>,
  client: AlpacaTradingClient,
): Promise<{ preview: OptionTicketPreview } | { refusals: string[] }> {
  const context = await liveContext(client, {});
  const preview = previewOptionClose(request.occSymbol, context, request.contracts);
  return preview.ok ? { preview } : { refusals: preview.refusals };
}

export function createOptionTradeService(deps: OptionTradeServiceDeps): SubmitOptionTrade {
  return async (request, requesterId) => {
    const access = deps.verifyAccess(request.participantId, requesterId);
    if (!("participant" in access)) {
      return access;
    }
    const options = access.optionsClient;

    const attempt = await readReview(() =>
      request.kind === "open"
        ? reviewOpen(request, access.client, options)
        : reviewClose(request, access.client),
    );
    const outcome = "refusals" in attempt ? attempt : attempt.preview;
    if ("refusals" in outcome) {
      return { ok: false, refusals: outcome.refusals };
    }
    const preview = outcome.preview;

    return submitAndAudit(
      () =>
        options.placeOptionOrder({
          occSymbol: preview.occSymbol as string,
          contracts: preview.contracts,
          side: preview.side,
          type: preview.orderType,
          ...(preview.orderType === "limit" ? { limitPrice: preview.limitPrice } : {}),
          positionIntent: preview.positionIntent,
        }),
      access.participant,
      deps,
      {
        ...(request.kind === "open" ? { code: request.code } : {}),
        intent: request.kind,
        side: preview.side,
      },
    );
  };
}
