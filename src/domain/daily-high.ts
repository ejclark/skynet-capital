/**
 * A TICKER'S DAILY HIGH, as a play reads it (#6340 slice 1): its last completed session's close and
 * the highest close of the 252 sessions ending there — "how far under its year's high is it?". The
 * long-LEAP playbook buys when the close sits 15% or more under that high; the study it runs on
 * (`docs/research/long-leap-dip-2026-10.md`, `scripts/research/leap-dip-study.mjs` → `drawdown`)
 * measured the same high the same way, closes only. One honest difference: the bots read the IEX
 * venue's daily bars (the feed every bar read here uses), not the consolidated close the study's
 * history carries, so a close within a few cents of the line can land on the other side of it.
 * Pure data: the feed (`playbooks/daily-high-feed.ts`) builds it, a play consumes it.
 */

/** Sessions the high looks back over: a trading year, the study's `HIGH_WINDOW`. */
export const HIGH_SESSIONS = 252;

export interface DailyHighReading {
  /** The last completed session, `YYYY-MM-DD`. */
  readonly session: string;
  /** That session's close. */
  readonly close: number;
  /** The highest close of the `HIGH_SESSIONS` sessions ending at `session`, `session` included. */
  readonly high: number;
}

/** One daily bar as the reader needs it: its timestamp and close, split-adjusted. */
export interface DailyClose {
  /** The bar's ISO timestamp; its first ten characters are the session. */
  readonly t: string;
  readonly c: number;
}

/**
 * The reading over daily bars, oldest first — or `undefined` when fewer than a year of sessions
 * came back, since a high over a shorter stretch is not the high the study measured. A bar whose
 * close is not a positive number is a broken read, so the whole reading is refused rather than
 * built around it.
 */
export function dailyHighReading(
  bars: readonly DailyClose[],
  sessions = HIGH_SESSIONS,
): DailyHighReading | undefined {
  if (bars.length < sessions) return undefined;
  const year = bars.slice(-sessions);
  if (!year.every((bar) => Number.isFinite(bar.c) && bar.c > 0)) return undefined;
  const last = year[year.length - 1];
  if (!last) return undefined;
  return {
    session: last.t.slice(0, 10),
    close: last.c,
    high: Math.max(...year.map((bar) => bar.c)),
  };
}

/** How far the close sits under the high, as a fraction: 0.15 is 15% under. */
export function underHigh(reading: DailyHighReading): number {
  return 1 - reading.close / reading.high;
}

/**
 * A ticker's reading as the pass can see it, or `undefined` when none has been read yet.
 * SYNCHRONOUS on purpose, like `IntradayBarsOf`: the decision pass awaits nothing; the feed behind
 * it refreshes on its own clock, and asking for a ticker is what tells it to fetch.
 */
export type DailyHighOf = (symbol: string) => DailyHighReading | undefined;

/** Reads a ticker's split-adjusted daily bars between two dates, oldest first; `undefined` when
 *  the feed could not be read. A READ: whatever implements it holds a `get` and nothing else. */
export type FetchDailyCloses = (
  symbol: string,
  /** `YYYY-MM-DD`, inclusive. */
  start: string,
  /** `YYYY-MM-DD`, inclusive. */
  end: string,
) => Promise<readonly DailyClose[] | undefined>;
