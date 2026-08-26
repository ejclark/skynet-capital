import { MARKET_TIMEZONE, marketDayKey } from "../domain/market-day.js";
import { byParticipant, ordered } from "./history-metrics.js";
import type { EquitySample } from "./history-store.js";

/**
 * The DAY-based trophies: biggest single-day gain, and the longest run of consecutive green days.
 *
 * Split out of history-metrics.ts (2026-08-26) when the three room-to-grow trophies pushed that
 * file from 137 lines past 300 — the race trophies ("first to double", "first to +50%") measure a
 * participant against their own founding baseline, while everything here measures one recorded day
 * against the one before it. Two different questions over the same samples, so two files.
 *
 * A **trading day** is a day with at least one recorded sample, keyed in market time. No
 * market-calendar feed is consulted: weekends and holidays simply have no samples, so they can
 * never break a streak, and Friday-to-Monday is one change. The honest corollary is that a
 * sampling outage reads as a MISSING day rather than a fabricated flat one.
 *
 * Honesty invariants (asserted by specs):
 *  - **a gain trophy requires a gain.** With no positive day there is no "biggest gain" — the
 *    result is null, never the least-bad losing day dressed up as a win.
 *  - the first recorded day is never a green day; it has no prior close to have beaten.
 *  - a flat day is not green — it breaks a streak.
 */

/** One trading day's move for one participant, measured close-to-close. */
export interface DayChange {
  readonly participantId: string;
  /** YYYY-MM-DD in market time — the trading day that closed. */
  readonly day: string;
  /** ISO instant of the sample that closed the day (the day's last recorded sample). */
  readonly at: string;
  /** The day's closing equity. */
  readonly equity: number;
  /** Change in dollars from the previous recorded day's close. */
  readonly abs: number;
  /** The same change in percentage points (30 = +30%); 0 when the prior close was zero. */
  readonly pct: number;
}

/** The last sample of each recorded day, oldest day first. Intraday noise collapses to the close. */
function dayCloses(
  samples: readonly EquitySample[],
  timezone: string,
): { day: string; at: string; equity: number }[] {
  const closes = new Map<string, { day: string; at: string; equity: number }>();
  for (const s of ordered(samples)) {
    const day = marketDayKey(s.at, timezone);
    closes.set(day, { day, at: s.at, equity: s.equity });
  }
  return [...closes.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Day-over-day changes for every participant, oldest day first. Days are the days the board
 * actually recorded, so consecutive here means "the next day with a sample" — a Friday→Monday
 * change is one entry, not three. A participant's first recorded day yields no change (there is
 * nothing behind it to have moved from), so N recorded days produce N−1 entries.
 */
export function dailyChanges(
  samples: readonly EquitySample[],
  timezone: string = MARKET_TIMEZONE,
): DayChange[] {
  const changes: DayChange[] = [];
  for (const [participantId, group] of byParticipant(samples)) {
    const closes = dayCloses(group, timezone);
    for (let i = 1; i < closes.length; i += 1) {
      const prior = closes[i - 1];
      const close = closes[i];
      if (!(prior && close)) continue;
      const abs = close.equity - prior.equity;
      changes.push({
        participantId,
        day: close.day,
        at: close.at,
        equity: close.equity,
        abs,
        pct: prior.equity !== 0 ? (abs / prior.equity) * 100 : 0,
      });
    }
  }
  return changes.sort(
    (a, b) => a.day.localeCompare(b.day) || a.participantId.localeCompare(b.participantId),
  );
}

/**
 * The biggest single-day gain on record — ranked by DOLLARS, reporting both $ and %, with the
 * earliest day winning a tie. Null when no day was positive: a gain trophy requires a gain, so a
 * book that only ever lost holds nothing here rather than crowning its least-bad day.
 */
export function biggestSingleDayGain(
  samples: readonly EquitySample[],
  timezone: string = MARKET_TIMEZONE,
): DayChange | null {
  let best: DayChange | null = null;
  for (const change of dailyChanges(samples, timezone)) {
    if (change.abs <= 0) continue;
    if (!best || change.abs > best.abs) best = change;
  }
  return best;
}

/** A run of consecutive green trading days. */
export interface GreenStreak {
  readonly length: number;
  /** YYYY-MM-DD of the first green day in the run. */
  readonly from: string;
  /** YYYY-MM-DD of the last green day in the run. */
  readonly to: string;
}

/** One participant's best run, for the cross-participant board. */
export interface GreenStreakStanding extends GreenStreak {
  readonly participantId: string;
}

/**
 * The longest run of strictly-up days in a day-ordered change list. Flat (0) breaks a run just as
 * a down day does — unlike a scratch trade, an elapsed flat day is a real day that was not green.
 * Ties go to the earlier run.
 */
function bestRun(changes: readonly DayChange[]): GreenStreak | null {
  let best: GreenStreak | null = null;
  let length = 0;
  let from = "";
  for (const change of changes) {
    if (change.abs <= 0) {
      length = 0;
      continue;
    }
    length += 1;
    if (length === 1) from = change.day;
    if (!best || length > best.length) best = { length, from, to: change.day };
  }
  return best;
}

/**
 * Every participant's longest green streak, longest first (ties to the earlier finish, then by id).
 * Participants who have never strung a green day together are OMITTED, not listed with a zero —
 * absence is absence.
 */
export function greenStreakBoard(
  samples: readonly EquitySample[],
  timezone: string = MARKET_TIMEZONE,
): GreenStreakStanding[] {
  const board: GreenStreakStanding[] = [];
  for (const [participantId, changes] of byParticipant(dailyChanges(samples, timezone))) {
    const run = bestRun(changes);
    if (run) board.push({ participantId, ...run });
  }
  return board.sort(
    (a, b) =>
      b.length - a.length ||
      a.to.localeCompare(b.to) ||
      a.participantId.localeCompare(b.participantId),
  );
}

/**
 * The longest green streak in this history — the per-participant read, mirroring `doubledAt`.
 * Given a mixed history it reports the best run on the board rather than blending participants.
 * Null until at least two recorded days exist with an up-move between them.
 */
export function longestGreenStreak(
  samples: readonly EquitySample[],
  timezone: string = MARKET_TIMEZONE,
): GreenStreak | null {
  const top = greenStreakBoard(samples, timezone)[0];
  return top ? { length: top.length, from: top.from, to: top.to } : null;
}
