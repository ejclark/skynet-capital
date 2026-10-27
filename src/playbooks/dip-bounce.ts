/**
 * THE DIP-TO-BOUNCE RULE (#5489 slice 2) — the rule `docs/research/intraday-dip-bounce-2026-10.md`
 * measured, as a pure replay the bots can run every pass. OBSERVE-ONLY: what it returns is a
 * reading and a list of WOULD-BE orders in its own type, never an `OrderIntent`, so nothing it says
 * can reach the trader by accident; the playbooks built on it are `observeOnly` besides
 * (`playbook.ts`), which is the engine's own guarantee.
 *
 * The rule, as the study tested it (k = 2, m = 1 — the only cell that cleared costs on MU):
 *  - A 5-minute bar from 10:00 ET that CLOSES at or below session VWAP − 2 × the name's own range
 *    buys one tranche at that close. The range is the mean high−low of the previous 78 bars (one
 *    session), so the open's swing never sets the unit by itself. One buy per cross: the name re-arms
 *    when a bar closes back above the level, or buys again only another 2 ranges below its last buy.
 *  - Each tranche rests a sell one range above its buy. It fills at the open when a bar opens at or
 *    above it, else at the target when a bar trades THROUGH it (never on the buy's own bar).
 *  - The print day and one session either side buy nothing.
 *
 * The late-recovery rule, as the study amended it (§5) — cascading levels, exits never gated:
 *  - SIGNAL: a tranche 3 sessions old, or held tranches tying up 30% of the allocation → no new buys
 *    in the name.
 *  - GATE: a tranche 5 sessions old, or 50% tied up, or the book down 8% of its allocation over five
 *    sessions → no new buys, and the tranche KEEPS ITS TARGET SELL WORKING. No hand-off: 18 of 22
 *    buys held past day 5 reached target later (median day 9), and booking them out lost the bounce.
 *    Handing a gated tranche to the wheel or to holding is slice 3, and it keeps the target too.
 *
 * STATELESS ON PURPOSE: every pass replays the window of bars it is handed, so the tranche book is a
 * function of the tape, not of a store that could drift from it, and the 2026-12-31 dark-run check
 * can re-derive any day's reading from bars alone. A tranche older than the window drops out of it;
 * the caller hands at least `rule.windowSessions` sessions so the study's slowest recoveries
 * (15 sessions) stay inside. Prices are before costs: the dark run records the quote at each signal
 * so costs are measured rather than assumed (the study's open question 3).
 */
import { type EarningsPrint, printSpan } from "../domain/earnings-calendar.js";
import type { IntradayBar } from "../domain/intraday-bar.js";
import { sessionsBetween } from "../domain/market-calendar.js";
import { wholePct } from "../domain/percent.js";
import type { RecoveryLevel, WouldBeOrder } from "../domain/playbook-observation.js";

export type { IntradayBar, RecoveryLevel, WouldBeOrder };

export interface DipBounceRule {
  /** Buy this many ranges below session VWAP. */
  readonly k: number;
  /** Sell this many ranges above the buy. */
  readonly m: number;
  /** No buy before this ET minute (600 = 10:00): the first 30 minutes never enter. */
  readonly firstMinute: number;
  /** Bars in the range unit (78 = one session of 5-minute bars). */
  readonly rangeWindow: number;
  /** Dollars per tranche, and how many tranches the allocation holds. */
  readonly tranche: number;
  readonly slots: number;
  readonly signalDay: number;
  readonly signalShare: number;
  readonly gateDay: number;
  readonly gateShare: number;
  /** The book down this share of its allocation over five sessions gates new buys. */
  readonly weeklyStop: number;
  /** Sessions a caller should hand the replay. */
  readonly windowSessions: number;
}

/** The study's cell (k = 2, m = 1) and the plan's rule. 25 tranches of $1,000 per name: MU and NBIS
 *  together are the study's 50 × $1k book. */
