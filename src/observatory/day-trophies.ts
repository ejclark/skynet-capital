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
 *  - a flat day is neither green nor red — it ends a run of either kind and starts neither.
 *  - **a run's percentage is compounded, never summed.** Each day's percent is measured
 *    against a different base, so adding five daily percentages overstates the five-day run.
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

/** Which way a run of trading days went. A flat day is neither, and belongs to no run. */
export type StreakDirection = "green" | "red";

/** A run of consecutive same-direction trading days, and what the run was worth. */
export interface DayStreak {
  readonly direction: StreakDirection;
  readonly length: number;
  /** YYYY-MM-DD of the first day in the run. */
  readonly from: string;
  /** YYYY-MM-DD of the last day in the run. */
  readonly to: string;
  /**
   * The run's whole move in dollars — equity at the run's last close minus equity at the close
   * BEFORE it began. Positive for a green run, negative for a red one; the sign is the direction,
   * so a red run's total reads as the loss it was rather than a bare magnitude.
   */
  readonly abs: number;
  /**
   * The same move in percentage points (30 = +30%), compounded across the run — measured once from
   * the close before it, never summed day by day. 0 when that close was zero.
   */
  readonly pct: number;
}

/** One participant's best run, for the cross-participant board. */
export interface DayStreakStanding extends DayStreak {
  readonly participantId: string;
}

/** A run still being extended: the closing equity at each end is what the totals are computed from. */
interface OpenRun {
  direction: StreakDirection;
  from: string;
  to: string;
  /** Closing equity the day BEFORE the run started — the base every total is measured against. */
  base: number;
  /** Closing equity on the run's last day so far. */
  end: number;
  length: number;
}

/**
 * Every maximal same-direction run in a day-ordered change list, oldest run first. Flat (0) ends a
 * run and starts none — unlike a scratch trade, an elapsed flat day is a real day that went nowhere.
 */
function runs(changes: readonly DayChange[]): OpenRun[] {
  const found: OpenRun[] = [];
  let open: OpenRun | null = null;
  for (const change of changes) {
    if (change.abs === 0) {
      open = null;
      continue;
    }
    const direction: StreakDirection = change.abs > 0 ? "green" : "red";
    if (open && open.direction === direction) {
      open.length += 1;
      open.to = change.day;
      open.end = change.equity;
    } else {
      open = {
        direction,
        from: change.day,
        to: change.day,
        base: change.equity - change.abs,
        end: change.equity,
        length: 1,
      };
      found.push(open);
    }
  }
  return found;
}

function sealed(run: OpenRun): DayStreak {
  const abs = run.end - run.base;
  return {
    direction: run.direction,
    length: run.length,
    from: run.from,
    to: run.to,
    abs,
    pct: run.base !== 0 ? (abs / run.base) * 100 : 0,
  };
}

/** The longest run of the given direction, ties going to the earlier run. */
function bestRun(changes: readonly DayChange[], direction: StreakDirection): DayStreak | null {
  let best: OpenRun | null = null;
  for (const run of runs(changes)) {
    if (run.direction !== direction) continue;
    if (!best || run.length > best.length) best = run;
  }
  return best ? sealed(best) : null;
}

/**
 * Every participant's longest run of the given direction, longest first (ties to the earlier
 * finish, then by id). Participants who have never strung two such days together are OMITTED, not
 * listed with a zero — absence is absence, in both directions.
 */
export function dayStreakBoard(
  samples: readonly EquitySample[],
  direction: StreakDirection,
  timezone: string = MARKET_TIMEZONE,
): DayStreakStanding[] {
  const board: DayStreakStanding[] = [];
  for (const [participantId, changes] of byParticipant(dailyChanges(samples, timezone))) {
    const run = bestRun(changes, direction);
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
 * The longest run of the given direction in this history — the per-participant read, mirroring
 * `doubledAt`. Given a mixed history it reports the best run on the board rather than blending
 * participants. Null until two recorded days exist with a move of that direction between them.
 */
export function longestDayStreak(
  samples: readonly EquitySample[],
  direction: StreakDirection,
  timezone: string = MARKET_TIMEZONE,
): DayStreak | null {
  const top = dayStreakBoard(samples, direction, timezone)[0];
  return top ? withoutParticipant(top) : null;
}

/** The board's rows carry a participant id; the singular reads must not leak one downstream. */
function withoutParticipant(standing: DayStreakStanding): DayStreak {
  const { participantId: _id, ...run } = standing;
  return run;
}

/**
 * The run still open at the most recent recorded day — green or red, whichever is running. Null
 * when that day was flat (a flat day ends a run and starts none) or when no day-over-day change
 * exists yet. Given a mixed history it reads the participant with the most recent recorded day.
 */
export function currentDayStreak(
  samples: readonly EquitySample[],
  timezone: string = MARKET_TIMEZONE,
): DayStreak | null {
  let latest: DayStreakStanding | null = null;
  for (const [participantId, changes] of byParticipant(dailyChanges(samples, timezone))) {
    const last = changes[changes.length - 1];
    const open = runs(changes).pop();
    if (!(last && open) || open.to !== last.day) continue;
    const standing: DayStreakStanding = { participantId, ...sealed(open) };
    const rank = latest
      ? standing.to.localeCompare(latest.to) ||
        latest.participantId.localeCompare(standing.participantId)
      : 1;
    if (rank > 0) latest = standing;
  }
  return latest ? withoutParticipant(latest) : null;
}
