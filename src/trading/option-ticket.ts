import { tradeTypeByCode } from "../domain/trade-types.js";
import { buildOccSymbol, type OptionType, parseOccSymbol } from "./option-symbols.js";
import type { TicketHolding } from "./order-ticket.js";
import { normalizeSymbol } from "./order-ticket.js";

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
 */

/** Option trade-type codes the ticket can OPEN. Closing rides `previewOptionClose`. */
export type OptionPlayCode = "201" | "202" | "301" | "302";

export interface OptionTicketRequest {
  readonly code: OptionPlayCode;
  readonly underlying: string;
  readonly contracts: number;
  readonly strike: number;
  /** ISO date, e.g. "2026-09-18". */
  readonly expiration: string;
  readonly orderType: "limit" | "market";
  /** Premium per share the trader will accept — required for limit orders. */
  readonly limitPrice?: number;
}

export interface OptionTicketContext {
  readonly cash: number;
  /** Everything held — stock rows and option rows (OCC symbols, contracts signed) together. */
  readonly positions: readonly TicketHolding[];
  readonly tradingEnabled: boolean;
  readonly isSelf: boolean;
  readonly marketOpen?: boolean;
  /** Indicative premium $/share for the chosen contract (last quote/close), when known. */
  readonly premium?: number;
  /** The underlying's last known price, when known. */
  readonly underlyingPrice?: number;
}

export interface OptionTicketPreview {
  readonly code: OptionPlayCode | "close";
  readonly underlying: string;
  readonly occSymbol?: string;
  readonly optionType?: OptionType;
  readonly side: "buy" | "sell";
  readonly positionIntent: "buy_to_open" | "sell_to_open" | "buy_to_close" | "sell_to_close";
  readonly contracts: number;
  readonly strike?: number;
  readonly expiration?: string;
  readonly orderType: "limit" | "market";
  readonly limitPrice?: number;
  readonly ok: boolean;
  /** Premium $/share the estimates below use (the limit when set, else the indicative). */
  readonly estPremium?: number;
  /** Dollars in (credit, sells) or out (debit, buys): premium × 100 × contracts. */
  readonly estNotional?: number;
  /** Cash set aside to secure a sold put: strike × 100 × contracts. */
  readonly collateral?: number;
  /** Shares committed by a covered call: 100 × contracts. */
  readonly sharesCommitted?: number;
  readonly maxProfit?: number | "uncapped";
  readonly maxLoss?: number;
  readonly breakeven?: number;
  readonly refusals: string[];
  readonly warnings: string[];
}

const SHARES_PER_CONTRACT = 100;
const UNDERLYING_PATTERN = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
const EXPIRATION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function heldShares(context: OptionTicketContext, underlying: string): number {
  const held = context.positions.find((p) => p.symbol === underlying);
  return held ? Math.max(0, held.quantity) : 0;
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

/** Payoff facts per play, all per the standard textbook arithmetic, in whole dollars. */
function payoff(
  code: OptionPlayCode,
  strike: number,
  premium: number | undefined,
  spot: number | undefined,
  scale: number,
): Pick<OptionTicketPreview, "maxProfit" | "maxLoss" | "breakeven"> {
  if (premium === undefined) return {};
  if (code === "201") {
    // Sold put, cash-secured: keep the premium above the strike; own the stock below it.
    return {
      maxProfit: premium * scale,
      maxLoss: (strike - premium) * scale,
      breakeven: strike - premium,
    };
  }
  if (code === "202") {
    // Covered call: upside to the strike plus the premium; downside is the shares', cushioned.
    return {
      ...(spot !== undefined
        ? { maxProfit: (strike - spot + premium) * scale, maxLoss: (spot - premium) * scale }
        : { maxProfit: premium * scale }),
      ...(spot !== undefined ? { breakeven: spot - premium } : {}),
    };
  }
  if (code === "301") {
    // Long put: worth the most at $0; premium is the whole downside.
    return {
      maxProfit: (strike - premium) * scale,
      maxLoss: premium * scale,
      breakeven: strike - premium,
    };
  }
  // 302 — long call: uncapped above breakeven; premium is the whole downside.
  return { maxProfit: "uncapped", maxLoss: premium * scale, breakeven: strike + premium };
}

function validateAffordability(
  request: OptionTicketRequest,
  context: OptionTicketContext,
  estPremium: number | undefined,
  refusals: string[],
  warnings: string[],
): void {
  const scale = request.contracts * SHARES_PER_CONTRACT;
  if (request.code === "201") {
    const collateral = request.strike * scale;
    if (collateral > context.cash) {
      refusals.push(
        `Cash-secured means the cash is there: this promise needs $${collateral.toLocaleString("en-US")} set aside and you have $${Math.floor(context.cash).toLocaleString("en-US")}. Fewer contracts or a lower strike.`,
      );
    }
    return;
  }
  if (request.code === "202") {
    const needed = request.contracts * SHARES_PER_CONTRACT;
    const held = heldShares(context, normalizeSymbol(request.underlying));
    if (held < needed) {
      refusals.push(
        `Covered means you hold the shares: ${request.contracts} contract${request.contracts === 1 ? "" : "s"} needs ${needed} shares of ${normalizeSymbol(request.underlying)} and you hold ${held}. This desk never sells naked calls.`,
      );
    }
    return;
  }
  // 301/302 — a bought option is paid for from cash.
  if (estPremium === undefined) {
    warnings.push(
      "No indicative premium for this contract — the cost is unknown until the broker fills it.",
    );
    return;
  }
  const debit = estPremium * scale;
  if (debit > context.cash) {
    refusals.push(
      "The premium is more than your available cash — fewer contracts, or a cheaper strike.",
    );
  }
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
  if (play?.kind !== "option" || !play.optionType) {
    refusals.push("Pick one of the option plays the desk offers.");
  }
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
