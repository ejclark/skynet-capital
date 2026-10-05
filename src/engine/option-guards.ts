import { type EarningsPrint, optionPrintBlackout } from "../domain/earnings-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import {
  type CoverNeeds,
  freeCash,
  freeShares,
  marginalNeeds,
  needsAfterClose,
  premiumOut,
  quoteBand,
  requiredOptionLevel,
  SNAPSHOT_MAX_AGE_MS,
} from "../domain/option-book.js";
import { heldQuantity, positionValue } from "../domain/portfolio.js";
import type {
  MarketContext,
  OptionOrderIntent,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import { QUOTE_STALE_MS } from "../options/position-guidance-rules.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import {
  claim,
  type GuardLedger,
  ledgerCash,
  ledgerShares,
  subscriptionFor,
} from "./guard-batch.js";

/**
 * The option half of the risk guards: one function, `clampOption`, that every intent carrying an
 * `option` passes through after the shared shape, ladder and S2/E1 checks in `guards.ts`.
 *
 * The rules, in order (each refusal names itself — `GuardRefusalReason`):
 *   1. every leg is quoted, two-sided and fresh — opens AND closes; the band comes from the SNAPSHOT,
 *      never from the intent's own `band`, so a playbook cannot launder a quote;
 *   2. the limit sits inside that band;
 *   3. a close closes only what is held, and never leaves a sold call or put bare;
 *   4–11. an open needs the account's options level, the subscription's symbol filter, an expiry
 *      shown to clear the next print, one unit, cash for collateral and premium, shares to cover a
 *      sold call, and room in its playbook's Store allocation.
 *
 * Closes are never gated by level, filter, print or budget — a guard that blocks risk reduction is a
 * hazard, not a discipline.
 */

/** Every option open is exactly one contract (or one spread) — sized by the Store allocation, never
 *  by the share position cap, which cannot secure even one put. */
const MAX_OPTION_OPEN_UNITS = 1;

/** A cents limit against a quoted band: half a cent of slack for the float arithmetic. */
const LIMIT_EPSILON = 0.005;

/** The slice of `RiskConfig` the option rules read — declared here so this module never imports the
 *  file that imports it. */
export interface OptionGuardConfig {
  /** Alpaca `options_trading_level`. Absent = every option OPEN refused. */
  readonly optionsLevel?: number;
  /** Oldest feed stamp a quote may carry. Default `QUOTE_STALE_MS` (15 min). */
  readonly optionQuoteMaxAgeMs?: number;
  readonly discipline?: { readonly calendar: readonly EarningsPrint[] };
  readonly subscriptions?: readonly PlaybookSubscription[];
  readonly playbookSymbols?: ReadonlyMap<string, readonly string[]>;
  readonly realizedPlForPlaybook?: (playbookId: string) => number;
}

/** The refusals this module can name — a subset of `GuardRefusalReason`. */
type OptionRefusalReason =
  | "no-quote"
  | "option-quote-stale"
  | "option-limit-outside-quote"
  | "nothing-held"
  | "call-not-covered"
  | "put-not-secured"
  | "options-level"
  | "subscription-filter"
  | "option-print-unknown"
  | "option-spans-print"
  | "collateral-reserved"
  | "insufficient-cash"
  | "option-unallocated"
  | "subscription-budget";

type OptionOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | { readonly ok: false; readonly reason: OptionRefusalReason };

const refuse = (reason: OptionRefusalReason): OptionOutcome => ({ ok: false, reason });

/** The batch's shared state: the starting book's promises and what earlier intents claimed. */
export interface OptionBatch {
  readonly ledger: GuardLedger;
  readonly book: CoverNeeds;
}

/** Rule 1: every leg in the snapshot, two-sided, read ≤ 120s ago, and feed-stamped ≤ the max age (a
 *  missing stamp only on a close — a close must never starve). */
