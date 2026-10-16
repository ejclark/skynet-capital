import { type EarningsPrint, etTimeOf } from "../domain/earnings-calendar.js";
import { daysBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { type HeldContract, optionBook } from "../domain/option-book.js";
import {
  type ListedExpirations,
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionDemand,
  type OrderIntent,
  type PlaybookMode,
  type Portfolio,
} from "../domain/types.js";
import {
  chainQuotes,
  closeAggression,
  eligibleExpirations,
  OPEN_TOWARD_NATURAL,
  pickByDelta,
  priceInside,
  singleLegTick,
} from "../options/contract-picker.js";
import { humanizeOptionSymbol, OPTION_MULTIPLIER } from "../trading/option-symbols.js";
import { optionCloseIntent, optionOpenIntent } from "./option-intent.js";
import { pairFor } from "./pair-table.js";
import type { Playbook } from "./playbook.js";

/**
 * THE LONG CALL, HELD THROUGH PRINTS (#5482, Eric 2026-10-16: "long term i know the stock is almost
 * certainly to go up significantly beyond current price, likely multiple times/cycles over the next
 * 3-6 months"; "holding positions to a recovery past earnings is another common possibility").
 *
 * It buys calls about four to six months out, near 0.60 delta, and holds them through earnings
 * prints. It sells them all at double what they cost, or when 45 days are left (before time decay
 * speeds up and before hygiene's T-2 close would have to), whichever comes first.
 *
 * WHY IT MAY HOLD A PRINT WHEN NOTHING ELSE MAY. The house never holds a SOLD option across a print:
 * on CRWV the market has priced the print move smaller than it turned out, which is the seller's
 * loss and the buyer's edge (`docs/research/events/crwv-2026-11-10-print.md`; premium-fit call 5's
 * "own the gamma" mirror trade). A bought call's worst case is its premium. The guard exempts the
 * `long-call` structure from the spans-a-print rule, and still refuses an open inside a blackout.
 *
 * SIZE. Every option open is one contract (`option-guards.ts`), so the play adds one per cycle up to
 * its mode's cap; the Store allocation is the hard ceiling (the guard refuses past it). It never
 * chases: a new contract is bought only while its ask is within 10% of what the held ones cost.
 *
 * STATE COMES FROM THE POSITIONS ALONE, as the wheel's does: a restart reads correctly.
 */

/** The window it buys in, in calendar days to expiry: the latest listed expiry inside it. */
const MIN_DTE = 120;
const MAX_DTE = 200;
/** Sell everything once this few days remain. */
const EXIT_DTE = 45;
/** Sell everything once the bid is this multiple of the average cost. */
const TAKE_PROFIT = 2;
/** Add only while the ask is at most this multiple of the held contracts' average cost. */
const NO_CHASE = 1.1;
/** How far the picked strike's delta may sit from the target. */
const DELTA_MISS = 0.1;

/** Target delta per mode: deeper in the money is steadier, further out more leveraged. */
export const LONG_CALL_DELTAS: Readonly<Record<PlaybookMode, number>> = {
  conservative: 0.7,
  standard: 0.6,
  aggressive: 0.5,
};

/** At most this many contracts held at once, per mode. The budget usually binds first. */
export const LONG_CALL_MAX_CONTRACTS: Readonly<Record<PlaybookMode, number>> = {
  conservative: 3,
  standard: 6,
  aggressive: 10,
};

export interface LongCallSetting {
  readonly symbol: string;
  readonly thesis: string;
  /** The owner's view, said plainly on every buy — what the market has wrong, and over what time. */
  readonly bet: string;
}

/** The strategy tag its buys carry on the decision record. */
export const longCallTag = (symbol: string): string => `${symbol.toLowerCase()}-long-call`;

/** The held calls this play trades: long calls on the ticker, nothing else. */
function heldCalls(portfolio: Portfolio, symbol: string): HeldContract[] {
  return optionBook(portfolio, symbol).contracts.filter((c) => c.type === "call" && c.quantity > 0);
}

/** Whether anything else is on the ticker's option book (a sold contract, a put) — not this play's
 *  book, so it neither adds nor closes. */
function foreign(portfolio: Portfolio, symbol: string): boolean {
  return optionBook(portfolio, symbol).contracts.some((c) => c.quantity < 0 || c.type === "put");
}

/** The expiry it would buy today, or none listed in the window. */
function entryExpiry(listed: readonly string[], asOfIso: string): string | undefined {
  return eligibleExpirations(listed, marketDayKey(asOfIso), {
    minDte: MIN_DTE,
    maxDte: MAX_DTE,
    before: "9999-12-31",
  }).at(-1);
}

const contractsOf = (held: readonly HeldContract[]): number =>
  held.reduce((n, c) => n + c.quantity, 0);

/** Average premium paid per share across the held calls. */
const averageCost = (held: readonly HeldContract[]): number =>
  held.reduce((sum, c) => sum + c.avgPrice * c.quantity, 0) / Math.max(1, contractsOf(held));

const cents = (x: number): string => `$${x.toFixed(2)}`;

/** Why a held call is sold now, or `undefined` while it should be held. */
function exitCause(
  contract: HeldContract,
  bid: number | undefined,
  today: string,
): "profit" | "time" | undefined {
  if (daysBetween(today, contract.expiration) <= EXIT_DTE) return "time";
  if (bid !== undefined && contract.avgPrice > 0 && bid >= TAKE_PROFIT * contract.avgPrice) {
    return "profit";
  }
  return undefined;
}

function closeIntents(symbol: string, context: MarketContext, held: readonly HeldContract[]) {
  const today = marketDayKey(context.asOf);
  const out: OrderIntent[] = [];
  for (const contract of held) {
    const quote = context.options?.contracts[contract.occSymbol];
    const { bid, ask, quotedAt } = quote ?? {};
    const cause = exitCause(contract, bid, today);
    if (!cause || bid === undefined || ask === undefined || quotedAt === undefined) continue;
    const towardNatural = closeAggression(0, etTimeOf(context.asOf));
    const limitPrice = priceInside(
      { low: bid, high: ask },
      "sell",
      towardNatural,
      singleLegTick(bid, ask),
    );
    if (limitPrice === undefined) continue;
    const name = humanizeOptionSymbol(contract.occSymbol);
    const why =
      cause === "profit"
        ? `it is worth ${cents(bid)} a share, at least double the ${cents(contract.avgPrice)} paid`
        : `${EXIT_DTE} days or fewer are left, and time decay speeds up from here`;
    const intent = optionCloseIntent({
      underlying: symbol,
      legs: [{ occSymbol: contract.occSymbol, side: "sell" }],
      quantity: contract.quantity,
      limitPrice,
      band: { low: bid, high: ask, at: quotedAt },
      strategy: `${longCallTag(symbol)}-close`,
      reason: `Selling the ${name} back: ${why}.`,
      expectation: `The calls are sold near ${cents(limitPrice)} a share and the cash returns to the budget.`,
      selection: { rule: "long-call-close", phase: cause, towardNatural },
    });
    if (intent) out.push(intent);
  }
  return out;
}

function openIntent(
  setting: LongCallSetting,
  symbol: string,
  context: MarketContext,
  held: readonly HeldContract[],
  mode: PlaybookMode,
): OrderIntent[] {
  if (contractsOf(held) >= LONG_CALL_MAX_CONTRACTS[mode]) return [];
  const spot = context.quotes[symbol]?.last;
  // Add to the expiry already held, so the book stays one line; otherwise the latest in the window.
  const expiration =
    held[0]?.expiration ?? entryExpiry(context.options?.listed[symbol] ?? [], context.asOf);
  if (!(expiration && spot !== undefined && spot > 0)) return [];
  const target = LONG_CALL_DELTAS[mode];
  const rows = chainQuotes(context.options, symbol, expiration, "call");
  const pick = pickByDelta(rows, target, spot, context.asOf, {
    otm: false,
    maxDeltaMiss: DELTA_MISS,
  });
  if (!pick) return [];
  const { bid, ask, quotedAt } = pick.quote;
  if (bid === undefined || ask === undefined || quotedAt === undefined) return [];
  if (held.length > 0 && ask > NO_CHASE * averageCost(held)) return [];
  const towardNatural = OPEN_TOWARD_NATURAL[mode];
  const limitPrice = priceInside(
    { low: bid, high: ask },
    "buy",
    towardNatural,
    singleLegTick(bid, ask),
  );
  if (limitPrice === undefined) return [];
  const name = humanizeOptionSymbol(pick.quote.occSymbol);
  const cost = Math.round(limitPrice * OPTION_MULTIPLIER).toLocaleString("en-US");
  const intent = optionOpenIntent({
    underlying: symbol,
    structure: "long-call",
    legs: [{ occSymbol: pick.quote.occSymbol, side: "buy" }],
    limitPrice,
    band: { low: bid, high: ask, at: quotedAt },
    strategy: longCallTag(symbol),
    reason: `Buying one ${name} for about ${cents(limitPrice)} a share ($${cost} for the contract), held through earnings. ${setting.bet}`,
    expectation: `${symbol} rises before ${expiration}: the calls are sold at double their cost, or with ${EXIT_DTE} days left. The most this contract can lose is the $${cost} paid.`,
    forecast: {
      direction: "up",
      invalidator: `${symbol} is below ${cents(spot)} with ${EXIT_DTE} days left on the ${name}`,
    },
    selection: {
      rule: "long-call-by-delta",
      phase: held.length > 0 ? "add" : "enter",
      spot,
      dte: daysBetween(marketDayKey(context.asOf), expiration),
      targetDelta: target,
      pickedDelta: pick.absDelta,
      deltaSource: pick.deltaSource,
      candidates: pick.candidates,
      towardNatural,
    },
  });
  return intent ? [intent] : [];
}

/** The long call on one ticker — `CRWV-LONG-CALL` is one call of this. Its id comes from the pair
 *  table; a ticker with no long-call row throws (criterion 8). `lookup` is a seam for specs. */
export function longCall(setting: LongCallSetting, lookup: typeof pairFor = pairFor): Playbook {
  const symbol = setting.symbol.toUpperCase();
  const pair = lookup("long-call", symbol);
  if (!pair)
    throw new Error(`no pair-table row for long-call × ${symbol}; add its evidence row first`);
  const { evidence } = pair;
  if (evidence.status !== "conviction" || !evidence.checkOn || !evidence.study) {
    throw new Error(`long-call × ${symbol} runs only on a dated conviction citing a study`);
  }
  return {
    id: pair.id,
    symbols: [symbol],
    thesis: setting.thesis,
    evidence: `${evidence.study} — ${evidence.call} Checked ${evidence.checkOn}: new buys stop if its net P/L is below 0.`,
    // Unused: sized by the Store allocation, one contract per cycle up to the mode's cap.
    size: { conservative: 0, standard: 0, aggressive: 0 },
    options: { underlyings: [symbol], holdsShortToExpiry: [], requiredLevel: 2 },
    desiredState: () => "long",
    optionDemand(
      asOfIso: string,
      portfolio: Portfolio,
      listed: ListedExpirations,
      _calendar: readonly EarningsPrint[],
    ): OptionDemand {
      if (foreign(portfolio, symbol)) return NO_OPTION_DEMAND;
      const held = heldCalls(portfolio, symbol);
      const expiration = held[0]?.expiration ?? entryExpiry(listed[symbol] ?? [], asOfIso);
      return {
        chains: expiration ? [{ underlying: symbol, expiration, type: "call" }] : [],
        contracts: held.map((c) => c.occSymbol),
      };
    },
    decide(context, portfolio, _calendar, mode) {
      if (foreign(portfolio, symbol)) return [];
      const held = heldCalls(portfolio, symbol);
      const closes = closeIntents(symbol, context, held);
      if (closes.length > 0) return closes;
      return openIntent(setting, symbol, context, held, mode);
    },
  };
}
