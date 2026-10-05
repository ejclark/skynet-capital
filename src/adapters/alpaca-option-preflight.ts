import type { ContractSnapshot } from "../alpaca/alpaca-options-client.js";
import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";
import {
  bookNeeds,
  freeCash,
  freeShares,
  marginalNeeds,
  needsAfterClose,
  premiumOut,
  quoteBand,
  requiredOptionLevel,
} from "../domain/option-book.js";
import { heldQuantity } from "../domain/portfolio.js";
import type {
  OptionContractQuote,
  OptionOrderIntent,
  OrderIntent,
  Portfolio,
} from "../domain/types.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import { snapshotQuote } from "./alpaca-option-market.js";

/**
 * The bots' option order flow re-checks an order on FRESH broker state just before it is sent
 * (#4642 slice 5) — the guards sized it against the cycle's book and quotes, and both can move in
 * the seconds between. PURE: every function here reads payloads already fetched, so each rule is a
 * spec, not a network fixture.
 *
 * The book arithmetic is the guards' own (`option-book.ts`), so "is this put secured?" has one
 * answer; the reasons use the dashboard's refusal words (`REFUSAL_LABEL`) so a refusal here reads
 * the same as one the guards made.
 */

/** A cents limit against a quoted band: half a cent of slack for float arithmetic — the guard's. */
const LIMIT_EPSILON = 0.005;
const PUT_NOT_SECURED = "not enough free cash to secure the sold put";
const CALL_NOT_COVERED = "not enough free shares to cover the sold call";

/** Alpaca's `options_trading_level` as 0–3, from a number or a numeric string. Anything else —
 *  absent, junk, a fraction, out of range — is `undefined`, never a guessed 0, and an undefined
 *  level refuses every option open. */
export function parseOptionsLevel(raw: unknown): number | undefined {
  if (typeof raw !== "number" && typeof raw !== "string") return undefined;
  if (typeof raw === "string" && raw.trim() === "") return undefined;
  const level = Number(raw);
  return Number.isInteger(level) && level >= 0 && level <= 3 ? level : undefined;
}

/** An open needs the account's approval; a close never does. */
export function levelProblem(option: OptionOrderIntent, rawLevel: unknown): string | undefined {
  if (option.effect !== "open") return undefined;
  const need = requiredOptionLevel(option);
  const level = parseOptionsLevel(rawLevel);
  if (level === undefined) return "the account's options approval level could not be read";
  return level < need ? `options level ${level} is below the ${need} this order needs` : undefined;
}

const rootOf = (symbol: string): string => parseOccSymbol(symbol)?.underlying ?? symbol;

/**
 * Every open order on `underlying`, and which of them are this bot's own. Ours: the client order id
 * names this persona AND this underlying (`client-order-id.ts`). Any: ours, a share order on the
 * ticker, a contract on it, or a spread with a leg on it — read from a nested list, so a resting
 * spread is seen whole.
 */
export function ordersOn(
  open: readonly AlpacaOrder[],
  underlying: string,
  clientOrderIdPrefix: string,
): { readonly ours: readonly AlpacaOrder[]; readonly any: readonly AlpacaOrder[] } {
  const isOurs = (o: AlpacaOrder): boolean =>
    o.client_order_id?.startsWith(`${clientOrderIdPrefix}${underlying}-`) === true;
  const touches = (o: AlpacaOrder): boolean =>
    rootOf(o.symbol ?? "") === underlying ||
    (o.legs ?? []).some((leg) => rootOf(leg.symbol ?? "") === underlying);
  const any = open.filter((o) => isOurs(o) || touches(o));
  return { ours: any.filter(isOurs), any };
}

/** Rule 3 of the option guards on fresh positions: close what is held, and never leave a short
 *  bare by closing what capped it. */
