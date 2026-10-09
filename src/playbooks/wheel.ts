import {
  type EarningsPrint,
  optionPrintBlackout,
  type PrintBlackout,
} from "../domain/earnings-calendar.js";
import { daysBetween, sessionsBefore } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { type OptionBook, optionBook } from "../domain/option-book.js";
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
  eligibleExpirations,
  OPEN_TOWARD_NATURAL,
  pickByDelta,
  priceInside,
  singleLegTick,
} from "../options/contract-picker.js";
import { MAX_SHORT_DELTA } from "../options/position-guidance-rules.js";
import {
  humanizeOptionSymbol,
  OPTION_MULTIPLIER,
  occStrikeLabel,
} from "../trading/option-symbols.js";
import { optionOpenIntent } from "./option-intent.js";
import { type PairEvidence, pairFor } from "./pair-table.js";
import type { Playbook } from "./playbook.js";

/**
 * THE WHEEL (#4642 slice 5; a template on a ticker since #4469 slice 2c) — sell one cash-secured
 * put about a month out; if the ticker finishes below the strike the put is assigned and the bot
 * owns 100 shares, so it sells one covered call on them until they are called away; then it starts
 * again. One contract at a time, whatever the budget. `CRWV-WHEEL` (registry.ts) is one call of
 * `wheel`.
 *
 * IT TRADES ON A VERDICT, AND SAYS WHICH ONE ON EVERY ORDER. The pair row (`pair-table.ts`) is
 * the one source of the evidence the orders state: its status picks the framing (the owner's
 * conviction, or the house's research), its study is the citation, and its dated test — a
 * conviction's check date, a ✓ verdict's shelf date — is the date in the retire rule each order
 * carries. A pair with neither verdict has no business selling puts, so the template refuses to
 * build one (criterion 1; code, not copy, enforces what a ticker needs — the plan's call 4).
 * What the study found about the ticker is the setting's to say: a claim true of CRWV must never
 * read as a claim about the wheel.
 *
 * STATE COMES FROM THE POSITIONS ALONE (`wheelPhase`) — nothing is persisted, so an early
 * assignment, a partial lot or a restart reads correctly on the next cycle. It never closes or
 * rolls in this version: puts and calls are held into expiry (`holdsShortToExpiry`), and expiry
 * hygiene still closes them if the wheel is paused or a print moves under one.
 *
 * Every open must clear the ticker's next print blackout (window + the session after — the move
 * lands the next session): the expiry is the LATEST listed 30–45 days out that ends before it.
 * Assigned shares are the honest exception — they ride a print when no print-clean call exists,
 * which is why the Store card names owning a falling stock as the real loss.
 */

/** Days to expiry the wheel sells — about a month: enough premium to be worth the collateral,
 *  short enough to fit between a ticker's prints. */
const MIN_DTE = 30;
const MAX_DTE = 45;

/** One ticker's wheel. Its id, verdict, study and dated test come from the pair row, never from
 *  here; these are the words only the ticker's own study can supply. */
export interface WheelSetting {
  readonly symbol: string;
  readonly thesis: string;
  /** What the study measured, said on the descriptor between its citation and the retire rule. */
  readonly findings: string;
  /** What the study found, said on every put after its framing ("our study found CRWV's option
   *  premium underpays its moves"). */
  readonly studySays: string;
}

/** The strategy tag a wheel order carries on its decision record — `crwv-wheel-put`. One definition,
 *  so the conviction check can find a pair's sold puts by the tag they were stamped with. */
export const wheelStrategyTag = (symbol: string, type: "put" | "call"): string =>
  `${symbol.toLowerCase()}-wheel-${type}`;

/** What the helpers below read: the ticker, and the words its pair row settles. */
interface Wheel {
  readonly symbol: string;
  /** "Run on its owner's conviction — <studySays>." */
  readonly basis: string;
  /** The falsifier, stated on every order so the record can grade the play by it. */
  readonly retireRule: string;
}

