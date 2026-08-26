import { MARKET_TIMEZONE, marketDayKey } from "../domain/market-day.js";
import type { EquitySample } from "./history-store.js";

/**
 * Derived history state — the pure layer docs/BACKLOG.md specifies over the equity history:
 * windowed deltas (daily/monthly $ and %), seed baselines, and the race/day trophies. Everything
 * here is a total function over samples (same testable pattern as the reducer): no I/O, no clock —
 * callers pass `nowIso` — so "has X doubled yet" is computed in exactly one place.
 *
 * A **trading day** here is a day with at least one recorded sample, keyed in market time
 * (`America/New_York` by default). No market-calendar feed is consulted: weekends and holidays
 * simply have no samples, so they can never break a streak, and Friday→Monday is one change. The
 * honest corollary is that a *sampling outage* reads as a missing day rather than a fabricated
 * flat one — the metrics never invent a day the board did not record.
 *
 * Honesty invariants (asserted by specs):
 *  - a delta is only as old as the history behind it — `partial` is true whenever the recorded
 *    history doesn't reach back a full window, so renderers can label "since first sample"
 *    instead of implying a full day/month elapsed.
 *  - trophies derive from real samples only; a participant with no history holds no trophy.
 *  - **a gain trophy requires a gain.** With no positive day there is no "biggest gain" — the
 *    result is null, never the least-bad losing day dressed up as a win.
 *  - the first recorded day is never a green day; it has no prior close to have beaten.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Calendar months vary; the trophy/delta window uses a plain 30-day month, labeled as such. */
export const MONTH_MS = 30 * DAY_MS;

/** A signed change across a trailing window. `pct` is percentage points (30 = +30%). */
export interface WindowChange {
  readonly abs: number;
  readonly pct: number;
  /** ISO time of the baseline sample the change is measured from. */
  readonly from: string;
  /** ISO time of the latest sample. */
  readonly to: string;
  /** True when history is younger than the window — the change is "since first sample". */
  readonly partial: boolean;
}

function ordered(samples: readonly EquitySample[]): EquitySample[] {
  return [...samples].sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * Change over the trailing `windowMs` ending at `nowIso`: measured from the last sample at or
 * before the window start (the value you *held* when the window opened), falling back to the
 * earliest sample when history is younger than the window (`partial: true`). Null under 2 samples.
 */
export function changeOver(
  samples: readonly EquitySample[],
  windowMs: number,
  nowIso: string,
): WindowChange | null {
  if (samples.length < 2) return null;
  const sorted = ordered(samples);
  const cutoff = new Date(new Date(nowIso).getTime() - windowMs).toISOString();
  const atOrBefore = sorted.filter((s) => s.at <= cutoff);
  const baseline = atOrBefore[atOrBefore.length - 1] ?? sorted[0];
  const last = sorted[sorted.length - 1];
  if (!(baseline && last)) return null;
  const abs = last.equity - baseline.equity;
  return {
    abs,
    pct: baseline.equity !== 0 ? (abs / baseline.equity) * 100 : 0,
    from: baseline.at,
    to: last.at,
    partial: atOrBefore.length === 0,
  };
}

/**
 * The seed baseline — the earliest recorded sample, i.e. the founding record "doubling" is
 * measured against (docs/BACKLOG.md: recorded at onboarding). Null with no history.
 */
export function seedBaseline(samples: readonly EquitySample[]): EquitySample | null {
  return ordered(samples)[0] ?? null;
}

/**
 * The first instant this participant's equity reached `multiple` × its seed baseline, or null if
 * it hasn't. Scans forward so the award time is when it HAPPENED, not when it was asked about.
 * A non-positive seed earns nothing — a multiple of zero is not a milestone.
 */
export function reachedMultipleAt(
  samples: readonly EquitySample[],
  multiple: number,
): EquitySample | null {
  const sorted = ordered(samples);
  const seed = sorted[0];
  if (!seed || seed.equity <= 0) return null;
  return sorted.find((s) => s.equity >= seed.equity * multiple) ?? null;
}

/** The first instant this participant's equity reached 2× its seed baseline, or null. */
export function doubledAt(samples: readonly EquitySample[]): EquitySample | null {
  return reachedMultipleAt(samples, 2);
}

/** A race trophy: who earned it and when. Awarded once — earliest instant wins. */
export interface RaceTrophy {
  readonly participantId: string;
  readonly at: string;
}

function byParticipant<T extends { readonly participantId: string }>(
  rows: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(row.participantId);
    if (list) list.push(row);
    else groups.set(row.participantId, [row]);
  }
  return groups;
}

/** Across every participant's history, whoever reached `multiple`× their own seed first. */
function firstToReach(samples: readonly EquitySample[], multiple: number): RaceTrophy | null {
  let winner: RaceTrophy | null = null;
  for (const [participantId, group] of byParticipant(samples)) {
    const hit = reachedMultipleAt(group, multiple);
    if (hit && (!winner || hit.at < winner.at)) {
      winner = { participantId, at: hit.at };
    }
  }
  return winner;
}

/**
 * The "first account to double" race trophy (docs/BACKLOG.md): across every participant's
 * history, the earliest doubling instant. Null while nobody has doubled.
 */
export function firstAccountToDouble(samples: readonly EquitySample[]): RaceTrophy | null {
  return firstToReach(samples, 2);
}

/**
 * The "first account to +50%" trophy — the earlier, more reachable rung of the same race. It is
 * NOT consumed by the bigger one: an account that has already doubled still holds this, because
 * it passed +50% on the way. Null while nobody has.
 */
export function firstAccountToFiftyPercent(samples: readonly EquitySample[]): RaceTrophy | null {
  return firstToReach(samples, 1.5);
}

/** The aggregate-2× milestone read: total capital now vs. the sum of every participant's seed. */
export interface AggregateDoubling {
  readonly seedTotal: number;
  readonly latestTotal: number;
  readonly doubled: boolean;
}

/**
 * Has total capital across all participants doubled (docs/BACKLOG.md "aggregate 2×")? Seeds sum
 * each participant's earliest sample — the honest baseline of what was actually committed, even
 * though members join at different times. Null with no history.
 */
export function aggregateDoubling(samples: readonly EquitySample[]): AggregateDoubling | null {
  const groups = byParticipant(samples);
  if (groups.size === 0) return null;
  let seedTotal = 0;
  let latestTotal = 0;
  for (const group of groups.values()) {
    const sorted = ordered(group);
    seedTotal += sorted[0]?.equity ?? 0;
    latestTotal += sorted[sorted.length - 1]?.equity ?? 0;
  }
  return { seedTotal, latestTotal, doubled: seedTotal > 0 && latestTotal >= seedTotal * 2 };
}

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
