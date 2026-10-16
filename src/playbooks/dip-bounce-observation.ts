/**
 * THE DARK RUN'S RECORD (#5489 slice 2): what the dip-to-bounce rule would have done, written as
 * observations the decision store keeps so thirty observed days can be scored. Pure: bars in,
 * observations out. It sits on `replayDipBounce` (`dip-bounce.ts`, the rule as the study measured
 * it) and adds only what the replay does not carry — the shares, the exit sentence, the quote the
 * pass saw when it first saw the signal.
 *
 * NOTHING HERE CAN TRADE. It imports no broker, no engine and no `OrderIntent`; its outputs are
 * `PlaybookObservation`s (`domain/playbook-observation.ts`), a type with no path to an order, and
 * `tests/playbooks/dip-bounce-observation.spec.ts` pins that by reading this file's imports.
 *
 * Two kinds come out, both idempotent on their key so a pass can say them again:
 *  - a SIGNAL for every dip bar the replay found in its window (bought, or refused by the
 *    late-recovery rule), with the session VWAP and range unit at that bar, the would-be buy at its
 *    close, the would-be exit (a sell resting at the target, which no level ever gates), and how
 *    the tranche stands — level, age, sold or not;
 *  - a DAY reading for the newest session: the playbook's own level (signal and gate, both ways: a
 *    tranche's age, the share tied up, the 8%-in-a-week stop) as of the newest bar.
 *
 * ONLY COMPLETED BARS: the bar still forming is dropped, as the study never saw one, so a signal
 * is a bar that has closed. The quote rides only on a signal found on the newest bar — one found
 * later (a restart replaying the window) carries none, because a quote read hours after the close
 * is not the spread at the signal.
 */
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import { etWall } from "../domain/et-wall.js";
import { BAR_MINUTES, type IntradayBar } from "../domain/intraday-bar.js";
import type {
  DayObservation,
  PlaybookObservation,
  RecoveryLevel,
  SignalObservation,
  SignalQuote,
  WouldBeOrder,
} from "../domain/playbook-observation.js";
import type { Quote } from "../domain/types.js";
import {
  DIP_BOUNCE_RULE,
  type DipBounceRule,
  printExclusions,
  type RefusedBuy,
  replayDipBounce,
  type Tranche,
} from "./dip-bounce.js";

/** What the playbook is handed each pass. `bars` is whatever the feed holds, forming bar included. */
export interface DipBounceInput {
  readonly playbookId: string;
  readonly symbol: string;
  readonly bars: readonly IntradayBar[];
  /** The pass's clock (`MarketContext.asOf`) — the only clock, so a replay is deterministic. */
  readonly asOf: string;
  readonly quote?: Quote | undefined;
  readonly calendar: readonly EarningsPrint[];
}

/** The bars that had closed by `asOfMs`, oldest first. A bar closes at its start plus five minutes. */
export function completedBars(bars: readonly IntradayBar[], asOfMs: number): IntradayBar[] {
  const now = etWall(asOfMs);
  if (!now) return [];
  return bars
    .filter(
      (b) => b.date < now.date || (b.date === now.date && b.minutes + BAR_MINUTES <= now.minutes),
    )
    .sort((a, b) => (a.date === b.date ? a.minutes - b.minutes : a.date < b.date ? -1 : 1));
}

const sharesAt = (price: number, rule: DipBounceRule): number => Math.floor(rule.tranche / price);

/** The sentence a would-be exit carries: the target, and what each level does to it (nothing). */
function exitWhy(t: Tranche, rule: DipBounceRule): string {
  const target = `rests ${rule.m} range above the buy`;
  const kept = "no level ever gates it";
  if (t.level === "gate")
    return `${target}; gate (${t.age} sessions held): no new buys, this sell keeps working — ${kept}`;
  if (t.level === "signal")
    return `${target}; signal (${t.age} sessions held): no new buys in the name, this sell stays working — ${kept}`;
  return (
    `${target}; held ${t.age} sessions, no level yet (signal at ${rule.signalDay} sessions or ` +
    `${pct(rule.signalShare)} tied up, gate at ${rule.gateDay} sessions, ${pct(rule.gateShare)} ` +
    `tied up or ${pct(rule.weeklyStop)} down in a week) — ${kept}`
  );
}