function closeProblem(intent: OrderIntent, option: OptionOrderIntent, portfolio: Portfolio) {
  let units = intent.quantity;
  for (const leg of option.legs) {
    const held = heldQuantity(portfolio, leg.occSymbol);
    const closable = leg.side === "sell" ? Math.max(0, held) : Math.max(0, -held);
    units = Math.min(units, Math.floor(closable / leg.ratio));
  }
  if (!(units > 0)) return "nothing held to close";
  // Never resized here: the record says what was decided, and the next cycle sizes from this book.
  if (units < intent.quantity) return `only ${units} held to close, not ${intent.quantity}`;
  const book = bookNeeds(portfolio);
  const after = needsAfterClose(portfolio, option, units);
  const underlying = intent.symbol;
  const sharesBefore = book.sharesByUnderlying.get(underlying) ?? 0;
  const sharesAfter = after.sharesByUnderlying.get(underlying) ?? 0;
  // Only a close that RAISES what the book promises can be refused: shedding risk never is.
  if (
    sharesAfter > sharesBefore &&
    sharesAfter > Math.max(0, heldQuantity(portfolio, underlying))
  ) {
    return CALL_NOT_COVERED;
  }
  if (after.cash > book.cash && after.cash > portfolio.cash) return PUT_NOT_SECURED;
  return undefined;
}

/** Rules 8–9 on fresh positions: cash for collateral and premium, shares for a sold call — plus
 *  Alpaca's own options buying power as a second cash bound when the account reports one. */
function openProblem(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  optionsBuyingPower: number | undefined,
) {
  const marginal = marginalNeeds(portfolio, option, intent.quantity);
  const cash = marginal.cash + premiumOut(option) * intent.quantity;
  if (cash > freeCash(portfolio)) {
    if (option.structure === "cash-secured-put") return PUT_NOT_SECURED;
    return portfolio.cash >= cash
      ? "that cash is set aside to secure a sold put"
      : "insufficient cash";
  }
  if (optionsBuyingPower !== undefined && cash > optionsBuyingPower) {
    return `options buying power $${optionsBuyingPower.toFixed(2)} is below the $${cash.toFixed(2)} this order needs`;
  }
  const shares = marginal.sharesByUnderlying.get(intent.symbol) ?? 0;
  if (shares > 0 && shares > freeShares(portfolio, intent.symbol)) return CALL_NOT_COVERED;
  return undefined;
}

/** The book re-check, on positions read moments ago. */
export function freshBookProblem(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  optionsBuyingPower?: number,
): string | undefined {
  return option.effect === "close"
    ? closeProblem(intent, option, portfolio)
    : openProblem(intent, option, portfolio, optionsBuyingPower);
}

/** `options_buying_power` as dollars, when the account reports a usable one. */
export function optionsBuyingPowerOf(raw: unknown): number | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * The quote re-check: the band the legs quote NOW, in the limit's own sign convention
 * (`quoteBand`), each leg's feed stamp no older than `maxAgeMs` (an unstamped quote only on a
 * close, which must never starve), and the limit inside the band.
 */
export function freshBandProblem(
  option: OptionOrderIntent,
  snapshots: ReadonlyMap<string, ContractSnapshot>,
  nowMs: number,
  maxAgeMs: number,
): string | undefined {
  const fetchedAt = new Date(nowMs).toISOString();
  const quotes: Record<string, OptionContractQuote> = {};
  for (const leg of option.legs) {
    const snapshot = snapshots.get(leg.occSymbol);
    const quote = snapshot && snapshotQuote(leg.occSymbol, snapshot, fetchedAt);
    if (quote) quotes[leg.occSymbol] = quote;
  }
  const band = quoteBand(option, quotes);
  const contracts = option.legs.map((leg) => leg.occSymbol).join(" + ");
  if (!band) return `no fresh two-sided quote on ${contracts}`;
  for (const leg of option.legs) {
    const stamp = quotes[leg.occSymbol]?.quotedAt;
    if (stamp === undefined) {
      if (option.effect === "open") return `the quote on ${leg.occSymbol} carries no time`;
      continue;
    }
    // `!(age <= bound)` so an unparseable stamp reads as stale, never as fresh.
    if (!(nowMs - Date.parse(stamp) <= maxAgeMs)) return `the quote on ${leg.occSymbol} is stale`;
  }
  const inside =
    option.limitPrice >= band.low - LIMIT_EPSILON && option.limitPrice <= band.high + LIMIT_EPSILON;
  return inside
    ? undefined
    : `quote moved: limit ${option.limitPrice.toFixed(2)} outside [${band.low.toFixed(2)}, ${band.high.toFixed(2)}]`;
}
