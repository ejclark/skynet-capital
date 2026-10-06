/**
 * STRATEGY TEMPLATES (#4469 slice 2b) — a strategy with its ticker taken out. `S1-NVDA` and
 * `G1-GOOG` are one pre-print run-up on two tickers, differing only in the settings below (the
 * unit's count, the exit); `TACO-DJT` is the event strategy on DJT. Each template turns a ticker
 * plus its settings into an ordinary `Playbook`, so everything downstream — `playbookIntents`, the
 * guards, attribution, the roll call — sees exactly what it saw when each was hand-written.
 *
 * THE ID IS LOOKED UP, NEVER BUILT (criterion 8). A builder asks the pair table (`pairFor`) for the
 * id of its strategy × ticker and throws when there is none: a ticker with no row has no id, and
 * inventing one would key subscriptions, verdicts and P/L history on a name nothing else knows.
 *
 * SAME DECISIONS AS BEFORE, PROVEN. `tests/playbooks/templates.spec.ts` carries the hand-written
 * `desiredState`s these replaced as a reference and holds the instances to them over a grid, and
 * holds each instance equal to its old shape field by field (criterion 7). A template that drifts
 * from main fails there, not in a live book.
 *
 * TWO CLOCKS (`earnings-calendar.ts`): a house run-up counts TRADING SESSIONS (the unit its research
 * counts in, #4776); a member-authored play's form declares calendar DAYS, so `authored-play.ts`
 * reads the same state machine with `unit: "days"`. One machine, two units — never two copies.
 */
import { etTimeOf, recentPrint } from "../domain/earnings-calendar.js";
import type { PlaybookMode } from "../domain/types.js";
import { pairFor, type StrategyId } from "./pair-table.js";
import {
  type Playbook,
  type PlaybookEvent,
  type PlaybookKey,
  POST_PRINT_FLAT_DAYS,
  printSessionWindow,
  printWindow,
} from "./playbook.js";

/** How a pre-print run-up counts: trading sessions (house) or calendar days (member-authored). */
export type WindowUnit = "sessions" | "days";

/**
 * Where the long ends — a per-ticker setting, because the evidence is per ticker:
 *  - `before`: flat once the print is `count` units away or nearer (NVDA's final week is dead
 *    money, so S1-NVDA is out from D-5);
 *  - `print-day-close`: hold through print day and go flat from `etCutoff` on it (GOOG's final week
 *    is not dead money; the release is after the close, so it exits ~15:45 ET, with the post-print
 *    hygiene as the next-day failsafe).
 */
export type RunUpExit =
  | { readonly kind: "before"; readonly count: number }
  | { readonly kind: "print-day-close"; readonly etCutoff: string };

export interface PrePrintWindow {
  readonly unit: WindowUnit;
  /** The window opens when the print is this many units away or nearer. */
  readonly enter: number;
  readonly exit: RunUpExit;
}

type Reading = { readonly away: number; readonly confirmed: boolean };

/** `before`: long between the entry and the exit, flat from the exit on (past the print included). */
function beforeState(window: PrePrintWindow, count: number, { away, confirmed }: Reading) {
  if (away > window.enter) {
    return "no-window";
  }
  if (away > count) {
    return confirmed ? "long" : "no-window";
  }
  // Inside the exit: whatever we hold, we should not — the play is over.
  return "flat";
}

/** `print-day-close`: long to the print-day cut, then flat; an unconfirmed print day is flat. */
function printDayCloseState(
  window: PrePrintWindow,
  etCutoff: string,
  asOfIso: string,
  { away, confirmed }: Reading,
) {
  if (away === 0) {
    // Print day: ride to the close, exit before it (the release is after hours).
    return etTimeOf(asOfIso) >= etCutoff ? "flat" : confirmed ? "long" : "flat";
  }
  return away <= window.enter && confirmed ? "long" : "no-window";
}

/** The pre-print run-up as a `desiredState` for one ticker. Date policy (`playbook.ts`): only a
 *  CONFIRMED print opens a window; an estimate stays dark. */
