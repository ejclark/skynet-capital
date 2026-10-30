import { type DailyHighReading, underHigh } from "../domain/daily-high.js";
import { type EarningsPrint, etTimeOf, optionPrintBlackout } from "../domain/earnings-calendar.js";
import { daysBetween, sessionsBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import type { HeldContract } from "../domain/option-book.js";
import { DAY_MS } from "../domain/time.js";
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
import { money } from "./format-money.js";
import {
  averageCost,
  capOf,
  contractsOf,
  foreign,
  heldCalls,
  LONG_CALL_MAX_CONTRACTS,
  type LongCallSetting,
  tranche,
} from "./long-call.js";
import {
  LEAP_DIP,
  LEAP_EXIT_DTE,
  LEAP_MAX_DTE,
  LEAP_MIN_DTE,
  longLeapExit,
} from "./long-leap-rules.js";
import { optionCloseIntent, optionOpenIntent } from "./option-intent.js";
import { pairFor } from "./pair-table.js";
import type { Playbook, PlaybookReads } from "./playbook.js";

/**
 * THE LONG LEAP, BOUGHT AFTER A PULLBACK (#6340; Eric, 2026-10-30: "We should build a long leap
 * playbook", a long LEAP being 12 months or more to expiry; "Long Leaps are about long term growth").
 *
 * It buys calls 365 to 760 days out — the latest listed expiry in that window, so about two years —
 * near 0.80 / 0.70 / 0.60 delta (conservative / standard / aggressive), on a day the ticker's last
 * close sits 15% or more under its 252-session high. It sells HALF, once, when a contract's bid
 * first reaches double its average cost, and everything still held once 180 days are left.
 *
 * WHAT THE STUDY SAYS, AND WHY IT RUNS ANYWAY. `docs/research/long-leap-dip-2026-10.md`: a dip added
 * no measured edge over an ordinary day (30%+ off high won 60%, ordinary days 63%); the contract and
 * the exit moved the result far more, and this is the shape it modeled best (24 months, 0.80 delta,
 * half at double, rest out with 6 left: mean +83%, won 63%, lost over half 22%). The 15% line is
 * chosen for simplicity, not edge. So, like CRWV-LONG-CALL, the pair runs as its owner's dated
 * conviction (◆), with the study's finding beside it. Every option number in the study is modeled.
 *
 * ITS OWN TEMPLATE, NOT A WIDENED LONG CALL (settled fork): `long-call.ts` keeps its 120-to-200-day
 * window and its conviction fences unchanged. This file reads the book through the long call's
 * helpers and prices like it does; only the window, the trigger and the exits are its own.
 *
 * MEMORY. The half-at-double sale happens once per contract, and a sale leaves the broker's average
 * cost unchanged — so the positions alone cannot say it already happened. It reads its own decision
 * record instead (`PlaybookReads.placedUnder`, the OCC symbols it placed a trim on); with no record
 * wired it neither trims nor adds, rather than sell half of a half or add to one, and the time exit
 * still runs. A trim order that never filled still counts as done, so that contract then runs whole
 * to the time exit: the conservative miss. Half rounds UP, so a lone contract is sold whole at
 * double — the study's "sold at 2x" shape, which lost over half no more often than the reference.
 *
 * WHOSE BOOK. Like the long call, every long call on the ticker is its book, and anything else on
 * the ticker's option book (a sold contract, a put) stops it altogether, exits included: a spread
 * left behind holds a long call too, and selling that leg alone would leave its short call naked.
 * One option playbook per ticker per bot (`claimOptionUnderlyings`) keeps any other play's calls off.
 *
 * TRIGGER. A daily reading (`PlaybookReads.dailyHigh`): no reading, or one more than two sessions old,
 * buys nothing. Blackouts and a conviction's quiet period hold back buys and adds; the exits run
 * through both. Adds buy the SAME contract it holds, while it still has 365+ days, the dip still
 * holds, it has not been trimmed and the ask is within 10% of the held cost.
 */

/** Add only while the ask is at most this multiple of the held contracts' average cost. */
const NO_CHASE = 1.1;
/** How far the picked strike's delta may sit from the target. */
const DELTA_MISS = 0.1;
/** The daily reading may be this many sessions behind today and still be read. */
const STALE_SESSIONS = 2;

/** Target delta per mode: the study's best shape is the conservative one. */
export const LONG_LEAP_DELTAS: Readonly<Record<PlaybookMode, number>> = {
  conservative: 0.8,
  standard: 0.7,
  aggressive: 0.6,
};

/** The strategy tags its orders carry: buys, the one trim, and the time exit. The trim tag is the
 *  play's memory, so it must never change for a pair already trading. */
const leapTag = (symbol: string): string => `${symbol.toLowerCase()}-long-leap`;
export const leapTrimTag = (symbol: string): string => `${leapTag(symbol)}-trim`;

/** The latest expiry in the window it would buy today, or none listed there. A conviction's fence
 *  can only shrink the window. */
function entryExpiry(
  listed: readonly string[],
  asOfIso: string,
  steering?: Steering,
): string | undefined {
  const today = marketDayKey(asOfIso);
  return eligibleExpirations(listed, today, {
    minDte: Math.max(LEAP_MIN_DTE, steering?.dte?.min ?? 0),
    maxDte: Math.min(LEAP_MAX_DTE, steering?.dte?.max ?? LEAP_MAX_DTE),
    before: "9999-12-31",
  })
    .filter((e) => expiryInside(steering, e, daysBetween(today, e)))
    .at(-1);
}

/** The daily reading when it is fresh and the close is 15%+ under the high; otherwise none. */
function dipOn(
  reads: PlaybookReads | undefined,
  symbol: string,
  today: string,
): DailyHighReading | undefined {
  const reading = reads?.dailyHigh?.(symbol);
  if (!reading) return undefined;
  const age = sessionsBetween(reading.session, today);
  if (age < 0 || age > STALE_SESSIONS) return undefined;
  return reading.close <= (1 - LEAP_DIP) * reading.high ? reading : undefined;
}

/** Inside the ticker's print blackout today: no option opens there. */
function inBlackout(symbol: string, asOfIso: string, calendar: readonly EarningsPrint[]): boolean {
  const blackout = optionPrintBlackout(symbol, asOfIso, calendar);
  return blackout !== undefined && blackout.start <= marketDayKey(asOfIso);
}

/** Whether a held contract was already trimmed once; `undefined` when the memory can't be read. */
function trimmedOf(
  reads: PlaybookReads | undefined,
  playbookId: string,
  symbol: string,
): ((occSymbol: string) => boolean) | undefined {
  const placed = reads?.placedUnder?.(playbookId, leapTrimTag(symbol));
  return placed ? (occSymbol) => placed.has(occSymbol) : undefined;
}

interface Exit {
  readonly contract: HeldContract;
  readonly cause: "time" | "trim";
  readonly quantity: number;
}

/** What it sells this pass, before pricing: the time exit, then the one trim. */
function exitsDue(
  held: readonly HeldContract[],
  context: MarketContext,
  trimmed: ((occSymbol: string) => boolean) | undefined,
): Exit[] {
  const today = marketDayKey(context.asOf);
  return held.flatMap((contract) => {
    const bid = context.options?.contracts[contract.occSymbol]?.bid;
    const cause = longLeapExit({
      dte: daysBetween(today, contract.expiration),
      paid: contract.avgPrice,
      ...(bid !== undefined ? { bid } : {}),
      ...(trimmed ? { trimmed: trimmed(contract.occSymbol) } : {}),
    });
    if (!cause) return [];
    // Half, rounded up: a lone contract is sold whole at double.
    const quantity = cause === "time" ? contract.quantity : Math.ceil(contract.quantity / 2);
    return [{ contract, cause, quantity }];
  });
}

/** Why it sells, in words: the trim says what it keeps, the time exit why now. */
function closeReason(
  cause: Exit["cause"],
  quantity: number,
  contract: HeldContract,
  bid: number,
): string {
  const name = humanizeOptionSymbol(contract.occSymbol);
  if (cause === "time") {
    return `Selling the ${name} calls back: ${LEAP_EXIT_DTE} days or fewer are left, and time decay speeds up from here.`;
  }
  const worth = `worth ${money(bid)} a share, at least double the ${money(contract.avgPrice)} paid`;
  const rest = contract.quantity - quantity;
  return rest > 0
    ? `Selling ${quantity} of the ${contract.quantity} ${name} calls: each is ${worth}. The other ${rest} are held until ${LEAP_EXIT_DTE} days are left.`
    : `Selling the ${name} call: it is ${worth}.`;
}

function closeIntents(symbol: string, context: MarketContext, exits: readonly Exit[]) {
  const today = marketDayKey(context.asOf);
  const out: OrderIntent[] = [];
  for (const { contract, cause, quantity } of exits) {
    const { bid, ask, quotedAt } = context.options?.contracts[contract.occSymbol] ?? {};
    if (bid === undefined || ask === undefined || quotedAt === undefined) continue;
    // A time exit that has not filled walks toward the bid as sessions pass, as the long call's does.
    const dueOn = new Date(Date.parse(contract.expiration) - LEAP_EXIT_DTE * DAY_MS)
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
    const intent = optionCloseIntent({
      underlying: symbol,
      legs: [{ occSymbol: contract.occSymbol, side: "sell" }],
      quantity,
      limitPrice,
      band: { low: bid, high: ask, at: quotedAt },
      strategy: cause === "trim" ? leapTrimTag(symbol) : `${leapTag(symbol)}-close`,
      reason: closeReason(cause, quantity, contract, bid),
      expectation: `The calls are sold near ${money(limitPrice)} a share and the cash returns to the budget.`,
      selection: { rule: "long-leap-close", phase: cause, towardNatural },
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
  return pickByDelta(
    chainQuotes(context.options, symbol, expiration, "call"),
    target,
    spot,
    context.asOf,
    {
      otm: false,
      maxDeltaMiss: DELTA_MISS,
      ...(steering?.strikeMax !== undefined ? { maxStrike: steering.strikeMax } : {}),
    },
  );
}

/** An add: the SAME contract, still a LEAP, never trimmed, its ask near what it cost. */
function addPick(
  held: readonly HeldContract[],
  context: MarketContext,
  trimmed: ((occSymbol: string) => boolean) | undefined,
  steering?: Steering,
): Pick | undefined {
  const [line] = held;
  if (!line || held.some((c) => c.occSymbol !== line.occSymbol)) return undefined;
  // Never add to a trimmed contract, nor to one whose trim can't be read.
  if (!trimmed || trimmed(line.occSymbol)) return undefined;
  const dte = daysBetween(marketDayKey(context.asOf), line.expiration);
  if (dte < LEAP_MIN_DTE || !expiryInside(steering, line.expiration, dte)) return undefined;
  if (steering?.strikeMax !== undefined && line.strike > steering.strikeMax) return undefined;
  const quote = context.options?.contracts[line.occSymbol];
  if (quote?.ask === undefined || quote.ask > NO_CHASE * averageCost(held)) return undefined;
  return { quote };
}

interface OpenInput {
  readonly setting: LongCallSetting;
  readonly symbol: string;
  readonly context: MarketContext;
  readonly held: readonly HeldContract[];
  readonly mode: PlaybookMode;
  readonly reading: DailyHighReading;
  readonly trimmed: ((occSymbol: string) => boolean) | undefined;
  readonly steering?: Steering;
}

function openIntent(input: OpenInput): OrderIntent[] {
  const { setting, symbol, context, held, mode, reading, trimmed, steering } = input;
  if (contractsOf(held) >= capOf(mode, steering)) return [];
  const spot = context.quotes[symbol]?.last;
  if (!(spot !== undefined && spot > 0)) return [];
  const target = LONG_LEAP_DELTAS[mode];
  const pick = held[0]
    ? addPick(held, context, trimmed, steering)
    : enterPick(symbol, context, target, spot, steering);
  if (!pick) return [];
  const { bid, ask, quotedAt, expiration } = pick.quote;
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
  const off = Math.round(underHigh(reading) * 100);
  const intent = optionOpenIntent({
    underlying: symbol,
    structure: "long-call",
    legs: [{ occSymbol: pick.quote.occSymbol, side: "buy" }],
    quantity: tranche(mode, contractsOf(held), steering),
    limitPrice,
    band: { low: bid, high: ask, at: quotedAt },
    strategy: leapTag(symbol),
    reason: `${symbol} closed at ${money(reading.close)} on ${reading.session}, ${off}% under its ${money(reading.high)} high of the past year. Buying ${name} calls for about ${money(limitPrice)} a share ($${cost} a contract). ${setting.bet}`,
    expectation: `${symbol} recovers before ${expiration}: half the calls are sold once they are worth double their cost, and the rest with ${LEAP_EXIT_DTE} days left. The most each contract can lose is the $${cost} paid for it.`,
    forecast: {
      direction: "up",
      invalidator: `${symbol} is below ${money(spot)} with ${LEAP_EXIT_DTE} days left on the ${name}`,
    },
    selection: {
      rule: "long-leap-by-delta",
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

/** The long LEAP on one ticker — `NVDA-LONG-LEAP` is one call of this. Its id comes from the pair
 *  table; a ticker with no long-leap row throws. `lookup` is a seam for specs. */
export function longLeap(
  setting: LongCallSetting,
  lookup: typeof pairFor = pairFor,
  steering?: Steering,
): Playbook {
  const symbol = setting.symbol.toUpperCase();
  const pair = lookup("long-leap", symbol);
  if (!pair)
    throw new Error(`no pair-table row for long-leap × ${symbol}; add its evidence row first`);
  const { evidence } = pair;
  if (evidence.status !== "conviction" || !evidence.checkOn || !evidence.study) {
    throw new Error(`long-leap × ${symbol} runs only on a dated conviction citing a study`);
  }
  const id = pair.id;
  // Buys and adds wait out a print blackout and a conviction's quiet period; exits never do.
  const holdBack = (asOfIso: string, calendar: readonly EarningsPrint[]): boolean =>
    inBlackout(symbol, asOfIso, calendar) ||
    (steering?.quietSessionsAfterPrint !== undefined &&
      inQuietPeriod(symbol, marketDayKey(asOfIso), steering.quietSessionsAfterPrint, calendar));
  return {
    id,
    symbols: [symbol],
    thesis: setting.thesis,
    evidence: `${evidence.study} — ${evidence.call} Checked ${evidence.checkOn}: new buys stop if its net P/L is below 0.`,
    // Unused: sized by the Store allocation, a third of the mode's cap per buy.
    size: { conservative: 0, standard: 0, aggressive: 0 },
    options: { underlyings: [symbol], holdsShortToExpiry: [], requiredLevel: 2 },
    horizon: "long",
    ...(steering
      ? {}
      : {
          steerable: {
            bounds: {
              dte: { min: LEAP_MIN_DTE, max: LEAP_MAX_DTE },
              contracts: LONG_CALL_MAX_CONTRACTS,
            },
            steer: (fence: Steering) => longLeap(setting, lookup, fence),
          },
        }),
    desiredState: () => "long",
    optionDemand(
      asOfIso: string,
      portfolio: Portfolio,
      listed: ListedExpirations,
      calendar: readonly EarningsPrint[],
      _mode: PlaybookMode,
      reads?: PlaybookReads,
    ): OptionDemand {
      if (foreign(portfolio, symbol)) return NO_OPTION_DEMAND;
      const held = heldCalls(portfolio, symbol);
      // Asked every pass, held or not: asking is what keeps the feed reading the ticker.
      const dip = dipOn(reads, symbol, marketDayKey(asOfIso));
      const expiration =
        held[0]?.expiration ??
        (dip && !holdBack(asOfIso, calendar)
          ? entryExpiry(listed[symbol] ?? [], asOfIso, steering)
          : undefined);
      return {
        chains: expiration ? [{ underlying: symbol, expiration, type: "call" }] : [],
        contracts: held.map((c) => c.occSymbol),
      };
    },
    decide(context, portfolio, calendar, mode, reads) {
      if (foreign(portfolio, symbol)) return [];
      const held = heldCalls(portfolio, symbol);
      const today = marketDayKey(context.asOf);
      // The memory is read only when something is held: a flat book has nothing to remember.
      const trimmed = held.length > 0 ? trimmedOf(reads, id, symbol) : undefined;
      const exits = exitsDue(held, context, trimmed);
      // A due exit with no usable quote yet still blocks buying: never add to what it is selling.
      if (exits.length > 0) return closeIntents(symbol, context, exits);
      if (holdBack(context.asOf, calendar)) return [];
      const reading = dipOn(reads, symbol, today);
      if (!reading) return [];
      return openIntent({ setting, symbol, context, held, mode, reading, trimmed, steering });
    },
  };
}
