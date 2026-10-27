import { type CoverLeg, coverNeeds, coverShortfall } from "../domain/option-book.js";
import type { PayoffCurve } from "./draft-order-preview.js";
import { OPTION_MULTIPLIER, type OptionType, parseOccSymbol } from "./option-symbols.js";
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
  /** Day or good-till-cancelled (both accepted by Alpaca for options). Omit and the preview
   *  says the default it will send: day — an option order that outlives the session it was
   *  placed in is a deliberate choice, never a silent one (#3407 P1 slice 4). */
  readonly timeInForce?: OptionTimeInForce;
}

export type OptionTimeInForce = "day" | "gtc";

/** The standing default for an option order the member didn't stamp: today only. Unlike the
 *  share ticket (a held stop must survive overnight to protect anything), an option premium
 *  moves with every session's implied vol, so a resting limit is opted into, not assumed. */
export const DEFAULT_OPTION_TIF: OptionTimeInForce = "day";

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
  /** Alpaca's `options_trading_level` for the account, when it's been read live (#468 criterion
   *  7). Absent means "not checked here" — a browser-side preview built off a cached snapshot
   *  can't know this without a fresh account fetch, so it skips the check rather than asserting a
   *  refusal (or an approval) it can't back up. The one place this must be populated is the
   *  execution-time re-check (`option-trade-service.ts`'s `liveContext`), which reads the live
   *  account on every submit — same treatment as cash and held-shares affordability. */
  readonly optionsTradingLevel?: number;
  /** The contract's quoted greeks, when the feed had them (#3407 P2 slice 2) — echoed, never
   *  computed here. */
  readonly greeks?: OptionPreviewGreeks;
  /** Annualized IV solved from the contract's mid, when a no-arbitrage solution exists. */
  readonly impliedVol?: number;
  /** Calendar days to the contract's expiry, for the odds. */
  readonly daysToExpiry?: number;
}

/** The four greeks the order screen shows; each present only when the feed quoted it. */
export interface OptionPreviewGreeks {
  readonly delta?: number;
  readonly gamma?: number;
  readonly theta?: number;
  readonly vega?: number;
}

/**
 * The Alpaca options level each play needs, straight from the issue's own audit: "Alpaca's own
 * levels map 1:1 onto the desk-v2 ladder: Level 1 = covered call + cash-secured put (201/202),
 * Level 2 = long calls/puts (301/302)." Level 3 (spreads, `mleg`) is out of scope for this desk.
 */
export const OPTION_PLAY_LEVEL: Record<OptionPlayCode, number> = {
  "201": 1,
  "202": 1,
  "301": 2,
  "302": 2,
};

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
  /** What the broker will be told — always stated, never hidden (#3407 P1). */
  readonly timeInForce: OptionTimeInForce;
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
  /** The contract's quoted greeks, when the feed had them (#3407 P2 slice 2). */
  readonly greeks?: OptionPreviewGreeks;
  /** Annualized IV from the mid, as a decimal. */
  readonly impliedVol?: number;
  /** P(finishes profitable at expiry), 0..1 — never shown without `expectedValue` beside it. */
  readonly chanceOfProfit?: number;
  /** Expected P/L at expiry for the whole order, dollars (can be negative). */
  readonly expectedValue?: number;
  /** The at-expiration curve the review draws (#3407; the study's row 8) — the same arithmetic
   *  as `maxLoss` / `breakeven` above, sampled server-side. Absent on a refused or unpriced
   *  order, and on a covered call reviewed without a spot (no basis, no honest curve). */
  readonly payoff?: PayoffCurve;
  readonly refusals: string[];
  readonly warnings: string[];
}

/** The trade-ticket name for the contract size; the number itself has one home,
 *  `OPTION_MULTIPLIER` (`option-symbols.ts`), shared with every surface that values a book. */
export const SHARES_PER_CONTRACT = OPTION_MULTIPLIER;

/** Takes only `positions`, not the full ticket context — `draft-order-account.ts` (multi-leg,
 *  #582) has no single-leg request to build an `OptionTicketContext` around, and this is the one
 *  piece of it that check needs. */
export function heldShares(
  context: { readonly positions: OptionTicketContext["positions"] },
  underlying: string,
): number {
  const held = context.positions.find((p) => p.symbol === underlying);
  return held ? Math.max(0, held.quantity) : 0;
}

