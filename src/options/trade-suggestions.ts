import { priceInside, singleLegTick } from "./contract-picker.js";
import {
  coverableLots,
  daysBetween,
  dayText,
  etDateOf,
  GUIDANCE_DISCLOSURE,
  MAX_SPREAD_OF_MID,
  MIN_BID,
  MIN_OPEN_INTEREST,
  pct,
  QUOTE_STALE_MS,
  usd,
} from "./position-guidance-rules.js";
import type { EarningsWindow, GuidanceQuote } from "./position-guidance-types.js";
import { priceOption } from "./pricing.js";
import { daysToExpiryFrom } from "./single-leg-odds.js";
import { metricsFor, type SuggestionMetric } from "./trade-suggestions-metrics.js";
import {
  deltaBand,
  dteWindow,
  isLong,
  optionTypeOf,
  SIM_LABEL,
  STRATEGY_WORDS,
  type SuggestionStrategy,
  type SuggestionTier,
  TIER_RULES,
  type TierRule,
  tierRuleText,
} from "./trade-suggestions-rules.js";

/**
 * SUGGESTED TRADES (#7547 slice 1) — a chain and an account in, exactly three sized options out
 * (conservative · standard · high risk), each an opening order the trade form can prefill (a sale
 * for a covered call or a cash-secured put, a purchase for a long call or put), each citing
 * the metrics that produced it with the value used. PURE and deterministic: no clock (the caller
 * passes `now`), no I/O, every pick a total order. Moneypenny only ever explains this output — she
 * never invents a number (the plan's constraint), so every figure a member reads starts here.
 *
 * The chain row is the position guidance's own `GuidanceQuote` (what `/api/trade/guidance` already
 * assembles, per-contract IV included), and the liquidity bar is the guidance's: one threshold, one
 * place. The tiers are `trade-suggestions-rules.ts`; the citations `trade-suggestions-metrics.ts`.
 */

export interface SuggestionAccount {
  /** Whole-account value — the denominator of "share of the account at risk". */
  readonly equity: number;
  /** Cash free to secure a put. */
  readonly cash: number;
  /** Shares held in this symbol — a covered call needs 100 per contract. */
  readonly shares?: number;
  /** Covered calls already open on these shares: those lots are spoken for. */
  readonly callsSold?: number;
  /** Average cost per share — a covered call's strike never sits below it (no locked-in loss). */
  readonly costBasis?: number;
}

export interface SuggestionInputs {
  readonly symbol: string;
  readonly strategy: SuggestionStrategy;
  /** ISO-8601, from the caller — the engine has no clock. */
  readonly now: string;
  readonly spot: number;
  readonly sessionOpen: boolean;
  readonly chain: readonly GuidanceQuote[];
  readonly account: SuggestionAccount;
  /** IV rank 0–100, cited when the IV instrument has a full window. */
  readonly ivRank?: number;
  /**
   * An expiry on or after the print window's start: a SOLD option there sells premium across
   * earnings, so it is excluded; a BOUGHT one is allowed (a 45–90 day window nearly always spans a
   * print) and cites the print, since its implied volatility tends to fall once the news is out.
   */
  readonly earnings?: EarningsWindow;
  readonly rate?: number;
}

interface TierHead {
  readonly tier: SuggestionTier;
  readonly word: string;
  readonly mark: string;
  /** The written rule that defines this tier, as a sentence. */
  readonly rule: string;
  readonly label: typeof SIM_LABEL;
}

export interface SuggestedTrade extends TierHead {
  readonly available: true;
  readonly symbol: string;
  readonly strategy: SuggestionStrategy;
  readonly type: "call" | "put";
  readonly side: "sell" | "buy";
  readonly expiration: string;
  readonly dte: number;
  readonly strike: number;
  readonly contracts: number;
  /** Limit per share: the mid, on the contract's tick grid. */
  readonly limit: number;
  /** "Sell 2 AMD Dec 19 $170 calls at $3.15" — the ticket in one line. */
  readonly summary: string;
  readonly metrics: readonly SuggestionMetric[];
}

/** A tier the chain or the account cannot fill — said plainly, never filled with a smaller bet. */
export interface UnavailableTier extends TierHead {
  readonly available: false;
  readonly reason: string;
}

export type TierOption = SuggestedTrade | UnavailableTier;

export interface TradeSuggestions {
  readonly symbol: string;
  readonly strategy: SuggestionStrategy;
  readonly asOf: string;
  readonly spot: number;
  /** Market closed: these are a plan for the next open, never an order for now. */
  readonly atOpen: boolean;
  /** Always three, always in this order: conservative · standard · high risk. */
  readonly options: readonly [TierOption, TierOption, TierOption];
  readonly disclosure: string;
}

interface Candidate {
  readonly quote: GuidanceQuote & {
    readonly bid: number;
    readonly ask: number;
    readonly iv: number;
  };
  readonly absDelta: number;
  readonly days: number;
  readonly dte: number;
  readonly spread: number;
}

