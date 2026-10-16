import type { DecisionRecord } from "../autonomous/decision-record.js";
import { sessionsBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { positionValue } from "../domain/portfolio.js";
import type { Portfolio, Position } from "../domain/types.js";
import { findPair, pairName } from "../playbooks/pair-table.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { OpenLot } from "../trading/round-trips.js";
import type {
  BookReading,
  HealthFinding,
  HealthLevel,
  PlayHealth,
  PlayHold,
} from "./book-health-view.js";
import { latestVerdictPass } from "./bot-heartbeat-view.js";
import { openedBy } from "./position-opened-by.js";
import { formatCurrency } from "./render-atoms.js";

/**
 * BOOK HEALTH'S ACCOUNT- AND POSITION-LEVEL DETECTORS (#5493 slice 1): idle, concentrated, stuck by
 * age, imbalanced. LOOPING, which reads the decision passes rather than the book, is
 * `book-health-looping.ts`. Each returns findings already worded; each words itself without a
 * playbook's name when the reader is not the owner (#885). See `book-health-view.ts` for the shapes
 * and the thresholds.
 */

/** "the wheel on CRWV" for the owner; anyone else reads no playbook name or strategy (#885). */
export function playName(playbookId: string, ownerView: boolean): string {
  if (!ownerView) return "one of this account's playbooks";
  const pair = findPair(playbookId);
  return pair ? pairName(pair) : playbookId;
}

export const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const wholePct = (share: number): string => `${Math.round(share * 100)}%`;

/** A position's underlying: the ticker itself, or an option contract's. */
export function underlyingOf(symbol: string): string {
  return parseOccSymbol(symbol)?.underlying ?? symbol;
}

/**
 * When a position was opened, from the fill ledger's open lots — said only when those lots add up
 * to the whole position, sign included (`openedBy`'s and `lotsFor`'s rule). A window that starts
 * mid-position, or shares an assignment delivered, leaves it undefined.
 */
export function openedOn(
  position: Position,
  lots: readonly OpenLot[] | undefined,
): string | undefined {
  const mine = (lots ?? []).filter((lot) => lot.symbol === position.symbol);
  if (mine.length === 0) return undefined;
  const signed = mine.reduce((sum, lot) => sum + (lot.short ? -lot.quantity : lot.quantity), 0);
  if (Math.abs(signed - position.quantity) > 1e-6) return undefined;
  return mine.map((lot) => lot.at).sort()[0];
}

/** Sessions opened since `openedAt`'s market day, up to `asOf`'s — 0 on the day it opened. */
export function sessionsHeld(openedAt: string, asOf: string): number {
  return sessionsBetween(marketDayKey(openedAt), marketDayKey(asOf));
}

/** Positions that belong to a play: the one its lots name, else any in its basket. */
export function positionsOf(
  playbookId: string,
  basket: readonly string[],
  portfolio: Portfolio,
  lots: readonly OpenLot[] | undefined,
): Position[] {
  return portfolio.positions.filter((position) => {
    if (position.quantity === 0) return false;
    const named = openedBy(position.symbol, position.quantity, lots)?.playbookId;
    return named ? named === playbookId : basket.includes(underlyingOf(position.symbol));
  });
}

/** IDLE — the account's cash nothing has claimed (not a position, not a sold put's collateral),
 *  above its share of equity. Signal only: idle cash is a choice to look at, never a stop. */
export function detectIdle(reading: BookReading): HealthFinding[] {
  const { equity, uncommittedCash, thresholds } = reading;
  if (equity <= 0) return [];
  const share = uncommittedCash / equity;
  if (share <= thresholds.idleCashShare) return [];
  return [
    {
      detector: "idle",
      level: "signal",
      reading: share,
      threshold: thresholds.idleCashShare,
      words: `${wholePct(share)} of this account's equity is cash nothing has claimed: no position holds it and no sold put has it set aside.`,
    },
  ];
}

/** Each underlying's dollars at stake: its shares at their mark, its long contracts at their marks,
 *  and the cash set aside to secure its sold puts (`bookNeeds`). A sold call is covered by shares
 *  already counted, so it adds nothing; a bare one cannot be placed (the guards' `call-not-covered`). */
function exposureByUnderlying(reading: BookReading): Map<string, number> {
  const exposure = new Map<string, number>();
  const add = (symbol: string, dollars: number): void => {
    exposure.set(symbol, (exposure.get(symbol) ?? 0) + dollars);
  };
  for (const position of reading.portfolio.positions) {
    if (position.quantity === 0) continue;
    const parts = parseOccSymbol(position.symbol);
    const value = positionValue(position, reading.quotes[position.symbol]?.last);
    if (!parts) add(position.symbol, Math.abs(value));
    else if (position.quantity > 0) add(parts.underlying, value);
  }
  for (const [underlying, cash] of reading.book.cashByUnderlying) add(underlying, cash);
  return exposure;
}

/** CONCENTRATED — one underlying above a share of equity: a signal, and past the higher line a
 *  gate. A cohort that moves together (CRWV with NBIS) is #5493's open question 1, not read yet. */
export function detectConcentrated(reading: BookReading): HealthFinding[] {
  const { equity, thresholds } = reading;
  if (equity <= 0) return [];
  return [...exposureByUnderlying(reading)].flatMap(([symbol, dollars]): HealthFinding[] => {
    const share = dollars / equity;
    if (share <= thresholds.concentratedSignal) return [];
    const gate = share > thresholds.concentratedGate;
    const line = gate ? thresholds.concentratedGate : thresholds.concentratedSignal;
    return [
      {
        detector: "concentrated",
        level: gate ? "gate" : "signal",
        symbol,
        reading: share,
        threshold: line,
        words: `${symbol} is ${wholePct(share)} of this account's equity, counting its shares, its contracts and the cash held to secure puts sold on it — over the ${wholePct(line)} line.`,
      },
    ];
  });
}

/** The session counts a play's hold turns into signal and gate lines, or undefined when it
 *  declares nothing. An intraday play: the thresholds' day 3 and day 5. An expected hold of H:
 *  past H is the signal, and the gate keeps the same gap past it. */
function stuckLines(
  hold: PlayHold | undefined,
  reading: BookReading,
): { readonly signal: number; readonly gate: number; readonly intraday: boolean } | undefined {
  const { stuckSignalSessions, stuckGateSessions } = reading.thresholds;
  const gap = stuckGateSessions - stuckSignalSessions;
  if (hold?.intraday)
    return { signal: stuckSignalSessions, gate: stuckGateSessions, intraday: true };
  if (hold?.expectedHoldSessions === undefined) return undefined;
  const signal = hold.expectedHoldSessions + 1;
  return { signal, gate: signal + gap, intraday: false };
}

/**
 * STUCK BY AGE — an open position held past what its play declares: an intraday play's position
 * on its third session (gate on its fifth), or past a play-supplied expected hold. A play that
 * declares neither produces NOTHING — no house playbook declares a hold yet (#5489 brings the first
 * intraday one), and guessing a hold for a play that never stated one would be the false alarm.
 * A position whose opening fills are not on hand has no age, so it is never called stuck.
 */
export function detectStuck(
  plays: readonly PlayHealth[],
  holds: ReadonlyMap<string, PlayHold> | undefined,
  positionsFor: (playbookId: string) => readonly Position[],
  ageOf: (position: Position) => number | undefined,
  reading: BookReading,
): HealthFinding[] {
  return plays.flatMap((play) => {
    const lines = stuckLines(holds?.get(play.playbookId), reading);
    if (!lines) return [];
    const name = playName(play.playbookId, reading.ownerView);
    return positionsFor(play.playbookId).flatMap((position): HealthFinding[] => {
      const age = ageOf(position);
      if (age === undefined || age < lines.signal) return [];
      const level: HealthLevel = age >= lines.gate ? "gate" : "signal";
      const why = !reading.ownerView
        ? ""
        : lines.intraday
          ? ", a play meant to close within the day"
          : `, which expects to hold ${lines.signal - 1} sessions`;
      return [
        {
          detector: "stuck",
          level,
          playbookId: play.playbookId,
          symbol: position.symbol,
          reading: age,
          threshold: level === "gate" ? lines.gate : lines.signal,
          words: `${position.symbol} has been held ${age} sessions by ${name}${why}.`,
        },
      ];
    });
  });
}

/**
 * IMBALANCED, for a play with NO target (one that has a target is read against it, #5493 slice 4,
 * `book-health-imbalance.ts`) — a placeholder; an enabled play
 * with an allocation whose committed share sits above the high line or below the low one. Signal
 * only. A play whose newest verdict is "no window" holds nothing by design, so its empty budget is
 * not read as imbalance; neither is an uncapped play, nor one whose basket is unknown.
 */
export function detectImbalanced(
  plays: readonly PlayHealth[],
  records: readonly DecisionRecord[],
  reading: BookReading,
): HealthFinding[] {
  const { imbalancedHigh, imbalancedLow } = reading.thresholds;
  const verdicts = latestVerdictPass(records)?.verdicts ?? [];
  return plays.flatMap((play): HealthFinding[] => {
    const { allocation, committed } = play;
    // A play with a target is read against it instead (`book-health-imbalance.ts`).
    if (play.target) return [];
    if (!(play.enabled && allocation) || allocation <= 0 || committed === undefined) return [];
    const share = committed / allocation;
    const outOfWindow = verdicts.some(
      (v) => v.playbookId === play.playbookId && v.state === "no-window",
    );
    const high = share > imbalancedHigh;
    if (!high && (share >= imbalancedLow || outOfWindow)) return [];
    const name = capitalized(playName(play.playbookId, reading.ownerView));
    const budget = reading.ownerView ? `its ${formatCurrency(allocation)} budget` : "its budget";
    const tail = high
      ? "little is left for a new entry."
      : "most of it sits idle while the play is switched on.";
    return [
      {
        detector: "imbalanced",
        level: "signal",
        playbookId: play.playbookId,
        reading: share,
        threshold: high ? imbalancedHigh : imbalancedLow,
        words: `${name} has ${wholePct(share)} of ${budget} committed: ${tail}`,
      },
    ];
  });
}
