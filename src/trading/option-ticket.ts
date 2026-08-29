import { tradeTypeByCode } from "../domain/trade-types.js";
import {
  OPTION_PLAY_LEVEL,
  type OptionPlayCode,
  type OptionTicketContext,
  type OptionTicketPreview,
  type OptionTicketRequest,
  payoff,
  SHARES_PER_CONTRACT,
  validateAffordability,
} from "./option-economics.js";
import {
  buildOccSymbol,
  EXPIRATION_PATTERN,
  parseOccSymbol,
  UNDERLYING_PATTERN,
} from "./option-symbols.js";
import type { TicketHolding } from "./order-ticket.js";
import { normalizeSymbol } from "./order-ticket.js";

export type {
  OptionPlayCode,
  OptionTicketContext,
  OptionTicketPreview,
  OptionTicketRequest,
} from "./option-economics.js";

/**
 * THE OPTIONS ORDER TICKET — the pure decision layer behind the desk's option trades, sibling
 * to `order-ticket.ts` (shares). Same contract: a total function, no I/O, no clock, no broker —
 * refusals block, warnings inform, and a refused order is a rendered explanation.
 *
 * Deliberately conservative, because the point is to teach the DISCIPLINED version of each
 * play (the same reason the share ticket refuses shorts):
 *  - a sold put must be cash-secured — the cash to honor the promise is there or the order is
 *    refused (that is what "cash-secured" means, so the refusal is the lesson);
 *  - a sold call must be covered — 100 held shares per contract, or refused. No naked premium
 *    from this desk, ever;
 *  - a bought option must be payable from cash at its limit price.
 * The payoff numbers (max profit / max loss / breakeven) are computed here so every surface
 * shows the same honest arithmetic, including the "$0" worst case nobody likes saying out loud.
 *
 * The shared request/context/preview shapes and the payoff/affordability math live in
 * `option-economics.ts` — re-exported above so this stays the one import path for the ticket.
 */

function validateShape(request: OptionTicketRequest, refusals: string[]): void {
  if (!UNDERLYING_PATTERN.test(normalizeSymbol(request.underlying))) {
    refusals.push("That doesn't look like a stock symbol.");
  }
  if (!(Number.isInteger(request.contracts) && request.contracts > 0)) {
    refusals.push("Contracts must be a positive whole number — one contract covers 100 shares.");
  }
  if (!(Number.isFinite(request.strike) && request.strike > 0)) {
    refusals.push("Pick a strike price from the chain.");
  }
  if (!EXPIRATION_PATTERN.test(request.expiration)) {
    refusals.push("Pick an expiration date from the chain.");
  }
  if (request.orderType === "limit" && !(request.limitPrice && request.limitPrice > 0)) {
    refusals.push("A limit order needs a limit price — the premium per share you'll accept.");
  }
}

/** The account-level gates and the market-hours note, shared by open and close previews. */
function gateNotes(context: OptionTicketContext, refusals: string[], warnings: string[]): void {
  if (!context.isSelf) refusals.push("You can only trade your own account.");
  if (!context.tradingEnabled) {
    refusals.push("Trading from the desk is switched off for this deployment.");
  }
  if (context.marketOpen === false) {
    warnings.push("The market is closed — this order queues until the next session opens.");
  }
}

/** Human name for a play code, for the level-refusal message. */
const PLAY_LABEL: Record<keyof typeof OPTION_PLAY_LEVEL, string> = {
  "201": "a cash-secured put",
  "202": "a covered call",
  "301": "a long put",
  "302": "a long call",
};

/**
 * IF the account's `options_trading_level` is below the play's required level, THEN refuse with
 * the account's actual level and the level the play needs (#468 criterion 7). `optionsTradingLevel`
 * is only ever populated once it's been read live (see the field's own doc in
 * `option-economics.ts`) — undefined means "not checked here", so this never asserts a refusal
 * (or an approval) the caller can't back up. The live execution-time re-check is what always
 * carries a real value, exactly like the cash and held-shares checks above it.
 */
function levelRefusal(code: OptionPlayCode, context: OptionTicketContext): string | undefined {
  if (context.optionsTradingLevel === undefined) return undefined;
  const required = OPTION_PLAY_LEVEL[code];
  if (context.optionsTradingLevel >= required) return undefined;
  return `Your account's options trading level (${context.optionsTradingLevel}) doesn't cover ${PLAY_LABEL[code]} — that needs level ${required}. Ask Alpaca to raise your options approval, or trade a play your level allows.`;
}

/** The play itself must be a real option play the desk offers; once it is, the account's level
 *  gets its own check (#468 criterion 7). Split out of `previewOptionOrder` to keep that
 *  function's branching count under the house complexity budget. */
function validatePlay(
  request: OptionTicketRequest,
  play: ReturnType<typeof tradeTypeByCode>,
  context: OptionTicketContext,
  refusals: string[],
): void {
  if (play?.kind !== "option" || !play.optionType) {
    refusals.push("Pick one of the option plays the desk offers.");
    return;
  }
  const levelNote = levelRefusal(request.code, context);
  if (levelNote) refusals.push(levelNote);
}