/**
 * Shares of `underlying` still free to cover a NEW short call: held shares minus 100 for every
 * call already sold on it that no held long call caps. Counting all held shares let a second
 * covered call be written on shares the first already promised — a naked call in all but name
 * (#3729 step 4b); counting every sold call held shares back for a spread's short the long
 * already covers (#4736). The bots' `coverNeeds` decides which calls are bare, so the ticket and
 * the guards agree on shares. Shares only: a long call that caps a sold one frees its shares at
 * the strikes' width in cash, which `validateCoveredCall` charges (#6289).
 */
export function freeShares(
  context: { readonly positions: OptionTicketContext["positions"] },
  underlying: string,
): number {
  const legs = optionLegsOn(context, underlying);
  const promised = coverNeeds(legs).sharesByUnderlying.get(underlying) ?? 0;
  return Math.max(0, heldShares(context, underlying) - promised);
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
    validateCoveredCall(request, context, refusals);
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

/**
 * A covered call, JUDGED ON THE BOOK THE FILL LEAVES with the member's shares in view — the way the
 * bots' `worsens` and the multi-leg `validateDraftAccount` judge an order. A sold call is covered by
 * 100 shares or by a held long call at its strikes' width in cash; `coverShortfall` picks the best
 * assignment of both. Refused when the fill leaves the book short of more shares than before, or
 * needing more cash width than the account holds (#6289): freeing shares against a long call that
 * caps a sold one is honest only if that cap's width is charged, or the desk opens a call credit
 * spread on no cash and calls it a covered call. Past `coverShortfall`'s exact limit the shares are
 * judged outright, as the guards do; the cash stays a delta, so a sold put's collateral the book
 * already holds is never charged twice.
 */
function validateCoveredCall(
  request: OptionTicketRequest,
  context: OptionTicketContext,
  refusals: string[],
): void {
  const needed = request.contracts * SHARES_PER_CONTRACT;
  const underlying = normalizeSymbol(request.underlying);
  const held = heldShares(context, underlying);
  const legs = optionLegsOn(context, underlying);
  const sold: CoverLeg = {
    underlying,
    type: "call",
    strike: request.strike,
    expiration: request.expiration,
    contracts: -request.contracts,
  };
  const before = coverShortfall(legs, underlying, held);
  const after = coverShortfall([...legs, sold], underlying, held);
  const shortBefore = before.exact && after.exact ? before.shares : 0;
  // The shares themselves, whatever a held long call could cap (#6330): a sold call with no shares
  // behind it is a call credit spread — a level-3 play — not a covered call, and a sell of the very
  // contract held long is a close, which the close path judges.
  if (held < needed || after.shares > shortBefore) {
    const promised = held - freeShares(context, underlying);
    refusals.push(
      `Covered means you hold the shares: ${request.contracts} contract${request.contracts === 1 ? "" : "s"} needs ${needed} shares of ${underlying} and you hold ${held}${promised > 0 ? `, ${promised} of them already covering calls you've sold` : ""}. This desk never sells naked calls.`,
    );
    return;
  }
  // A call the shares fully cover sets aside nothing, so an account whose cash is negative is not
  // short of it (#6328).
  const width = after.cash - before.cash;
  if (width > 0 && width > context.cash) {
    refusals.push(
      `Covered means the cover is paid for: with this call, the calls you've sold on ${underlying} outnumber the ${held} shares behind them, so a long call you hold has to cap one — that sets aside $${width.toLocaleString("en-US")} of strike width and you have $${Math.floor(context.cash).toLocaleString("en-US")}. Fewer contracts, or more cash. This desk never sells naked calls.`,
    );
  }
}

/** Every option held on `underlying`, as the cover arithmetic reads it (contracts signed). */
function optionLegsOn(
  context: { readonly positions: OptionTicketContext["positions"] },
  underlying: string,
): CoverLeg[] {
  return context.positions.flatMap((p): CoverLeg[] => {
    const parts = parseOccSymbol(p.symbol);
    return parts?.underlying === underlying && p.quantity !== 0
      ? [{ ...parts, contracts: p.quantity }]
      : [];
  });
}