/** The wheel's retire test (criterion 12) on the pair's dated check. */
const retireTest = (date: string): string =>
  `net P/L is below 0 on ${date} or more than 1 in 3 sold puts finish in the money`;

/** How the pair's verdict frames the sale, and the date its retire rule is checked on — or a
 *  refusal naming what the row lacks. */
function verdictOf(evidence: PairEvidence): { framing: string; date: string } | string {
  if (evidence.status === "conviction") {
    return evidence.checkOn
      ? { framing: "Run on its owner's conviction", date: evidence.checkOn }
      : "a conviction with no check date";
  }
  if (evidence.status === "researched") {
    return evidence.shelfOn
      ? { framing: "Run on the house's research", date: evidence.shelfOn }
      : "a verdict with no shelf date";
  }
  return `no verdict (${evidence.status})`;
}

/** |delta| of the strike sold, by mode — roughly the market's odds it finishes in the money. These
 *  are targets: the pick may sit up to `DELTA_MISS` from one, and never above `MAX_SHORT_DELTA`
 *  (0.30, the house ceiling on a sold option), so aggressive calls aim at the ceiling itself. */
export const WHEEL_DELTAS: Readonly<Record<PlaybookMode, { put: number; call: number }>> = {
  conservative: { put: 0.15, call: 0.2 },
  standard: { put: 0.2, call: 0.25 },
  aggressive: { put: 0.25, call: 0.3 },
};

/** How far the sold strike's |delta| may sit from the mode's target. Wide quotes (CRWV's) can leave
 *  only near-the-money strikes tradeable; selling one of those would be a coin flip, not the
 *  "1-in-5" the Store card states, so the wheel sells nothing that cycle instead. */
const DELTA_MISS = 0.05;

/**
 * Where the wheel is, read off the ticker's positions:
 *   foreign   — a long contract on the ticker or short shares: not the wheel's book; it does nothing
 *               (hygiene closes the contract before expiry);
 *   put-open  — a sold put is out: hold it into expiry, assignment intended;
 *   assigned  — 100+ shares not already written on: sell one covered call;
 *   call-open — the shares are all written on: hold, call-away intended;
 *   flat      — sell one cash-secured put.
 */
export type WheelPhase = "foreign" | "put-open" | "assigned" | "call-open" | "flat";

export function wheelPhase(book: OptionBook): WheelPhase {
  // Short shares are not something the wheel ever creates; treat them like a long contract.
  if (book.shares < 0 || book.contracts.some((c) => c.quantity > 0)) return "foreign";
  const shorts = book.contracts.filter((c) => c.quantity < 0);
  if (shorts.some((c) => c.type === "put")) return "put-open";
  // With no long contract on the book, every sold call is uncapped and holds 100 shares.
  const callsOut = shorts.reduce((n, c) => n - c.quantity, 0);
  if (Math.floor((book.shares - OPTION_MULTIPLIER * callsOut) / OPTION_MULTIPLIER) >= 1) {
    return "assigned";
  }
  return callsOut > 0 ? "call-open" : "flat";
}

/** The blackout the next sale must clear — or `undefined` when nothing may be sold: no print on
 *  file, today inside the blackout, or no expiry 30+ days out can end before it. An expiry is
 *  always a session, so the latest one that can is the last session before the blackout. */
function saleWindow(
  symbol: string,
  asOfIso: string,
  calendar: readonly EarningsPrint[],
): PrintBlackout | undefined {
  const blackout = optionPrintBlackout(symbol, asOfIso, calendar);
  if (!blackout) return undefined;
  const today = marketDayKey(asOfIso);
  if (today >= blackout.start) return undefined;
  return daysBetween(today, sessionsBefore(blackout.start, 1)) >= MIN_DTE ? blackout : undefined;
}

interface WheelSale {
  readonly phase: "flat" | "assigned";
  readonly type: "put" | "call";
  readonly expiration: string;
  readonly blackout: PrintBlackout;
}