/** Review an option OPEN against the account. Total: refused orders render, never throw. */
export function previewOptionOrder(
  request: OptionTicketRequest,
  context: OptionTicketContext,
): OptionTicketPreview {
  const play = tradeTypeByCode(request.code);
  const underlying = normalizeSymbol(request.underlying);
  const refusals: string[] = [];
  const warnings: string[] = [];

  gateNotes(context, refusals, warnings);
  validatePlay(request, play, context, refusals);
  validateShape(request, refusals);

  const optionType = play?.optionType ?? "call";
  const side = play?.side ?? "buy";
  const scale = request.contracts * SHARES_PER_CONTRACT;
  const estPremium =
    request.orderType === "limit" && request.limitPrice ? request.limitPrice : context.premium;

  if (refusals.length === 0) {
    validateAffordability(request, context, estPremium, refusals, warnings);
  }
  if (request.orderType === "market") {
    warnings.push(
      "Market orders on options fill at whatever the spread says — a limit at the quoted premium is the disciplined habit.",
    );
  }

  const estNotional =
    estPremium !== undefined && Number.isFinite(scale) && scale > 0
      ? estPremium * scale
      : undefined;
  const occSymbol =
    refusals.length === 0
      ? buildOccSymbol({
          underlying,
          expiration: request.expiration,
          type: optionType,
          strike: request.strike,
        })
      : undefined;

  return {
    code: request.code,
    underlying,
    ...(occSymbol ? { occSymbol } : {}),
    optionType,
    side,
    positionIntent: side === "sell" ? "sell_to_open" : "buy_to_open",
    contracts: request.contracts,
    strike: request.strike,
    expiration: request.expiration,
    orderType: request.orderType,
    ...(request.limitPrice !== undefined ? { limitPrice: request.limitPrice } : {}),
    ok: refusals.length === 0,
    ...(estPremium !== undefined ? { estPremium } : {}),
    ...(estNotional !== undefined ? { estNotional } : {}),
    ...(request.code === "201" ? { collateral: request.strike * scale } : {}),
    ...(request.code === "202" ? { sharesCommitted: scale } : {}),
    ...(refusals.length === 0
      ? payoff(request.code, request.strike, estPremium, context.underlyingPrice, scale)
      : {}),
    refusals,
    warnings,
  };
}

/**
 * Review CLOSING an option position: a long closes with a sell, a short (a put or call you
 * wrote) closes with a buy — the desk works that out from the held quantity's sign, so the
 * blotter's one Close button is always the right direction.
 */
function validateClose(
  heldContracts: number,
  closing: number,
  refusals: string[],
  warnings: string[],
): void {
  if (heldContracts === 0) {
    refusals.push("You don't hold this contract — there's nothing to close.");
  } else if (!(Number.isInteger(closing) && closing > 0)) {
    refusals.push("Contracts must be a positive whole number.");
  } else if (closing > heldContracts) {
    refusals.push(
      `You hold ${heldContracts} contract${heldContracts === 1 ? "" : "s"} — you can't close more than that.`,
    );
  } else if (closing === heldContracts) {
    warnings.push("This closes the position completely.");
  }
}

export function previewOptionClose(
  occSymbol: string,
  context: OptionTicketContext,
  contracts?: number,
): OptionTicketPreview {
  const parts = parseOccSymbol(occSymbol);
  const held = context.positions.find((p) => p.symbol === occSymbol.trim().toUpperCase());
  const heldContracts = held ? Math.abs(held.quantity) : 0;
  const closing = contracts ?? heldContracts;
  const isShort = (held?.quantity ?? 0) < 0;
  const refusals: string[] = [];
  const warnings: string[] = [];

  gateNotes(context, refusals, warnings);
  if (!parts) refusals.push("That isn't an option contract symbol.");
  validateClose(heldContracts, closing, refusals, warnings);

  // Mark per share: the position's market value over |contracts| × 100.
  const mark =
    heldContracts > 0
      ? Math.abs((held as TicketHolding).marketValue) / (heldContracts * SHARES_PER_CONTRACT)
      : undefined;
  const estNotional =
    mark !== undefined && closing > 0 ? mark * closing * SHARES_PER_CONTRACT : undefined;

  return {
    code: "close",
    underlying: parts?.underlying ?? "",
    occSymbol: occSymbol.trim().toUpperCase(),
    ...(parts
      ? { optionType: parts.type, strike: parts.strike, expiration: parts.expiration }
      : {}),
    side: isShort ? "buy" : "sell",
    positionIntent: isShort ? "buy_to_close" : "sell_to_close",
    contracts: closing,
    orderType: "market",
    ok: refusals.length === 0,
    ...(mark !== undefined ? { estPremium: mark } : {}),
    ...(estNotional !== undefined ? { estNotional } : {}),
    refusals,
    warnings,
  };
}