export function prePrintState(symbol: string, window: PrePrintWindow): Playbook["desiredState"] {
  return (asOfIso, calendar) => {
    if (recentPrint(symbol, asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
      // Failsafe: an exit that was missed is made on the first post-print cycle.
      return "flat";
    }
    const reading = unitReading(symbol, window.unit, asOfIso, calendar);
    if (!reading) {
      return "no-window";
    }
    return window.exit.kind === "print-day-close"
      ? printDayCloseState(window, window.exit.etCutoff, asOfIso, reading)
      : beforeState(window, window.exit.count, reading);
  };
}

function unitReading(
  symbol: string,
  unit: WindowUnit,
  asOfIso: string,
  calendar: Parameters<typeof printWindow>[2],
): Reading | undefined {
  if (unit === "sessions") {
    const w = printSessionWindow(symbol, asOfIso, calendar);
    return w && { away: w.sessions, confirmed: w.confirmed };
  }
  const w = printWindow(symbol, asOfIso, calendar);
  return w && { away: w.days, confirmed: w.confirmed };
}

/** How old an event is in minutes, or `undefined` when either timestamp is unparseable. */
function ageMinutes(fromIso: string, toIso: string): number | undefined {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  return Number.isFinite(from) && Number.isFinite(to) ? (to - from) / 60_000 : undefined;
}

/**
 * The event strategy as a `desiredState` for one ticker: long while a qualifying event for it is
 * no younger than zero and no older than `holdMinutes`, flat once every such event has aged out
 * (a future-dated event counts as aged out, so an entry window can never fail to close), and dark
 * when none ever signaled. Holdings-blind by contract — it answers "what should the book be".
 */
export function eventState(symbol: string, holdMinutes: number): Playbook["desiredState"] {
  return (asOfIso, _calendar, events: readonly PlaybookEvent[] = []) => {
    const own = events.filter((event) => event.symbol === symbol);
    if (own.length === 0) {
      // Never signaled: correctly dark, exactly like a date-keyed play with no upcoming print.
      return "no-window";
    }
    const live = own.some((event) => {
      const age = ageMinutes(event.detectedAt, asOfIso);
      return age !== undefined && age >= 0 && age <= holdMinutes;
    });
    // Every event aged out: converge to flat, so a position never rides past its own window.
    return live ? "long" : "flat";
  };
}

/** What a pair says about itself that a template cannot know: its words, its sizing, its opt-ins. */
interface PairCopy {
  readonly thesis: string;
  /** Citation into docs/research/ — the record of why this pair exists. */
  readonly evidence: string;
  readonly size: Readonly<Record<PlaybookMode, number>>;
  readonly mixedSignals?: Playbook["mixedSignals"];
}

export interface PrePrintRunUpSetting extends PairCopy {
  readonly symbol: string;
  readonly window: PrePrintWindow;
}

export interface EventPlaySetting extends PairCopy {
  readonly symbol: string;
  readonly holdMinutes: number;
}

/** The id of a strategy × ticker, from the pair table. Throws on a pair that has no row — a
 *  ticker's id is looked up, never composed (criterion 8). */
function pairIdOf(strategy: StrategyId, symbol: string): string {
  const pair = pairFor(strategy, symbol);
  if (!pair) {
    throw new Error(`no pair-table row for ${strategy} × ${symbol}; add its evidence row first`);
  }
  return pair.id;
}

function copyOf(
  setting: PairCopy,
  keyedOn: PlaybookKey,
): Pick<Playbook, "thesis" | "evidence" | "size" | "keyedOn" | "mixedSignals"> {
  return {
    thesis: setting.thesis,
    evidence: setting.evidence,
    size: setting.size,
    keyedOn,
    ...(setting.mixedSignals ? { mixedSignals: setting.mixedSignals } : {}),
  };
}

/** The pre-print run-up on one ticker — S1-NVDA and G1-GOOG are two calls of this. */
export function prePrintRunUp(setting: PrePrintRunUpSetting): Playbook {
  return {
    id: pairIdOf("pre-print-run-up", setting.symbol),
    symbols: [setting.symbol],
    ...copyOf(setting, "earnings"),
    desiredState: prePrintState(setting.symbol, setting.window),
  };
}

/** The event strategy on one ticker — TACO-DJT is one call of this. */
export function eventPlay(setting: EventPlaySetting): Playbook {
  return {
    id: pairIdOf("event", setting.symbol),
    symbols: [setting.symbol],
    ...copyOf(setting, "event"),
    desiredState: eventState(setting.symbol, setting.holdMinutes),
  };
}