/** What this cycle would sell, if anything — the one answer `optionDemand` and `decide` share. */
function nextSale(
  symbol: string,
  asOfIso: string,
  portfolio: Portfolio,
  listed: readonly string[],
  calendar: readonly EarningsPrint[],
): WheelSale | undefined {
  const phase = wheelPhase(optionBook(portfolio, symbol));
  if (phase !== "flat" && phase !== "assigned") return undefined;
  const blackout = saleWindow(symbol, asOfIso, calendar);
  if (!blackout) return undefined;
  const expiration = eligibleExpirations(listed, marketDayKey(asOfIso), {
    minDte: MIN_DTE,
    maxDte: MAX_DTE,
    before: blackout.start,
  }).at(-1);
  if (!expiration) return undefined;
  return { phase, type: phase === "flat" ? "put" : "call", expiration, blackout };
}

const cents = (x: number): string => `$${x.toFixed(2)}`;

/** The words and the forecast for one sale — a put or a call, honest about what assignment means. */
function saleText(
  wheel: Wheel,
  sale: WheelSale,
  occSymbol: string,
  strike: number,
  premium: number,
  shareCost: number | undefined,
): Pick<OrderIntent, "reason" | "expectation" | "forecast"> {
  const { symbol, retireRule } = wheel;
  const name = humanizeOptionSymbol(occSymbol);
  const k = occStrikeLabel(strike);
  const paid = `${cents(premium)} a share ($${Math.round(premium * OPTION_MULTIPLIER)} for the contract)`;
  if (sale.type === "put") {
    const collateral = (strike * OPTION_MULTIPLIER).toLocaleString("en-US");
    return {
      reason:
        `Selling one cash-secured ${name} for about ${paid}: $${collateral} stays ` +
        `set aside in case ${symbol} finishes below ${k} and the shares are put to the bot. ` +
        wheel.basis,
      expectation:
        `${symbol} stays above ${k} to ${sale.expiration}: the put expires and the premium is kept. Below ` +
        `it, the bot buys 100 shares at ${k} and sells covered calls on them next.`,
      forecast: {
        direction: "up",
        invalidator: `${symbol} settles below ${k} on ${sale.expiration} — the wheel buys 100 shares at ${k}; ${retireRule}`,
      },
    };
  }
  const cost = shareCost === undefined ? "cost" : `${cents(shareCost)} cost`;
  return {
    reason:
      `Selling one covered ${name} for about ${paid} against 100 ${symbol} shares ` +
      `the bot owns: if ${symbol} finishes above ${k} the shares are sold at ${k}, at or above their ${cost}.`,
    expectation:
      `${symbol} stays below ${k} to ${sale.expiration}: the call expires, the premium is kept and the ` +
      `shares stay for the next call. Above it, they are called away at ${k}.`,
    forecast: {
      direction: "up",
      invalidator: `${symbol} settles below the shares' ${cost} on ${sale.expiration} — the call expires and the shares are underwater; ${retireRule}`,
    },
  };
}