function quoteProblem(
  option: OptionOrderIntent,
  context: MarketContext,
  maxAgeMs: number,
): OptionRefusalReason | undefined {
  const contracts = context.options?.contracts ?? {};
  const quotes = option.legs.map((leg) => contracts[leg.occSymbol]);
  const asOf = Date.parse(context.asOf);
  for (const quote of quotes) {
    if (quote?.bid === undefined || quote.ask === undefined) return "no-quote";
  }
  for (const quote of quotes) {
    if (!quote) return "no-quote";
    // `!(age <= bound)` so an unparseable stamp reads as stale, never as fresh.
    if (!(asOf - Date.parse(quote.fetchedAt) <= SNAPSHOT_MAX_AGE_MS)) return "option-quote-stale";
    if (quote.quotedAt === undefined) {
      if (option.effect !== "close") return "option-quote-stale";
    } else if (!(asOf - Date.parse(quote.quotedAt) <= maxAgeMs)) {
      return "option-quote-stale";
    }
  }
  return undefined;
}

/** Rules 1–2. */
function priceProblem(
  option: OptionOrderIntent,
  context: MarketContext,
  config: OptionGuardConfig,
): OptionRefusalReason | undefined {
  const stale = quoteProblem(option, context, config.optionQuoteMaxAgeMs ?? QUOTE_STALE_MS);
  if (stale) return stale;
  const band = quoteBand(option, context.options?.contracts ?? {});
  if (!band) return "no-quote";
  const inside =
    option.limitPrice >= band.low - LIMIT_EPSILON && option.limitPrice <= band.high + LIMIT_EPSILON;
  return inside ? undefined : "option-limit-outside-quote";
}

/** Rule 3: close what is held, no more, and never leave a short bare by closing its cap. */
function clampClose(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  { ledger, book }: OptionBatch,
): OptionOutcome {
  let units = intent.quantity;
  for (const leg of option.legs) {
    const held = heldQuantity(portfolio, leg.occSymbol);
    const closable = leg.side === "sell" ? Math.max(0, held) : Math.max(0, -held);
    units = Math.min(units, Math.floor(closable / leg.ratio));
  }
  if (!(units > 0)) return refuse("nothing-held");

  const underlying = intent.symbol;
  const after = needsAfterClose(portfolio, option, units);
  const sharesBefore = book.sharesByUnderlying.get(underlying) ?? 0;
  const sharesAfter = after.sharesByUnderlying.get(underlying) ?? 0;
  // Only a close that RAISES what the book promises can be refused: a book already short of cover
  // must still be able to shed risk.
  const shareRoom =
    Math.max(0, heldQuantity(portfolio, underlying)) - ledgerShares(ledger, underlying);
  if (sharesAfter > sharesBefore && sharesAfter > shareRoom) return refuse("call-not-covered");
  if (after.cash > book.cash && after.cash > portfolio.cash - ledgerCash(ledger)) {
    return refuse("put-not-secured");
  }
  claim(ledger, {
    cash: Math.max(0, after.cash - book.cash) + premiumOut(option) * units,
    underlying,
    shares: sharesAfter - sharesBefore,
  });
  return { ok: true, intent: { ...intent, quantity: units } };
}

/** Rule 6: the open must close before the earliest live print blackout begins. */
function printProblem(
  option: OptionOrderIntent,
  underlying: string,
  asOfIso: string,
  calendar: readonly EarningsPrint[] | undefined,
): OptionRefusalReason | undefined {
  const blackout = calendar ? optionPrintBlackout(underlying, asOfIso, calendar) : undefined;
  if (!blackout) return "option-print-unknown";
  const today = marketDayKey(asOfIso);
  if (today >= blackout.start && today <= blackout.end) return "option-spans-print";
  const spans = option.legs.some((leg) => {
    const expiration = parseOccSymbol(leg.occSymbol)?.expiration;
    return expiration === undefined || expiration >= blackout.start;
  });
  return spans ? "option-spans-print" : undefined;
}

/** Dollars a playbook's basket already holds against its allocation: shares at the ask, collateral
 *  its sold options set aside, long options at their mark, and what this batch already claimed. */