const round = (x: number, scale = 1e6): number => Math.round(x * scale) / scale;

/** The guidance's PRICE-AT-BID bar, plus its open-interest floor and (in session) its staleness. */
function tradable(q: GuidanceQuote, input: SuggestionInputs): Candidate["quote"] | undefined {
  const { bid, ask, iv } = q;
  if (bid === undefined || ask === undefined || iv === undefined) return undefined;
  if (!(bid >= MIN_BID && ask >= bid && iv > 0)) return undefined;
  if ((ask - bid) / ((ask + bid) / 2) > MAX_SPREAD_OF_MID) return undefined;
  if (q.openInterest !== undefined && q.openInterest < MIN_OPEN_INTEREST) return undefined;
  const age = q.quotedAt === undefined ? 0 : Date.parse(input.now) - Date.parse(q.quotedAt);
  if (input.sessionOpen && age > QUOTE_STALE_MS) return undefined;
  return { ...q, bid, ask, iv };
}

/** The print window falls on or before this expiry. */
const spansPrint = (expiration: string, input: SuggestionInputs): boolean =>
  input.earnings !== undefined && expiration >= input.earnings.start;

/** In the strategy's DTE window (and, for a sale, before any print window); nearest the target
 *  first, then sooner. */
function expiriesByPreference(input: SuggestionInputs, today: string): string[] {
  const window = dteWindow(input.strategy);
  const long = isLong(input.strategy);
  const listed = [...new Set(input.chain.map((q) => q.expiration))];
  return listed
    .filter((e) => {
      const dte = daysBetween(today, e);
      return dte >= window.min && dte <= window.max && (long || !spansPrint(e, input));
    })
    .sort((a, b) => {
      const da = daysBetween(today, a);
      const db = daysBetween(today, b);
      return Math.abs(da - window.target) - Math.abs(db - window.target) || da - db;
    });
}

function candidatesAt(expiration: string, input: SuggestionInputs, today: string): Candidate[] {
  const type = optionTypeOf(input.strategy);
  const long = isLong(input.strategy);
  const { spot, account } = input;
  const days = daysToExpiryFrom(expiration, new Date(input.now)) ?? 1;
  return input.chain.flatMap((q) => {
    if (q.expiration !== expiration || q.type !== type) return [];
    // A sale stays out of the money; a purchase may sit in it (the conservative buy does).
    const strikeAllowed = long || (type === "call" ? q.strike > spot : q.strike < spot);
    const aboveBasis =
      input.strategy !== "covered-call" ||
      account.costBasis === undefined ||
      q.strike >= account.costBasis;
    const quote = strikeAllowed && aboveBasis ? tradable(q, input) : undefined;
    if (!quote) return [];
    const valuation = priceOption({
      spot,
      strike: q.strike,
      daysToExpiry: days,
      volatility: quote.iv,
      rate: input.rate ?? 0,
      type,
    });
    if (!valuation) return [];
    const spread = round((quote.ask - quote.bid) / ((quote.ask + quote.bid) / 2), 1e9);
    return [
      {
        quote,
        absDelta: Math.abs(valuation.delta),
        days,
        dte: daysBetween(today, expiration),
        spread,
      },
    ];
  });
}

/** The row whose |delta| sits nearest the band's middle, inside the band. Ties: tighter spread,
 *  then farther out of the money, then the lower strike — a total order. (An exact delta tie needs
 *  two strikes the model prices identically, so these rungs only make the order total; they carry
 *  no tier intent, for a sale or a purchase.) */
function pickInBand(
  rows: readonly Candidate[],
  band: { readonly min: number; readonly max: number },
): Candidate | undefined {
  const mid = (band.min + band.max) / 2;
  const fartherOtm = (a: Candidate, b: Candidate) =>
    a.quote.type === "call" ? b.quote.strike - a.quote.strike : a.quote.strike - b.quote.strike;
  return rows
    .filter((r) => round(r.absDelta) >= band.min && round(r.absDelta) <= band.max)
    .sort(
      (a, b) =>
        round(Math.abs(a.absDelta - mid)) - round(Math.abs(b.absDelta - mid)) ||
        a.spread - b.spread ||
        fartherOtm(a, b) ||
        a.quote.strike - b.quote.strike,
    )[0];
}

