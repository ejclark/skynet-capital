import { type EarningsPrint, optionPrintBlackout } from "../domain/earnings-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import {
  type CoverNeeds,
  orderLegs,
  premiumOut,
  quoteBand,
  requiredOptionLevel,
  SNAPSHOT_MAX_AGE_MS,
} from "../domain/option-book.js";
import { heldQuantity } from "../domain/portfolio.js";
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
  closableContracts,
  committedToPlaybook,
  type GuardLedger,
  subscriptionTerms,
  unspentCash,
  worsens,
} from "./guard-batch.js";

/**
 * The option half of the risk guards: one function, `clampOption`, that every intent carrying an
 * `option` passes through after the shared shape, ladder and S2/E1 checks in `guards.ts`.
 *
 * The rules, in order (each refusal names itself — `GuardRefusalReason`):
 *   1. every leg is quoted and two-sided in a fresh read — opens AND closes (an open's feed stamp
 *      must be fresh too); the band comes from the SNAPSHOT, never from the intent's own `band`, so
 *      a playbook cannot launder a quote;
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

/** Rule 1: every leg in the snapshot, two-sided, read ≤ 120s ago, and — for an open — feed-stamped ≤
 *  the max age. */
function quoteProblem(
  option: OptionOrderIntent,
  context: MarketContext,
  maxAgeMs: number,
): OptionRefusalReason | undefined {
  const contracts = context.options?.contracts ?? {};
  const quotes = option.legs.map((leg) => contracts[leg.occSymbol]);
  const asOf = Date.parse(context.asOf);
  for (const quote of quotes) {
    // Two-sided means two real numbers, ask at or above bid — a null, an infinite or an inverted
    // quote prices nothing (#4645 red-team).
    const { bid, ask } = quote ?? {};
    if (!(Number.isFinite(bid) && Number.isFinite(ask)) || (ask as number) < (bid as number)) {
      return "no-quote";
    }
  }
  for (const quote of quotes) {
    if (!quote) return "no-quote";
    // `!(age <= bound)` so an unparseable stamp reads as stale, never as fresh.
    if (!(asOf - Date.parse(quote.fetchedAt) <= SNAPSHOT_MAX_AGE_MS)) return "option-quote-stale";
    // The feed's own stamp bounds an OPEN only. A close must never starve: the indicative feed
    // leaves a thin strike's quote untouched for long stretches, and a close the bot cannot send
    // carries the contract into expiry. A close still needs a fresh read and a limit inside it.
    if (option.effect === "close") continue;
    if (quote.quotedAt === undefined) return "option-quote-stale";
    if (!(asOf - Date.parse(quote.quotedAt) <= maxAgeMs)) return "option-quote-stale";
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

/** Rule 3: close what is held — less what closes approved earlier this batch already take — and
 *  never leave a short bare by closing its cap. */
function clampClose(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  { ledger }: OptionBatch,
): OptionOutcome {
  let units = intent.quantity;
  for (const leg of option.legs) {
    const held = heldQuantity(portfolio, leg.occSymbol);
    const closable = closableContracts(ledger, leg.occSymbol, held, leg.side);
    units = Math.min(units, Math.floor(closable / leg.ratio));
  }
  if (!(units > 0)) return refuse("nothing-held");

  const underlying = intent.symbol;
  const pays = premiumOut(option) * units;
  const worse = worsens(portfolio, ledger, underlying, { legs: orderLegs(option, units), pays });
  // Only a close that makes cover WORSE is refused: a book already short of cover must still be able
  // to shed risk. Worse means closing a long that capped a short — or paying a buy-back out of cash
  // another short's collateral stands on (#4645 fuzz: a covered call bought back from a put's cash).
  if (worse.shares) return refuse("call-not-covered");
  if (worse.cash) return refuse(worse.newCash > pays ? "put-not-secured" : "collateral-reserved");
  claim(ledger, { order: { underlying, option, units } });
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

/** Rules 8–9: cash for collateral and premium, shares for a sold call — refused when the order makes
 *  cover worse in any fill/no-fill combination of what this batch already approved (`worsens`).
 *  `cash` is what the order newly puts at risk: the collateral it adds at worst, plus its premium. */
function coverProblem(
  intent: OrderIntent,
  option: OptionOrderIntent,
  portfolio: Portfolio,
  { ledger }: OptionBatch,
): { readonly reason?: OptionRefusalReason; readonly cash: number } {
  const pays = premiumOut(option) * MAX_OPTION_OPEN_UNITS;
  const worse = worsens(portfolio, ledger, intent.symbol, {
    legs: orderLegs(option, MAX_OPTION_OPEN_UNITS),
    pays,
  });
  const cash = worse.newCash;
  if (worse.cash) {
    const reason =
      option.structure === "cash-secured-put"
        ? "put-not-secured"
        : unspentCash(portfolio, ledger) >= cash
          ? "collateral-reserved"
          : "insufficient-cash";
    return { reason, cash };
  }
  if (worse.shares) return { reason: "call-not-covered", cash };
  return { cash };
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
  // `Number.isInteger`: a NaN level compares false against everything, which would read as "high
  // enough" (#4645 red-team). The wiring parses it to 0..3 or undefined; this holds the line anyway.
  if (level === undefined || !Number.isInteger(level) || level < requiredOptionLevel(option)) {
    return refuse("options-level");
  }
  const terms = subscriptionTerms(intent, config);
  if (terms.refusesSymbol) return refuse("subscription-filter");
  const print = printProblem(option, intent.symbol, context.asOf, config.discipline?.calendar);
  if (print) return refuse(print);

  const cover = coverProblem(intent, option, portfolio, batch);
  if (cover.reason) return refuse(cover.reason);

  const capital = terms.subscription?.capitalAllocated;
  if (capital === undefined) return refuse("option-unallocated");
  // A covered call risks no cash of its own, so no allocation can refuse it — not even one the
  // stock's own rise has pushed past (#4645 review); a sold put risks its collateral, a spread its
  // debit.
  const risk = Math.max(0, cover.cash);
  const committed = committedToPlaybook(intent, portfolio, context, config.playbookSymbols, batch);
  if (risk > 0 && risk > capital + terms.realizedPl - committed) {
    return refuse("subscription-budget");
  }

  claim(batch.ledger, {
    order: { underlying: intent.symbol, option, units: MAX_OPTION_OPEN_UNITS },
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
