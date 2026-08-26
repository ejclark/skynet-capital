import type { OptionType } from "./option-symbols.js";
import type { TicketHolding } from "./order-ticket.js";
import { normalizeSymbol } from "./order-ticket.js";

/**
 * THE OPTION TICKET'S ECONOMICS — the shared shapes plus the payoff math and affordability
 * checks behind `option-ticket.ts`, split out as their own concern: given a play and its
 * numbers, what does it pay off, and can the account actually afford it. Same contract as the
 * ticket: total functions, no I/O, no clock, no broker. `option-ticket.ts` imports and
 * re-exports the types below so its public API is unchanged.
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

export const SHARES_PER_CONTRACT = 100;

export function heldShares(context: OptionTicketContext, underlying: string): number {
  const held = context.positions.find((p) => p.symbol === underlying);
  return held ? Math.max(0, held.quantity) : 0;
}

/** Payoff facts per play, all per the standard textbook arithmetic, in whole dollars. */
export function payoff(
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

export function validateAffordability(
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