function committedTo(
  intent: OrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: OptionGuardConfig,
  { ledger, book }: OptionBatch,
): number {
  const playbookId = intent.playbookId ?? "";
  const basket = config.playbookSymbols?.get(playbookId) ?? [intent.symbol];
  let committed = ledger.byPlaybook.get(playbookId) ?? 0;
  for (const symbol of basket) {
    const ask = context.quotes[symbol]?.ask;
    if (ask !== undefined) committed += heldQuantity(portfolio, symbol) * ask;
    committed += book.cashByUnderlying.get(symbol) ?? 0;
  }
  for (const position of portfolio.positions) {
    const parts = parseOccSymbol(position.symbol);
    if (parts && position.quantity > 0 && basket.includes(parts.underlying)) {
      committed += positionValue(position, undefined);
    }
  }
  return committed;
}

/** Rules 8–9: cash for collateral and premium, shares for a sold call. */
function coverProblem(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  { ledger, book }: OptionBatch,
): { readonly reason?: OptionRefusalReason; readonly cash: number; readonly shares: number } {
  const marginal = marginalNeeds(portfolio, option, MAX_OPTION_OPEN_UNITS);
  const cash = marginal.cash + premiumOut(option) * MAX_OPTION_OPEN_UNITS;
  const shares = marginal.sharesByUnderlying.get(intent.symbol) ?? 0;
  if (cash > freeCash(portfolio, book) - ledgerCash(ledger)) {
    const reason =
      option.structure === "cash-secured-put"
        ? "put-not-secured"
        : portfolio.cash - ledgerCash(ledger) >= cash
          ? "collateral-reserved"
          : "insufficient-cash";
    return { reason, cash, shares };
  }
  const shareRoom =
    freeShares(portfolio, intent.symbol, book) - ledgerShares(ledger, intent.symbol);
  if (shares > 0 && shares > shareRoom) return { reason: "call-not-covered", cash, shares };
  return { cash, shares };
}

/** Rules 4–11. */
function clampOpen(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: OptionGuardConfig,
  batch: OptionBatch,
): OptionOutcome {
  const level = config.optionsLevel;
  if (level === undefined || level < requiredOptionLevel(option)) return refuse("options-level");
  const subscription = subscriptionFor(intent, config.subscriptions);
  if (subscription?.symbols?.length && !subscription.symbols.includes(intent.symbol)) {
    return refuse("subscription-filter");
  }
  const print = printProblem(option, intent.symbol, context.asOf, config.discipline?.calendar);
  if (print) return refuse(print);

  const cover = coverProblem(intent, option, portfolio, batch);
  if (cover.reason) return refuse(cover.reason);

  const capital = subscription?.capitalAllocated;
  if (capital === undefined) return refuse("option-unallocated");
  const realizedPl =
    subscription?.compoundAllocation && intent.playbookId
      ? (config.realizedPlForPlaybook?.(intent.playbookId) ?? 0)
      : 0;
  // A covered call risks no cash of its own; a sold put risks its collateral, a spread its debit.
  const risk = Math.max(0, cover.cash);
  const room = capital + realizedPl - committedTo(intent, portfolio, context, config, batch);
  if (risk > room) return refuse("subscription-budget");

  claim(batch.ledger, {
    cash: cover.cash,
    underlying: intent.symbol,
    shares: cover.shares,
    ...(intent.playbookId ? { playbookId: intent.playbookId } : {}),
    risk,
  });
  return { ok: true, intent: { ...intent, quantity: MAX_OPTION_OPEN_UNITS } };
}

/**
 * The option clamp. `intent` has already passed the shape check (`optionOrderProblems`), the ladder
 * and S2/E1 — `guards.ts` runs those for every intent alike, keyed on the underlying. An approved
 * intent claims its cash and shares on the batch ledger, so a later intent in the same cycle cannot
 * spend them again.
 */
export function clampOption(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: OptionGuardConfig,
  batch: OptionBatch,
): OptionOutcome {
  const priced = priceProblem(option, context, config);
  if (priced) return refuse(priced);
  return option.effect === "close"
    ? clampClose(intent, option, portfolio, batch)
    : clampOpen(intent, option, portfolio, context, config, batch);
}
