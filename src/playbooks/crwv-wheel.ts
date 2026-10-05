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
import {
  humanizeOptionSymbol,
  OPTION_MULTIPLIER,
  occStrikeLabel,
} from "../trading/option-symbols.js";
import { optionOpenIntent } from "./option-intent.js";
import type { Playbook } from "./playbook.js";

/**
 * CRWV-WHEEL (#4642 slice 5) — the wheel on CRWV: sell one cash-secured put about a month out; if
 * CRWV finishes below the strike the put is assigned and the bot owns 100 shares, so it sells one
 * covered call on them until they are called away; then it starts again.
 *
 * IT RUNS AGAINST OUR OWN STUDY, ON PURPOSE. `docs/research/crwv-premium-fit.md` found CRWV's
 * option premium underpays its moves (implied 69.9% vs a median 88.7% realized; Δ0.20 puts priced
 * 19.4% to assign against 33.3% delivered) and called "stand aside". The play exists because its
 * owner holds the opposite conviction, so it carries the study's numbers and a dated falsifier on
 * every order rather than pretending to an edge: it retires if its net P/L is below 0 on
 * 2027-01-29, or if more than 1 in 3 of its sold puts finish in the money.
 *
 * STATE COMES FROM THE POSITIONS ALONE (`wheelPhase`) — nothing is persisted, so an early
 * assignment, a partial lot or a restart reads correctly on the next cycle. It never closes or
 * rolls in this version: puts and calls are held into expiry (`holdsShortToExpiry`), and expiry
 * hygiene still closes them if the wheel is paused or a print moves under one.
 *
 * Every open must clear CRWV's next print blackout (window + the session after — CRWV's move lands
 * the next session): the expiry is the LATEST listed 30–45 days out that ends before it. Assigned
 * shares are the honest exception — they ride a print when no print-clean call exists, which is
 * why the Store card names owning a falling stock as the real loss.
 */

const WHEEL_SYMBOL = "CRWV";
/** Days to expiry the wheel sells — about a month: enough premium to be worth the collateral,
 *  short enough to fit between CRWV's prints. */
const MIN_DTE = 30;
const MAX_DTE = 45;
/** The falsifier, stated on every order so the record can grade the play by it. */
const RETIRE_RULE =
  "the play retires if its net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money";

/** |delta| of the strike sold, by mode — roughly the market's odds it finishes in the money. Calls
 *  stop at 0.30, the house ceiling on a short option's delta. */
export const WHEEL_DELTAS: Readonly<Record<PlaybookMode, { put: number; call: number }>> = {
  conservative: { put: 0.15, call: 0.2 },
  standard: { put: 0.2, call: 0.25 },
  aggressive: { put: 0.25, call: 0.3 },
};