export const DIP_BOUNCE_RULE: DipBounceRule = {
  k: 2,
  m: 1,
  firstMinute: 600,
  rangeWindow: 78,
  tranche: 1000,
  slots: 25,
  signalDay: 3,
  signalShare: 0.3,
  gateDay: 5,
  gateShare: 0.5,
  weeklyStop: 0.08,
  windowSessions: 20,
};

export interface Tranche {
  readonly boughtOn: string;
  readonly boughtAt: number;
  readonly entry: number;
  readonly target: number;
  /** Session VWAP and the range unit on the signal bar — the numbers the buy was priced from. */
  readonly vwap: number;
  readonly range: number;
  /** Sessions since the buy (0 = the buy's own session), at the last bar replayed or at the sale. */
  readonly age: number;
  readonly level: RecoveryLevel;
  readonly sold?: { readonly on: string; readonly at: number; readonly price: number };
}

/** A buy the rule saw and the late-recovery rule refused. */
export interface RefusedBuy {
  readonly on: string;
  readonly at: number;
  readonly price: number;
  readonly vwap: number;
  readonly range: number;
  readonly why: string;
}

export interface DipBounceRead {
  readonly symbol: string;
  /** The last bar replayed, or undefined when there were none. */
  readonly asOf?: { readonly date: string; readonly minutes: number };
  readonly held: readonly Tranche[];
  readonly sold: readonly Tranche[];
  readonly refused: readonly RefusedBuy[];
  /** Held tranches bought before today, as a share of the allocation (the study's "tied up"). */
  readonly tiedUp: number;
  readonly level: RecoveryLevel;
  /** Why the level is what it is, one plain line each; empty at "none". */
  readonly reasons: readonly string[];
  /** What it would do on the last bar: a buy if that bar signalled and was admitted, then every held
   *  tranche's resting sell. */
  readonly wouldBe: readonly WouldBeOrder[];
}

interface Marked extends IntradayBar {
  readonly day: number;
  readonly vwap: number;
  readonly range: number | null;
}

/** Session VWAP (typical price × volume) through each bar, and the trailing range unit. */
function mark(bars: readonly IntradayBar[], window: number): Marked[] {
  const out: Marked[] = [];
  const spans: number[] = [];
  let date = "";
  let day = -1;
  let pv = 0;
  let vol = 0;
  for (const b of bars) {
    if (b.date !== date) {
      date = b.date;
      day += 1;
      pv = 0;
      vol = 0;
    }
    const typical = (b.high + b.low + b.close) / 3;
    const v = b.volume > 0 ? b.volume : 0;
    pv += typical * v;
    vol += v;
    const recent = spans.slice(-window);
    const range = recent.length >= window ? recent.reduce((a, s) => a + s, 0) / window : null;
    out.push({ ...b, day, vwap: vol > 0 ? pv / vol : typical, range });
    spans.push(b.high - b.low);
  }
  return out;
}

/** The fill a bar gives a resting sell at `target`, or null. */
const fillAt = (b: IntradayBar, target: number): number | null =>
  b.open >= target ? b.open : b.high > target ? target : null;

/** The Monday of a date's week — "until the owner resets it" read as the calendar week, as the
 *  study's book did. */
const weekOf = (date: string): string => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

/** The sessions a print excludes: its day and one session either side (an estimate's whole span). */
export function printExclusions(
  symbol: string,
  dates: readonly string[],
  calendar: readonly EarningsPrint[],
): Set<string> {
  const spans = calendar.filter((p) => p.symbol === symbol).map(printSpan);
  return new Set(
    dates.filter((d) =>
      spans.some(
        ({ start, end }) => sessionsBetween(d, start) <= 1 && sessionsBetween(end, d) <= 1,
      ),
    ),
  );
}

const levelOfAge = (age: number, rule: DipBounceRule): RecoveryLevel =>
  age >= rule.gateDay ? "gate" : age >= rule.signalDay ? "signal" : "none";

