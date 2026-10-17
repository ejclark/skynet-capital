import { type EarningsPrint, etTimeOf } from "../domain/earnings-calendar.js";
import { daysBetween, sessionsBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { type HeldContract, optionBook } from "../domain/option-book.js";
import {
  type ListedExpirations,
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionContractQuote,
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
import { expiryInside, inQuietPeriod, type Steering } from "./conviction-steering.js";
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
 * SIZE. Each buy asks for a third of its mode's cap (15 / 30 / 60 contracts), and the guard cuts it
 * to what the Store allocation and the cash can pay for — so the allocation, not the cap, is what
 * usually binds, and a budget is in the market in about three orders (the per-symbol cooldown spaces
 * them about ten minutes apart). Adds buy the SAME contract it holds,
 * only while its ask is within 10% of the held cost and 90+ days remain. After a sale it may buy
 * again at once, at the new price: this version keeps no memory between cycles.
 *
 * STATE COMES FROM THE POSITIONS ALONE, as the wheel's does: a restart reads correctly.
 */

/** The window it buys in, in calendar days to expiry: the latest listed expiry inside it. */
const MIN_DTE = 120;
const MAX_DTE = 200;
/** Sell everything once this few days remain. */
const EXIT_DTE = 45;
/** Add to a held expiry only while at least this many days remain — never just before the exit. */
const MIN_ADD_DTE = 90;
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
  conservative: 15,
  standard: 30,
  aggressive: 60,
};

/** Buys come in thirds: each open asks for a third of the mode's cap (the guard cuts it to what the
 *  budget and cash can pay for), so a budget is put to work in about three orders, ten minutes
 *  apart, rather than one contract at a time. */
const tranche = (mode: PlaybookMode, held: number, steering?: Steering): number => {
  const cap = capOf(mode, steering);
  return Math.max(1, Math.min(Math.ceil(cap / 3), cap - held));
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

/** The expiry it would buy today, or none listed in the window. A conviction's fence (#5482 slice 4)
 *  can only shrink the window, so the latest expiry inside both is the latest inside the fence. */
function entryExpiry(
  listed: readonly string[],
  asOfIso: string,
  steering?: Steering,
): string | undefined {
  const today = marketDayKey(asOfIso);
  return eligibleExpirations(listed, today, {
    minDte: Math.max(MIN_DTE, steering?.dte?.min ?? 0),
    maxDte: Math.min(MAX_DTE, steering?.dte?.max ?? MAX_DTE),
    before: "9999-12-31",
  })
    .filter((e) => expiryInside(steering, e, daysBetween(today, e)))
    .at(-1);
}

/** The most contracts it holds: the mode's cap, or a conviction's lower one. */
const capOf = (mode: PlaybookMode, steering?: Steering): number =>
  Math.min(LONG_CALL_MAX_CONTRACTS[mode], steering?.contractsMax ?? Infinity);

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
    // A time exit that has not filled walks toward the bid as sessions pass, as hygiene's does.
    const dueOn = new Date(Date.parse(contract.expiration) - EXIT_DTE * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const late = cause === "time" && dueOn < today ? sessionsBetween(dueOn, today) : 0;
    const towardNatural = closeAggression(late, etTimeOf(context.asOf));
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

interface Pick {
  readonly quote: OptionContractQuote;
  readonly absDelta?: number;
  readonly deltaSource?: "feed" | "model";
  readonly candidates?: number;
}

/** A first buy: the latest expiry in the window, the strike nearest the mode's delta. */
function enterPick(
  symbol: string,
  context: MarketContext,
  target: number,
  spot: number,
  steering?: Steering,
): Pick | undefined {
  const expiration = entryExpiry(context.options?.listed[symbol] ?? [], context.asOf, steering);
  if (!expiration) return undefined;
  const rows = chainQuotes(context.options, symbol, expiration, "call");
  return pickByDelta(rows, target, spot, context.asOf, {
    otm: false,
    maxDeltaMiss: DELTA_MISS,
    ...(steering?.strikeMax !== undefined ? { maxStrike: steering.strikeMax } : {}),
  });
}

/** An add: the SAME contract already held, so the book stays one line and "near what it paid"
 *  compares like with like — and only while it has room before the time exit and its ask is within
 *  10% of the held cost, so it never chases a run. */
function addPick(
  held: readonly HeldContract[],
  context: MarketContext,
  steering?: Steering,
): Pick | undefined {
  const [line] = held;
  if (!line || held.some((c) => c.occSymbol !== line.occSymbol)) return undefined;
  const dte = daysBetween(marketDayKey(context.asOf), line.expiration);
  if (dte < MIN_ADD_DTE) return undefined;
  // An add is a new buy: a conviction's fence holds it to the same expiry and strike as an entry.
  if (!expiryInside(steering, line.expiration, dte)) return undefined;
  if (steering?.strikeMax !== undefined && line.strike > steering.strikeMax) return undefined;
  const quote = context.options?.contracts[line.occSymbol];
  if (quote?.ask === undefined || quote.ask > NO_CHASE * averageCost(held)) return undefined;
  return { quote };
}

function openIntent(
  setting: LongCallSetting,
  symbol: string,
  context: MarketContext,
  held: readonly HeldContract[],
  mode: PlaybookMode,
  steering?: Steering,
): OrderIntent[] {
  if (contractsOf(held) >= capOf(mode, steering)) return [];
  const spot = context.quotes[symbol]?.last;
  if (!(spot !== undefined && spot > 0)) return [];
  const target = LONG_CALL_DELTAS[mode];
  const pick = held[0]
    ? addPick(held, context, steering)
    : enterPick(symbol, context, target, spot, steering);
  if (!pick) return [];
  const { bid, ask, quotedAt } = pick.quote;
  const expiration = pick.quote.expiration;
  if (bid === undefined || ask === undefined || quotedAt === undefined) return [];
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
    quantity: tranche(mode, contractsOf(held), steering),
    limitPrice,
    band: { low: bid, high: ask, at: quotedAt },
    strategy: longCallTag(symbol),
    reason: `Buying ${name} calls for about ${cents(limitPrice)} a share ($${cost} a contract), held through earnings. ${setting.bet}`,
    expectation: `${symbol} rises before ${expiration}: the calls are sold at double their cost, or with ${EXIT_DTE} days left. The most each contract can lose is the $${cost} paid for it.`,
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
      ...(pick.absDelta !== undefined ? { pickedDelta: pick.absDelta } : {}),
      ...(pick.deltaSource ? { deltaSource: pick.deltaSource } : {}),
      ...(pick.candidates !== undefined ? { candidates: pick.candidates } : {}),
      towardNatural,
    },
  });
  return intent ? [intent] : [];
}