/**
 * Where the wheel is, read off CRWV's positions:
 *   foreign   — a long CRWV contract or short shares: not the wheel's book; it does nothing
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
  asOfIso: string,
  calendar: readonly EarningsPrint[],
): PrintBlackout | undefined {
  const blackout = optionPrintBlackout(WHEEL_SYMBOL, asOfIso, calendar);
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
  asOfIso: string,
  portfolio: Portfolio,
  listed: readonly string[],
  calendar: readonly EarningsPrint[],
): WheelSale | undefined {
  const phase = wheelPhase(optionBook(portfolio, WHEEL_SYMBOL));
  if (phase !== "flat" && phase !== "assigned") return undefined;
  const blackout = saleWindow(asOfIso, calendar);
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
  sale: WheelSale,
  occSymbol: string,
  strike: number,
  premium: number,
  shareCost: number | undefined,
): Pick<OrderIntent, "reason" | "expectation" | "forecast"> {
  const name = humanizeOptionSymbol(occSymbol);
  const k = occStrikeLabel(strike);
  const paid = `${cents(premium)} a share ($${Math.round(premium * OPTION_MULTIPLIER)} for the contract)`;
  if (sale.type === "put") {
    const collateral = (strike * OPTION_MULTIPLIER).toLocaleString("en-US");
    return {
      reason:
        `Selling one cash-secured ${name} for about ${paid}: $${collateral} stays ` +
        `set aside in case CRWV finishes below ${k} and the shares are put to the bot. Run on its ` +
        "owner's conviction — our study found CRWV's option premium underpays its moves.",
      expectation:
        `CRWV stays above ${k} to ${sale.expiration}: the put expires and the premium is kept. Below ` +
        `it, the bot buys 100 shares at ${k} and sells covered calls on them next.`,
      forecast: {
        direction: "up",
        invalidator: `CRWV settles below ${k} on ${sale.expiration} — the wheel buys 100 shares at ${k}; ${RETIRE_RULE}`,
      },
    };
  }
  const cost = shareCost === undefined ? "cost" : `${cents(shareCost)} cost`;
  return {
    reason:
      `Selling one covered ${name} for about ${paid} against 100 CRWV shares ` +
      `the bot owns: if CRWV finishes above ${k} the shares are sold at ${k}, at or above their ${cost}.`,
    expectation:
      `CRWV stays below ${k} to ${sale.expiration}: the call expires, the premium is kept and the ` +
      `shares stay for the next call. Above it, they are called away at ${k}.`,
    forecast: {
      direction: "up",
      invalidator: `CRWV settles below the shares' ${cost} on ${sale.expiration} — the call expires and the shares are underwater; ${RETIRE_RULE}`,
    },
  };
}

/** One sale, priced inside its quote — or nothing, when no strike is liquid and in bounds. */
function wheelIntents(
  context: MarketContext,
  portfolio: Portfolio,
  calendar: readonly EarningsPrint[],
  mode: PlaybookMode,
): OrderIntent[] {
  const listed = context.options?.listed[WHEEL_SYMBOL] ?? [];
  const sale = nextSale(context.asOf, portfolio, listed, calendar);
  const spot = context.quotes[WHEEL_SYMBOL]?.last;
  if (!(sale && spot !== undefined && spot > 0)) return [];
  const { shareCost } = optionBook(portfolio, WHEEL_SYMBOL);
  const target = WHEEL_DELTAS[mode][sale.type];
  // A call is struck at or above what the shares cost, so being called away never locks in a loss;
  // the picker keeps it above spot (out of the money) too.
  const bounds = sale.type === "call" ? { minStrike: Math.max(shareCost ?? 0, spot) } : {};
  const rows = chainQuotes(context.options, WHEEL_SYMBOL, sale.expiration, sale.type);
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
    underlying: WHEEL_SYMBOL,
    structure: sale.type === "put" ? "cash-secured-put" : "covered-call",
    legs: [{ occSymbol: pick.quote.occSymbol, side: "sell" }],
    limitPrice,
    band: { low: bid, high: ask, at: quotedAt },
    assignment: "intended",
    strategy: `crwv-wheel-${sale.type}`,
    ...saleText(sale, pick.quote.occSymbol, pick.quote.strike, limitPrice, shareCost),
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

export const CRWV_WHEEL: Playbook = {
  id: "CRWV-WHEEL",
  symbols: [WHEEL_SYMBOL],
  thesis:
    "Sell a cash-secured CRWV put about a month out; if assigned, sell covered calls on the shares " +
    "— run on its owner's conviction, against our own study of CRWV's premium.",
  evidence:
    "docs/research/crwv-premium-fit.md — AGAINST this play: implied 69.9% vs a median 88.7% " +
    "realized (6th percentile); Δ0.20 puts priced 19.4% to assign vs 33.3% delivered. Retires if " +
    "net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money.",
  // Unused, as on HC-SAURON: the wheel is sized by its Store allocation, one contract at a time.
  size: { conservative: 0, standard: 0, aggressive: 0 },
  keyedOn: "earnings",
  options: { underlyings: [WHEEL_SYMBOL], holdsShortToExpiry: ["put", "call"], requiredLevel: 1 },
  // The verdict is the sale window alone; what the wheel sells inside it depends on the book.
  desiredState: (asOfIso, calendar) => (saleWindow(asOfIso, calendar) ? "long" : "no-window"),
  optionDemand(
    asOfIso: string,
    portfolio: Portfolio,
    listed: ListedExpirations,
    calendar: readonly EarningsPrint[],
  ): OptionDemand {
    const sale = nextSale(asOfIso, portfolio, listed[WHEEL_SYMBOL] ?? [], calendar);
    return sale
      ? {
          chains: [{ underlying: WHEEL_SYMBOL, expiration: sale.expiration, type: sale.type }],
          contracts: [],
        }
      : NO_OPTION_DEMAND;
  },
  decide: wheelIntents,
};