/** Contracts the tier allows, or the plain reason it allows none. */
function sizeFor(
  rule: TierRule,
  input: SuggestionInputs,
  strike: number,
  limit: number,
): { contracts: number } | { reason: string } {
  const { account } = input;
  if (input.strategy === "covered-call") {
    const lots = coverableLots({ shares: account.shares, callsSold: account.callsSold });
    if (lots < 1) {
      return {
        reason: `A covered call needs 100 shares per contract; you have ${account.shares ?? 0} shares and none free.`,
      };
    }
    return { contracts: Math.max(1, Math.floor(lots * rule.coveredLotShare + 1e-9)) };
  }
  // A cash-secured put and a long option size the same way — the account cap on one contract's max
  // loss, then the cash one contract ties up — differing only in those two figures and their words.
  // A long option is a debit: its premium is both the cash it takes and the most it can lose.
  const long = isLong(input.strategy);
  const loss = (long ? limit : strike - limit) * 100;
  const cash = (long ? limit : strike) * 100;
  if (!(account.equity > 0)) {
    return { reason: "Your account shows no equity to size a trade against." };
  }
  const byRisk = Math.floor((rule.maxAccountAtRisk * account.equity) / loss + 1e-9);
  const byCash = Math.floor(account.cash / cash + 1e-9);
  const at = `One contract at the ${usd(strike)} strike`;
  const share = `(${pct(loss / account.equity, 1)} of your account)`;
  const cap = `this tier caps that at ${pct(rule.maxAccountAtRisk)}.`;
  if (byRisk < 1) {
    return {
      reason: long
        ? `${at} costs ${usd(loss)} ${share}, all of it lost if it expires worthless; ${cap}`
        : `${at} could lose ${usd(loss)} ${share} if the stock went to zero; ${cap}`,
    };
  }
  if (byCash < 1) {
    return {
      reason: long
        ? `${at} costs ${usd(cash)}; you have ${usd(account.cash)} in cash.`
        : `${at} needs ${usd(cash)} in cash to secure; you have ${usd(account.cash)}.`,
    };
  }
  return { contracts: Math.min(byCash, byRisk) };
}

function optionFor(
  rule: TierRule,
  input: SuggestionInputs,
  expiries: readonly string[],
  today: string,
): TierOption {
  const head: TierHead = {
    tier: rule.tier,
    word: rule.word,
    mark: rule.mark,
    rule: tierRuleText(rule, input.strategy),
    label: SIM_LABEL,
  };
  const band = deltaBand(rule, input.strategy);
  const window = dteWindow(input.strategy);
  const long = isLong(input.strategy);
  const side = long ? "buy" : "sell";
  let pick: Candidate | undefined;
  for (const expiration of expiries) {
    pick = pickInBand(candidatesAt(expiration, input, today), band);
    if (pick) break;
  }
  if (!pick) {
    const why =
      expiries.length === 0
        ? `No expiry ${window.min}–${window.max} days out${input.earnings && !long ? " before earnings" : ""} is listed.`
        : `No tradable strike sits at ${band.min.toFixed(2)}–${band.max.toFixed(2)} delta in the ${window.min}–${window.max} day window.`;
    return { ...head, available: false, reason: why };
  }
  const { quote } = pick;
  const limit = priceInside(
    { low: quote.bid, high: quote.ask },
    side,
    0,
    singleLegTick(quote.bid, quote.ask),
  );
  if (limit === undefined) {
    return { ...head, available: false, reason: "The quote has no price on its tick grid." };
  }
  const size = sizeFor(rule, input, quote.strike, limit);
  if ("reason" in size) return { ...head, available: false, reason: size.reason };
  const { contracts } = size;
  const kind = `${quote.type}${contracts === 1 ? "" : "s"}`;
  return {
    ...head,
    available: true,
    symbol: input.symbol,
    strategy: input.strategy,
    type: quote.type,
    side,
    expiration: quote.expiration,
    dte: pick.dte,
    strike: quote.strike,
    contracts,
    limit,
    summary: `${long ? "Buy" : "Sell"} ${contracts} ${input.symbol} ${dayText(quote.expiration)} ${usd(quote.strike)} ${kind} at ${usd(limit)}`,
    metrics: metricsFor({
      strategy: input.strategy,
      spot: input.spot,
      strike: quote.strike,
      type: quote.type,
      iv: quote.iv,
      absDelta: pick.absDelta,
      days: pick.days,
      limit,
      contracts,
      equity: input.account.equity,
      ivRank: input.ivRank,
      rate: input.rate,
      ...(input.earnings && spansPrint(quote.expiration, input)
        ? {
            print: {
              start: input.earnings.start,
              days: Math.max(0, daysBetween(today, input.earnings.start)),
            },
          }
        : {}),
    }),
  };
}

/** Three sized options for one symbol and strategy — the whole engine. */
export function suggestTrades(input: SuggestionInputs): TradeSuggestions {
  const today = etDateOf(input.now);
  const expiries = expiriesByPreference(input, today);
  const [c, s, h] = TIER_RULES;
  return {
    symbol: input.symbol,
    strategy: input.strategy,
    asOf: input.now,
    spot: input.spot,
    atOpen: !input.sessionOpen,
    options: [
      optionFor(c, input, expiries, today),
      optionFor(s, input, expiries, today),
      optionFor(h, input, expiries, today),
    ],
    disclosure: `${STRATEGY_WORDS[input.strategy]} suggestions, paper trading only (${SIM_LABEL}). ${GUIDANCE_DISCLOSURE}`,
  };
}