const pct = (share: number): string => `${Math.round(share * 100)}%`;

/** The level a refusal's reason names; a full book (no tranche free) is no recovery level at all. */
const levelOfRefusal = (why: string): RecoveryLevel =>
  why.startsWith("gate") ? "gate" : why.startsWith("signal") ? "signal" : "none";

function entryOrder(price: number, vwap: number, range: number, rule: DipBounceRule): WouldBeOrder {
  return {
    side: "buy",
    shares: sharesAt(price, rule),
    kind: "market",
    price,
    why: `closed ${rule.k} ranges (${(rule.k * range).toFixed(2)}) below session VWAP ${vwap.toFixed(2)}`,
  };
}

function signalOf(
  base: Pick<DipBounceInput, "playbookId" | "symbol">,
  t: Tranche,
  quote: SignalQuote | undefined,
  rule: DipBounceRule,
): SignalObservation {
  const shares = sharesAt(t.entry, rule);
  return {
    kind: "signal",
    ...base,
    session: t.boughtOn,
    minutes: t.boughtAt,
    outcome: "buy",
    vwap: t.vwap,
    range: t.range,
    entry: entryOrder(t.entry, t.vwap, t.range, rule),
    exit: {
      side: "sell",
      shares,
      kind: "resting",
      price: t.target,
      why: exitWhy(t, rule),
    },
    level: t.level,
    worstLevel: t.level,
    age: t.age,
    ...(t.sold ? { sold: { session: t.sold.on, minutes: t.sold.at, price: t.sold.price } } : {}),
    ...(quote ? { quote } : {}),
  };
}

function refusalOf(
  base: Pick<DipBounceInput, "playbookId" | "symbol">,
  r: RefusedBuy,
  quote: SignalQuote | undefined,
  rule: DipBounceRule,
): SignalObservation {
  return {
    kind: "signal",
    ...base,
    session: r.on,
    minutes: r.at,
    outcome: "refused",
    refusedWhy: r.why,
    vwap: r.vwap,
    range: r.range,
    entry: entryOrder(r.price, r.vwap, r.range, rule),
    level: levelOfRefusal(r.why),
    worstLevel: levelOfRefusal(r.why),
    age: 0,
    ...(quote ? { quote } : {}),
  };
}

/**
 * Every signal in the bars handed in, plus the newest session's book reading. Empty when no bar
 * had closed yet. Stateless: the same bars and clock give the same observations, which is what lets
 * the store upsert them and a later pass say them again.
 */
export function observeDipBounce(
  input: DipBounceInput,
  rule: DipBounceRule = DIP_BOUNCE_RULE,
): PlaybookObservation[] {
  const asOfMs = Date.parse(input.asOf);
  const bars = completedBars(input.bars, asOfMs);
  const newest = bars[bars.length - 1];
  if (!newest) return [];
  const dates = [...new Set(bars.map((b) => b.date))];
  const read = replayDipBounce(
    input.symbol,
    bars,
    printExclusions(input.symbol, dates, input.calendar),
    rule,
  );
  const base = { playbookId: input.playbookId, symbol: input.symbol };
  const seen: SignalQuote | undefined = input.quote
    ? { bid: input.quote.bid, ask: input.quote.ask, last: input.quote.last, seenAt: asOfMs }
    : undefined;
  // A quote belongs to a signal only on the newest bar: that is the pass that watched it close.
  const quoteFor = (session: string, minutes: number) =>
    session === newest.date && minutes === newest.minutes ? seen : undefined;

  const signals: SignalObservation[] = [
    ...[...read.sold, ...read.held]
      .filter((t) => sharesAt(t.entry, rule) > 0)
      .map((t) => signalOf(base, t, quoteFor(t.boughtOn, t.boughtAt), rule)),
    ...read.refused
      .filter((r) => sharesAt(r.price, rule) > 0)
      .map((r) => refusalOf(base, r, quoteFor(r.on, r.at), rule)),
  ];
  const day: DayObservation = {
    kind: "day",
    ...base,
    session: newest.date,
    minutes: newest.minutes,
    level: read.level,
    reasons: read.reasons,
    tiedUp: read.tiedUp,
    held: read.held.length,
    sold: read.sold.length,
    refused: read.refused.length,
    wouldBe: read.wouldBe,
  };
  return [...signals, day];
}