interface Open {
  readonly boughtOn: string;
  readonly boughtAt: number;
  readonly day: number;
  readonly entry: number;
  readonly target: number;
  readonly vwap: number;
  readonly range: number;
  readonly index: number;
}

/**
 * Replay the rule over `bars` (oldest first, any number of whole or partial sessions) for one name.
 * Pure: the bars, the excluded sessions and the rule are the only inputs.
 */
export function replayDipBounce(
  symbol: string,
  bars: readonly IntradayBar[],
  exclude: ReadonlySet<string> = new Set(),
  rule: DipBounceRule = DIP_BOUNCE_RULE,
): DipBounceRead {
  const tape = mark(bars, rule.rangeWindow);
  const allocation = rule.tranche * rule.slots;
  const open: Open[] = [];
  const sold: Tranche[] = [];
  const refused: RefusedBuy[] = [];
  const plAtClose: number[] = [];
  let realized = 0;
  let haltWeek: string | null = null;
  let armed = true;
  let lastEntry: number | null = null;
  let lastBuyAt = -1;

  tape.forEach((b, i) => {
    const sessionStart = i === 0 || tape[i - 1]?.date !== b.date;
    if (sessionStart) {
      armed = true;
      lastEntry = null;
    }
    // Exits first, never gated.
    for (const t of [...open]) {
      if (t.index >= i) continue;
      const fill = fillAt(b, t.target);
      if (fill == null) continue;
      open.splice(open.indexOf(t), 1);
      realized += rule.tranche * (fill / t.entry - 1);
      sold.push({
        ...trancheOf(t, b.day - t.day, rule),
        sold: { on: b.date, at: b.minutes, price: fill },
      });
    }
    const signal = entrySignal(b, armed, lastEntry, exclude, rule);
    if (signal !== undefined) {
      armed = signal.armed;
      if (signal.buy) {
        lastEntry = b.close;
        const why = refusal(open, b, haltWeek, allocation, rule);
        const range = b.range ?? 0;
        if (why)
          refused.push({ on: b.date, at: b.minutes, price: b.close, vwap: b.vwap, range, why });
        else {
          open.push({
            boughtOn: b.date,
            boughtAt: b.minutes,
            day: b.day,
            entry: b.close,
            target: b.close + rule.m * range,
            vwap: b.vwap,
            range,
            index: i,
          });
          lastBuyAt = i;
        }
      }
    }
    const sessionEnd = i === tape.length - 1 || tape[i + 1]?.date !== b.date;
    if (sessionEnd) {
      const unreal = open.reduce((a, t) => a + rule.tranche * (b.close / t.entry - 1), 0);
      plAtClose.push(realized + unreal);
      const back = plAtClose[plAtClose.length - 6];
      const now = plAtClose[plAtClose.length - 1] ?? 0;
      if (back !== undefined && now - back <= -rule.weeklyStop * allocation)
        haltWeek = weekOf(b.date);
    }
  });

  const last = tape[tape.length - 1];
  const held = open.map((t) => trancheOf(t, last ? last.day - t.day : 0, rule));
  const carried = last ? open.filter((t) => t.day < last.day).length : 0;
  const tiedUp = (carried * rule.tranche) / allocation;
  const halted = last !== undefined && haltWeek === weekOf(last.date);
  const { level, reasons } = bookLevel(held, tiedUp, halted, rule);
  return {
    symbol,
    ...(last ? { asOf: { date: last.date, minutes: last.minutes } } : {}),
    held,
    sold,
    refused,
    tiedUp,
    level,
    reasons,
    wouldBe: wouldBeOrders(open, held, last, lastBuyAt === tape.length - 1, rule),
  };
}

function trancheOf(t: Open, age: number, rule: DipBounceRule): Tranche {
  return {
    boughtOn: t.boughtOn,
    boughtAt: t.boughtAt,
    entry: t.entry,
    target: t.target,
    vwap: t.vwap,
    range: t.range,
    age,
    level: levelOfAge(age, rule),
  };
}

