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
  SIM_LABEL,
  STRATEGY_WORDS,
  SUGGESTION_DTE,
  type SuggestionStrategy,
  type SuggestionTier,
  TIER_RULES,
  type TierRule,
  tierRuleText,
} from "./trade-suggestions-rules.js";

/**
 * SUGGESTED TRADES (#7547 slice 1) — a chain and an account in, exactly three sized options out
 * (conservative · standard · high risk), each a sell-to-open the trade form can prefill, each citing
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
  /** An expiry on or after the print window's start sells premium across earnings — excluded. */
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
  readonly side: "sell";
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

/** In the shared DTE window and before any print window; nearest the target first, then sooner. */
function expiriesByPreference(input: SuggestionInputs, today: string): string[] {
  const listed = [...new Set(input.chain.map((q) => q.expiration))];
  return listed
    .filter((e) => {
      const dte = daysBetween(today, e);
      const beforePrint = !input.earnings || e < input.earnings.start;
      return dte >= SUGGESTION_DTE.min && dte <= SUGGESTION_DTE.max && beforePrint;
    })
    .sort((a, b) => {
      const da = daysBetween(today, a);
      const db = daysBetween(today, b);
      return Math.abs(da - SUGGESTION_DTE.target) - Math.abs(db - SUGGESTION_DTE.target) || da - db;
    });
}

function candidatesAt(expiration: string, input: SuggestionInputs, today: string): Candidate[] {
  const type = input.strategy === "covered-call" ? "call" : "put";
  const { spot, account } = input;
  const days = daysToExpiryFrom(expiration, new Date(input.now)) ?? 1;
  return input.chain.flatMap((q) => {
    if (q.expiration !== expiration || q.type !== type) return [];
    const otm = type === "call" ? q.strike > spot : q.strike < spot;
    const aboveBasis =
      type === "put" || account.costBasis === undefined || q.strike >= account.costBasis;
    const quote = otm && aboveBasis ? tradable(q, input) : undefined;
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
 *  then farther out of the money, then the lower strike — a total order. */
function pickInBand(rows: readonly Candidate[], rule: TierRule): Candidate | undefined {
  const mid = (rule.delta.min + rule.delta.max) / 2;
  const fartherOtm = (a: Candidate, b: Candidate) =>
    a.quote.type === "call" ? b.quote.strike - a.quote.strike : a.quote.strike - b.quote.strike;
  return rows
    .filter((r) => round(r.absDelta) >= rule.delta.min && round(r.absDelta) <= rule.delta.max)
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
  const perContract = (strike - limit) * 100;
  const byCash = Math.floor(account.cash / (strike * 100) + 1e-9);
  const byRisk = Math.floor((rule.maxAccountAtRisk * account.equity) / perContract + 1e-9);
  if (byRisk < 1) {
    return {
      reason: `One contract at the ${usd(strike)} strike could lose ${usd(perContract)} (${pct(perContract / account.equity, 1)} of your account) if the stock went to zero; this tier caps that at ${pct(rule.maxAccountAtRisk)}.`,
    };
  }
  if (byCash < 1) {
    return {
      reason: `One contract at the ${usd(strike)} strike needs ${usd(strike * 100)} in cash to secure; you have ${usd(account.cash)}.`,
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
  let pick: Candidate | undefined;
  for (const expiration of expiries) {
    pick = pickInBand(candidatesAt(expiration, input, today), rule);
    if (pick) break;
  }
  if (!pick) {
    const why =
      expiries.length === 0
        ? `No expiry ${SUGGESTION_DTE.min}–${SUGGESTION_DTE.max} days out${input.earnings ? " before earnings" : ""} is listed.`
        : `No tradable strike sits at ${rule.delta.min.toFixed(2)}–${rule.delta.max.toFixed(2)} delta in the ${SUGGESTION_DTE.min}–${SUGGESTION_DTE.max} day window.`;
    return { ...head, available: false, reason: why };
  }
  const { quote } = pick;
  const limit = priceInside(
    { low: quote.bid, high: quote.ask },
    "sell",
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
    side: "sell",
    expiration: quote.expiration,
    dte: pick.dte,
    strike: quote.strike,
    contracts,
    limit,
    summary: `Sell ${contracts} ${input.symbol} ${dayText(quote.expiration)} ${usd(quote.strike)} ${kind} at ${usd(limit)}`,
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