/** One sale, priced inside its quote — or nothing, when no strike is liquid and in bounds. */
function wheelIntents(
  wheel: Wheel,
  context: MarketContext,
  portfolio: Portfolio,
  calendar: readonly EarningsPrint[],
  mode: PlaybookMode,
): OrderIntent[] {
  const { symbol } = wheel;
  const listed = context.options?.listed[symbol] ?? [];
  const sale = nextSale(symbol, context.asOf, portfolio, listed, calendar);
  const spot = context.quotes[symbol]?.last;
  if (!(sale && spot !== undefined && spot > 0)) return [];
  const { shareCost } = optionBook(portfolio, symbol);
  const target = WHEEL_DELTAS[mode][sale.type];
  // A call is struck at or above what the shares cost, so being called away never locks in a loss;
  // the picker keeps it above spot (out of the money) too.
  const bounds = {
    ...(sale.type === "call" ? { minStrike: Math.max(shareCost ?? 0, spot) } : {}),
    maxDeltaMiss: DELTA_MISS,
    maxAbsDelta: MAX_SHORT_DELTA,
  };
  const rows = chainQuotes(context.options, symbol, sale.expiration, sale.type);
  const pick = pickByDelta(rows, target, spot, context.asOf, bounds);
  if (!pick) return [];
  const { bid, ask, quotedAt } = pick.quote;
  if (bid === undefined || ask === undefined || quotedAt === undefined) return [];
  const towardNatural = OPEN_TOWARD_NATURAL[mode];
  const limitPrice = priceInside(
    { low: bid, high: ask },
    "sell",
    towardNatural,
    singleLegTick(bid, ask),
  );
  if (limitPrice === undefined) return [];
  const intent = optionOpenIntent({
    underlying: symbol,
    structure: sale.type === "put" ? "cash-secured-put" : "covered-call",
    legs: [{ occSymbol: pick.quote.occSymbol, side: "sell" }],
    limitPrice,
    band: { low: bid, high: ask, at: quotedAt },
    assignment: "intended",
    strategy: wheelStrategyTag(symbol, sale.type),
    ...saleText(wheel, sale, pick.quote.occSymbol, pick.quote.strike, limitPrice, shareCost),
    selection: {
      rule: `wheel-${sale.type}-by-delta`,
      phase: sale.phase,
      spot,
      dte: daysBetween(marketDayKey(context.asOf), sale.expiration),
      targetDelta: target,
      pickedDelta: pick.absDelta,
      deltaSource: pick.deltaSource,
      expiryBefore: sale.blackout.start,
      candidates: pick.candidates,
      towardNatural,
    },
  });
  return intent ? [intent] : [];
}

/** The wheel on one ticker — `CRWV-WHEEL` is one call of this. Its id and verdict are looked up in
 *  the pair table; a ticker with no wheel row, or a row with no dated verdict, throws (criteria 1
 *  and 8). `lookup` is the table's `pairFor`, a seam so a spec can offer a row the real table does
 *  not carry yet. */
export function wheel(setting: WheelSetting, lookup: typeof pairFor = pairFor): Playbook {
  // Quotes, positions and chains key on the upper-case ticker; a lower-case one would never trade.
  const symbol = setting.symbol.toUpperCase();
  const pair = lookup("wheel", symbol);
  if (!pair) throw new Error(`no pair-table row for wheel × ${symbol}; add its evidence row first`);
  const verdict = verdictOf(pair.evidence);
  const { study } = pair.evidence;
  if (typeof verdict === "string" || !study) {
    const lacks = typeof verdict === "string" ? verdict : "no study to cite";
    throw new Error(`wheel × ${symbol} cannot sell puts on ${lacks}`);
  }
  const spec: Wheel = {
    symbol,
    basis: `${verdict.framing} — ${setting.studySays}.`,
    retireRule: `the play retires if its ${retireTest(verdict.date)}`,
  };
  return {
    id: pair.id,
    symbols: [symbol],
    thesis: setting.thesis,
    evidence: `${study} — ${setting.findings} Retires if ${retireTest(verdict.date)}.`,
    // Unused, as on HC-SAURON: the wheel is sized by its Store allocation, one contract at a time.
    size: { conservative: 0, standard: 0, aggressive: 0 },
    keyedOn: "earnings",
    options: { underlyings: [symbol], holdsShortToExpiry: ["put", "call"], requiredLevel: 1 },
    // The verdict is the sale window alone; what the wheel sells inside it depends on the book.
    desiredState: (asOfIso, calendar) =>
      saleWindow(symbol, asOfIso, calendar) ? "long" : "no-window",
    optionDemand(
      asOfIso: string,
      portfolio: Portfolio,
      listed: ListedExpirations,
      calendar: readonly EarningsPrint[],
    ): OptionDemand {
      const sale = nextSale(symbol, asOfIso, portfolio, listed[symbol] ?? [], calendar);
      return sale
        ? {
            chains: [{ underlying: symbol, expiration: sale.expiration, type: sale.type }],
            contracts: [],
          }
        : NO_OPTION_DEMAND;
    },
    decide: (context, portfolio, calendar, mode) =>
      wheelIntents(spec, context, portfolio, calendar, mode),
  };
}