/** The entry half of the study's `findEntries`: undefined when the bar cannot enter at all. */
function entrySignal(
  b: Marked,
  armed: boolean,
  lastEntry: number | null,
  exclude: ReadonlySet<string>,
  rule: DipBounceRule,
): { readonly armed: boolean; readonly buy: boolean } | undefined {
  if (b.range == null || b.minutes < rule.firstMinute || exclude.has(b.date)) return undefined;
  if (b.close > b.vwap - rule.k * b.range) return { armed: true, buy: false };
  const deeper = lastEntry !== null && b.close <= lastEntry - rule.k * b.range;
  return armed || deeper ? { armed: false, buy: true } : { armed, buy: false };
}

/** Why the late-recovery rule refuses a buy now, or undefined to admit it. */
function refusal(
  open: readonly Open[],
  b: Marked,
  haltWeek: string | null,
  allocation: number,
  rule: DipBounceRule,
): string | undefined {
  if (open.length >= rule.slots) return "every tranche is in use";
  if (haltWeek === weekOf(b.date)) return "gate: down 8% of the allocation in five sessions";
  const oldest = Math.max(-1, ...open.map((t) => b.day - t.day));
  if (oldest >= rule.gateDay) return `gate: a tranche is ${oldest} sessions old`;
  if (oldest >= rule.signalDay) return `signal: a tranche is ${oldest} sessions old`;
  const share = (open.filter((t) => t.day < b.day).length * rule.tranche) / allocation;
  if (share >= rule.gateShare) return `gate: ${wholePct(share)} of the allocation tied up`;
  if (share >= rule.signalShare) return `signal: ${wholePct(share)} of the allocation tied up`;
  return undefined;
}

function bookLevel(
  held: readonly Tranche[],
  tiedUp: number,
  halted: boolean,
  rule: DipBounceRule,
): { readonly level: RecoveryLevel; readonly reasons: readonly string[] } {
  const reasons: string[] = [];
  const oldest = held.reduce<Tranche | undefined>(
    (a, t) => (a && a.age >= t.age ? a : t),
    undefined,
  );
  if (oldest && oldest.level !== "none") {
    reasons.push(
      `${oldest.level}: the tranche bought ${oldest.boughtOn} is ${oldest.age} sessions old` +
        (oldest.level === "gate" ? "; its target sell keeps working" : ""),
    );
  }
  if (tiedUp >= rule.gateShare) reasons.push(`gate: ${wholePct(tiedUp)} of the allocation tied up`);
  else if (tiedUp >= rule.signalShare)
    reasons.push(`signal: ${wholePct(tiedUp)} of the allocation tied up`);
  if (halted) reasons.push("gate: down 8% of the allocation in five sessions; no buys this week");
  const level: RecoveryLevel = reasons.some((r) => r.startsWith("gate"))
    ? "gate"
    : reasons.length > 0
      ? "signal"
      : "none";
  return { level, reasons };
}

function wouldBeOrders(
  open: readonly Open[],
  held: readonly Tranche[],
  last: Marked | undefined,
  boughtOnLast: boolean,
  rule: DipBounceRule,
): WouldBeOrder[] {
  const orders: WouldBeOrder[] = [];
  const shares = (price: number) => Math.floor(rule.tranche / price);
  const newest = open[open.length - 1];
  if (boughtOnLast && last && newest && shares(newest.entry) > 0) {
    orders.push({
      side: "buy",
      shares: shares(newest.entry),
      kind: "market",
      price: newest.entry,
      why: `closed ${rule.k} ranges below session VWAP (${last.vwap.toFixed(2)})`,
    });
  }
  held.forEach((t) => {
    if (shares(t.entry) <= 0) return;
    orders.push({
      side: "sell",
      shares: shares(t.entry),
      kind: "resting",
      price: t.target,
      why:
        `target ${rule.m} range above the ${t.boughtOn} buy` +
        (t.level === "gate" ? " (gated: kept working)" : ""),
    });
  });
  return orders;
}
