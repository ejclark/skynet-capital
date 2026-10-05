import {
  type EarningsPrint,
  etTimeOf,
  nextPrintRisk,
  optionPrintBlackout,
  type PrintBlackout,
  recentPrint,
} from "../domain/earnings-calendar.js";
import { daysBetween, sessionsBefore, sessionsBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import {
  type HeldContract,
  type OptionBook,
  optionBook,
  quoteBand,
} from "../domain/option-book.js";
import {
  type ListedExpirations,
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionDemand,
  type OptionOrderIntent,
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
} from "../options/contract-picker.js";
import { DAYS_PER_YEAR, impliedVolatility } from "../options/pricing.js";
import { OPTION_MULTIPLIER, occExpiryLabel, occStrikeLabel } from "../trading/option-symbols.js";
import { type OptionLegSpec, optionCloseIntent, optionOpenIntent } from "./option-intent.js";
import { type Playbook, POST_PRINT_FLAT_DAYS } from "./playbook.js";

/**
 * NVDA-CALL-SPREAD (#4642 slice 6) — S1-NVDA's pre-earnings run-up as a call debit spread: buy one
 * NVDA call near the money (delta 0.50), sell one higher call on the same expiry, and pay the
 * difference. The most it can lose is that debit; the most it can make is the gap between the
 * strikes, less the debit. `docs/research/nvda-earnings-cycle.md` F1–F2: the 20 sessions into a
 * print rise, and the last five are a coin flip — so it is long from D-20 to D-6 and out at D-5.
 *
 * The window counts TRADING SESSIONS back from the print (D-20 = 2026-10-21 for an 11-18 print;
 * D-5 = 11-11, Veterans Day trades), and opens only on a CONFIRMED date — the same date policy as
 * S1-NVDA. An estimate opens nothing, and a spread held when the date stops being confirmed closes.
 *
 * The expiry is the latest listed one after D-5 and before the print blackout, so the spread
 * outlives the exit day and never spans the print (11-13 for an 11-18 print); with none, no trade.
 * The close goes out as one two-leg order whose price walks from mid toward the natural side over
 * the sessions since D-5 (`closeAggression`) — at once at natural after a print. Expiry hygiene's
 * T-2 close is the backstop, and for an 11-13 expiry it falls on D-5 itself.
 *
 * It is the one playbook that declares `derivesFrom`: its edge IS S1-NVDA's, and while it is
 * subscribed it owns NVDA on that bot, so S1-NVDA stops trading NVDA shares there.
 */

const SPREAD_SYMBOL = "NVDA";
/** The long leg sits at the money: it carries the run-up's direction. It may sit up to
 *  `LONG_DELTA_MISS` either side — a deep in-the-money long is a costlier stock substitute, not the
 *  spread the Store card describes, so with none that close the play opens nothing. */
const LONG_DELTA = 0.5;
const LONG_DELTA_MISS = 0.1;
/** How far the short leg's |delta| may sit from the mode's target: a strike just above the long
 *  makes a spread too narrow to carry the run-up. */
const SHORT_DELTA_MISS = 0.05;
/** The short leg's |delta| by mode — lower sells a farther strike: a wider spread, a bigger debit. */
export const SPREAD_SHORT_DELTA: Readonly<Record<PlaybookMode, number>> = {
  conservative: 0.3,
  standard: 0.25,
  aggressive: 0.2,
};
/** Sessions before the print the window opens (D-20) and closes (D-5). */
const ENTRY_SESSIONS = 20;
const EXIT_SESSIONS = 5;
/** A close after the print goes straight to the natural side: there is no window left to wait in. */
const AFTER_PRINT_LATENESS = 2;
/** A vertical's net prices in cents. */
const NET_TICK = 0.01;

/** Why the window is where it is — a close prices off the why. */
type WindowCause = "open" | "dead-week" | "after-print" | "before-window" | "unconfirmed";

interface SpreadRead {
  readonly state: "long" | "flat" | "no-window";
  readonly cause: WindowCause;
  /** The confirmed print the sessions are counted back from, when there is one. */
  readonly print?: EarningsPrint;
}

function readWindow(asOfIso: string, calendar: readonly EarningsPrint[]): SpreadRead {
  if (recentPrint(SPREAD_SYMBOL, asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
    return { state: "flat", cause: "after-print" };
  }
  const print = nextPrintRisk(SPREAD_SYMBOL, asOfIso, calendar);
  // Date policy: an estimate never keys an entry, and a spread already held exits.
  if (print?.status !== "confirmed") return { state: "no-window", cause: "unconfirmed" };
  const today = marketDayKey(asOfIso);
  if (today >= sessionsBefore(print.date, EXIT_SESSIONS)) {
    return { state: "flat", cause: "dead-week", print };
  }
  if (today >= sessionsBefore(print.date, ENTRY_SESSIONS)) {
    return { state: "long", cause: "open", print };
  }
  return { state: "no-window", cause: "before-window", print };
}

/** The window in trading sessions: long D-20..D-6 on a confirmed date, flat from D-5 and for a few
 *  days after a print, otherwise no window. */
export function spreadWindow(
  asOfIso: string,
  calendar: readonly EarningsPrint[],
): "long" | "flat" | "no-window" {
  return readWindow(asOfIso, calendar).state;
}

/** What NVDA contracts the bot holds: none; exactly one debit call spread (the long call below the
 *  short, same expiry, equal size); or anything else, which this playbook leaves alone.
 *
 *  A vertical is read as the play's own whoever placed it — positions carry no record of their
 *  opener, and narrowing by expiry would drop the play's own spread when NVIDIA moves its date
 *  earlier (it must still sell that one back). The Store card says so. */
export type SpreadShape =
  | { readonly kind: "none" }
  | {
      readonly kind: "vertical";
      readonly long: HeldContract;
      readonly short: HeldContract;
      readonly quantity: number;
    }
  | { readonly kind: "foreign" };

export function spreadShape(book: OptionBook): SpreadShape {
  const [a, b, ...rest] = book.contracts;
  if (!a) return { kind: "none" };
  if (!b || rest.length > 0) return { kind: "foreign" };
  const [long, short] = a.quantity > 0 ? [a, b] : [b, a];
  const vertical =
    long.quantity > 0 &&
    long.quantity === -short.quantity &&
    long.type === "call" &&
    short.type === "call" &&
    long.expiration === short.expiration &&
    long.strike < short.strike;
  return vertical
    ? { kind: "vertical", long, short, quantity: long.quantity }
    : { kind: "foreign" };
}

interface SpreadEntry {
  readonly print: EarningsPrint;
  readonly blackout: PrintBlackout;
  readonly exitDay: string;
  readonly expiration: string;
}

/** Where a new spread would go — the latest expiry after D-5 and before the print blackout — or
 *  `undefined` when the window is shut or no listed expiry fits. */
function entryFor(
  asOfIso: string,
  read: SpreadRead,
  listed: readonly string[],
  calendar: readonly EarningsPrint[],
): SpreadEntry | undefined {
  const blackout = optionPrintBlackout(SPREAD_SYMBOL, asOfIso, calendar);
  if (!(read.state === "long" && read.print && blackout)) return undefined;
  const exitDay = sessionsBefore(read.print.date, EXIT_SESSIONS);
  const expiration = eligibleExpirations(listed, marketDayKey(asOfIso), {
    after: exitDay,
    before: blackout.start,
  }).at(-1);
  return expiration ? { print: read.print, blackout, exitDay, expiration } : undefined;
}

const dollars = (x: number): string => `$${x.toFixed(2)}`;

/** The net quote for two legs in Alpaca's signed net (+ debit, − credit), with the oldest stamp
 *  among them — the feed's when every leg has one, else when this process read them. */
function netQuote(
  legs: readonly OptionLegSpec[],
  effect: OptionOrderIntent["effect"],
  context: MarketContext,
): { readonly low: number; readonly high: number; readonly at?: string } | undefined {
  const contracts = context.options?.contracts ?? {};
  const draft: OptionOrderIntent = {
    effect,
    structure: effect === "open" ? "call-debit-spread" : "close",
    legs: legs.map((l) => ({ ...l, ratio: 1 })),
    limitPrice: 1,
  };
  const band = quoteBand(draft, contracts);
  if (!band) return undefined;
  const read = legs.map((l) => contracts[l.occSymbol]?.fetchedAt ?? "").sort()[0];
  return { low: band.low, high: band.high, ...(band.at || read ? { at: band.at ?? read } : {}) };
}

const spreadName = (expiration: string, low: number, high: number): string =>
  `NVDA ${occStrikeLabel(low)}/${occStrikeLabel(high)} call spread · ${occExpiryLabel(expiration)}`;

/** One debit spread at the mode's short delta, priced inside the net quote — or nothing. */
function openIntent(context: MarketContext, entry: SpreadEntry, mode: PlaybookMode): OrderIntent[] {
  const spot = context.quotes[SPREAD_SYMBOL]?.last;
  if (!(spot !== undefined && spot > 0)) return [];
  const calls = chainQuotes(context.options, SPREAD_SYMBOL, entry.expiration, "call");
  const long = pickByDelta(calls, LONG_DELTA, spot, context.asOf, {
    otm: false,
    maxDeltaMiss: LONG_DELTA_MISS,
  });
  if (!long) return [];
  const higher = calls.filter((q) => q.strike > long.quote.strike);
  const target = SPREAD_SHORT_DELTA[mode];
  const short = pickByDelta(higher, target, spot, context.asOf, {
    otm: false,
    maxDeltaMiss: SHORT_DELTA_MISS,
  });
  if (!short) return [];
  const legs: OptionLegSpec[] = [
    { occSymbol: long.quote.occSymbol, side: "buy" },
    { occSymbol: short.quote.occSymbol, side: "sell" },
  ];
  const quoted = netQuote(legs, "open", context);
  // A debit spread never prices at or below a cent: the floor keeps the limit a real debit.
  if (!(quoted?.at && quoted.high > NET_TICK)) return [];
  const band = { low: Math.max(NET_TICK, quoted.low), high: quoted.high, at: quoted.at };
  const towardNatural = OPEN_TOWARD_NATURAL[mode];
  const limitPrice = priceInside(band, "buy", towardNatural, NET_TICK);
  if (limitPrice === undefined) return [];

  const today = marketDayKey(context.asOf);
  const dte = Math.max(1, daysBetween(today, entry.expiration));
  const k1 = long.quote.strike;
  const k2 = short.quote.strike;
  const name = spreadName(entry.expiration, k1, k2);
  const debit = Math.round(limitPrice * OPTION_MULTIPLIER);
  const width = Math.round((k2 - k1) * OPTION_MULTIPLIER);
  // The +1σ cross-check: how far a one-standard-deviation rise reaches by expiry, priced off the
  // long call's own implied volatility — read beside the short strike, not used to pick it.
  const mid = ((long.quote.bid ?? 0) + (long.quote.ask ?? 0)) / 2;
  const sigma = impliedVolatility({
    spot,
    strike: k1,
    daysToExpiry: dte,
    type: "call",
    marketPrice: mid,
  });
  const reach =
    sigma === undefined ? undefined : spot * Math.exp(sigma * Math.sqrt(dte / DAYS_PER_YEAR));
  const oneSigma =
    reach === undefined
      ? ""
      : " A one-standard-deviation rise by expiry, priced off the long call's implied " +
        `volatility, reaches about ${dollars(reach)}.`;
  const intent = optionOpenIntent({
    underlying: SPREAD_SYMBOL,
    structure: "call-debit-spread",
    legs,
    limitPrice,
    band,
    strategy: "nvda-spread-open",
    reason:
      `Buying one ${name} for about ${dollars(limitPrice)} a share — the options form of ` +
      `S1-NVDA's pre-earnings run-up. The most it can lose is that $${debit} debit. NVIDIA ` +
      `confirmed its ${entry.print.date} print; the spread is sold back by ${entry.exitDay}, five ` +
      "sessions before.",
    expectation:
      `NVDA keeps rising into the print: above ${occStrikeLabel(k2)} at expiry the spread is worth ` +
      `$${width.toLocaleString("en-US")}. It is sold back by ${entry.exitDay} whatever it is worth then.${oneSigma}`,
    forecast: {
      direction: "up",
      invalidator:
        "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost",
    },
    selection: {
      rule: "spread-by-delta",
      phase: "open",
      spot,
      dte,
      targetDelta: target,
      pickedDelta: short.absDelta,
      deltaSource: long.deltaSource === "feed" && short.deltaSource === "feed" ? "feed" : "model",
      expiryBefore: entry.blackout.start,
      candidates: short.candidates,
      towardNatural,
    },
  });
  return intent ? [intent] : [];
}

const CLOSE_WHY: Readonly<Record<Exclude<WindowCause, "open">, string>> = {
  "dead-week":
    "it is within five sessions of the print, when the run-up has historically been spent",
  "after-print": "NVIDIA has reported, and this spread is never meant to hold a print",
  unconfirmed:
    "NVDA's next print date is not confirmed, so the run-up window it trades has no date",
  "before-window": "its D-20 to D-6 window is not open on the confirmed date",
};

/** Sessions late, for the close's aggression: from D-5 in the dead week, natural after a print,
 *  mid when the window shut for any other reason. */
function lateness(read: SpreadRead, today: string): number {
  if (read.cause === "after-print") return AFTER_PRINT_LATENESS;
  if (read.cause === "dead-week" && read.print) {
    return sessionsBetween(sessionsBefore(read.print.date, EXIT_SESSIONS), today);
  }
  return 0;
}

/** How the close is priced, and what happens to that price if it does not fill. */
function closeExpectation(cause: Exclude<WindowCause, "open">, towardNatural: number): string {
  const priced =
    towardNatural === 0
      ? "Priced at mid"
      : towardNatural === 1
        ? "Priced at the natural side"
        : `Priced ${Math.round(towardNatural * 100)}% of the way from mid to the natural side`;
  if (cause === "dead-week") return `${priced}; each session past D-5 moves it closer to natural.`;
  if (cause === "after-print") return `${priced}: the print has passed, so it waits for nothing.`;
  return (
    `${priced}, leaning toward natural through the afternoon; expiry hygiene closes it two ` +
    "sessions before expiry if it is still held."
  );
}

/** The held spread back as one two-leg order, priced inside the net quote — or nothing without one
 *  (hygiene's T-2 close is the backstop). */
function closeIntent(
  context: MarketContext,
  read: SpreadRead,
  held: Extract<SpreadShape, { kind: "vertical" }>,
): OrderIntent[] {
  const cause = read.cause;
  if (cause === "open") return [];
  const legs: OptionLegSpec[] = [
    { occSymbol: held.long.occSymbol, side: "sell" },
    { occSymbol: held.short.occSymbol, side: "buy" },
  ];
  // A close needs a fresh read, not the feed's own stamp — it must never starve (the guards agree).
  const quoted = netQuote(legs, "close", context);
  if (!quoted?.at) return [];
  const towardNatural = closeAggression(
    lateness(read, marketDayKey(context.asOf)),
    etTimeOf(context.asOf),
  );
  // In Alpaca's signed net a lower number is better for the bot, so a close prices as a "buy".
  let limitPrice = priceInside(quoted, "buy", towardNatural, NET_TICK);
  // A net of exactly 0 is no order a broker takes: one cent toward natural, or nothing.
  if (limitPrice === 0) limitPrice = NET_TICK <= quoted.high + 1e-9 ? NET_TICK : undefined;
  if (limitPrice === undefined) return [];
  const name = spreadName(held.long.expiration, held.long.strike, held.short.strike);
  const intent = optionCloseIntent({
    underlying: SPREAD_SYMBOL,
    legs,
    quantity: held.quantity,
    limitPrice,
    band: { low: quoted.low, high: quoted.high, at: quoted.at },
    strategy: "nvda-spread-close",
    reason: `Selling the ${name} back: ${CLOSE_WHY[cause]}.`,
    expectation: closeExpectation(cause, towardNatural),
    selection: { rule: "spread-close", phase: cause, towardNatural },
  });
  return intent ? [intent] : [];
}

export const NVDA_CALL_SPREAD: Playbook = {
  id: "NVDA-CALL-SPREAD",
  symbols: [SPREAD_SYMBOL],
  thesis:
    "S1-NVDA's pre-earnings run-up as a call debit spread — the loss capped at the debit paid; " +
    "opens only on a confirmed print date, out five sessions before it.",
  evidence:
    "docs/research/nvda-earnings-cycle.md F1-F2 — the run-up into a print, 15 of 15 positive " +
    "since 2023 (P=0.0032, docs/research/events/nvda-2026-11-18-print.md); D-5→D a coin flip",
  // Unused, as on HC-SAURON: one spread at a time, sized by its Store allocation.
  size: { conservative: 0, standard: 0, aggressive: 0 },
  keyedOn: "earnings",
  derivesFrom: "S1-NVDA",
  options: { underlyings: [SPREAD_SYMBOL], holdsShortToExpiry: [], requiredLevel: 3 },
  desiredState: spreadWindow,
  optionDemand(
    asOfIso: string,
    portfolio: Portfolio,
    listed: ListedExpirations,
    calendar: readonly EarningsPrint[],
  ): OptionDemand {
    const shape = spreadShape(optionBook(portfolio, SPREAD_SYMBOL));
    const read = readWindow(asOfIso, calendar);
    if (shape.kind === "vertical" && read.state !== "long") {
      return { chains: [], contracts: [shape.long.occSymbol, shape.short.occSymbol] };
    }
    const entry =
      shape.kind === "none"
        ? entryFor(asOfIso, read, listed[SPREAD_SYMBOL] ?? [], calendar)
        : undefined;
    return entry
      ? {
          chains: [{ underlying: SPREAD_SYMBOL, expiration: entry.expiration, type: "call" }],
          contracts: [],
        }
      : NO_OPTION_DEMAND;
  },
  decide(context, portfolio, calendar, mode) {
    const shape = spreadShape(optionBook(portfolio, SPREAD_SYMBOL));
    const read = readWindow(context.asOf, calendar);
    if (shape.kind === "vertical") return closeIntent(context, read, shape);
    if (shape.kind === "foreign") return [];
    const entry = entryFor(
      context.asOf,
      read,
      context.options?.listed[SPREAD_SYMBOL] ?? [],
      calendar,
    );
    return entry ? openIntent(context, entry, mode) : [];
  },
};