/** The long call on one ticker — `CRWV-LONG-CALL` is one call of this. Its id comes from the pair
 *  table; a ticker with no long-call row throws (criterion 8). `lookup` is a seam for specs. */
export function longCall(
  setting: LongCallSetting,
  lookup: typeof pairFor = pairFor,
  steering?: Steering,
): Playbook {
  const symbol = setting.symbol.toUpperCase();
  const pair = lookup("long-call", symbol);
  if (!pair)
    throw new Error(`no pair-table row for long-call × ${symbol}; add its evidence row first`);
  const { evidence } = pair;
  if (evidence.status !== "conviction" || !evidence.checkOn || !evidence.study) {
    throw new Error(`long-call × ${symbol} runs only on a dated conviction citing a study`);
  }
  const quiet = (asOfIso: string, calendar: readonly EarningsPrint[]): boolean =>
    steering?.quietSessionsAfterPrint !== undefined &&
    inQuietPeriod(symbol, marketDayKey(asOfIso), steering.quietSessionsAfterPrint, calendar);
  return {
    id: pair.id,
    symbols: [symbol],
    thesis: setting.thesis,
    evidence: `${evidence.study} — ${evidence.call} Checked ${evidence.checkOn}: new buys stop if its net P/L is below 0.`,
    // Unused: sized by the Store allocation, one contract per cycle up to the mode's cap.
    size: { conservative: 0, standard: 0, aggressive: 0 },
    options: { underlyings: [symbol], holdsShortToExpiry: [], requiredLevel: 2 },
    // A conviction may fence what it buys (#5482 slice 4); a playbook already fenced is not fenced twice.
    ...(steering
      ? {}
      : {
          steerable: {
            bounds: { dte: { min: MIN_DTE, max: MAX_DTE }, contracts: LONG_CALL_MAX_CONTRACTS },
            steer: (fence: Steering) => longCall(setting, lookup, fence),
          },
        }),
    desiredState: () => "long",
    optionDemand(
      asOfIso: string,
      portfolio: Portfolio,
      listed: ListedExpirations,
      calendar: readonly EarningsPrint[],
    ): OptionDemand {
      if (foreign(portfolio, symbol)) return NO_OPTION_DEMAND;
      const held = heldCalls(portfolio, symbol);
      const expiration =
        held[0]?.expiration ??
        (quiet(asOfIso, calendar)
          ? undefined
          : entryExpiry(listed[symbol] ?? [], asOfIso, steering));
      return {
        chains: expiration ? [{ underlying: symbol, expiration, type: "call" }] : [],
        contracts: held.map((c) => c.occSymbol),
      };
    },
    decide(context, portfolio, calendar, mode) {
      if (foreign(portfolio, symbol)) return [];
      const held = heldCalls(portfolio, symbol);
      const closes = closeIntents(symbol, context, held);
      // A due exit with no usable quote yet still blocks buying: never add to what it is selling.
      const today = marketDayKey(context.asOf);
      const due = held.some((c) => daysBetween(today, c.expiration) <= EXIT_DTE);
      if (closes.length > 0 || due) return closes;
      // A conviction's quiet period holds back buys and adds only; the closes above already ran.
      if (quiet(context.asOf, calendar)) return [];
      return openIntent(setting, symbol, context, held, mode, steering);
    },
  };
}
