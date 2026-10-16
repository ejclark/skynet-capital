import type { CheckWeekRows } from "../autonomous/decision-db-week.js";
import { sessionBounds, sessionWeek } from "../domain/market-session.js";
import type { PlaybookMode, PlaybookVerdictState, Side } from "../domain/types.js";

/**
 * THE WEEK ON ONE CLOCK (#5073 slice 2 — #5037 round 2, "lanes on one clock"). The Playbooks
 * section's strip draws the bot's checks across this week's sessions; each playbook's card draws
 * its answers as a lane on the same clock, so a trade mark lines up straight under the check that
 * placed it. This turns the store's rows (`decision-db-week.ts`) into exactly that: sessions cut
 * into half-hour buckets, a check count per bucket, one answer per playbook per bucket, the trades
 * placed, and the spans the market was open with no check recorded.
 *
 * WHAT "NONE MISSED" MEANS, so the strip can say it: no span longer than the heartbeat's own stale
 * window (`STALE_AFTER_MS`, two minutes) between consecutive checks — or between a session's open
 * or close and its nearest check — while that session was open. Same threshold as "Not checking",
 * so the strip and the state above it can never disagree about the same minute. A span is "no
 * check recorded", never a claim the bot failed: a dashboard copy that missed a replication batch
 * draws the same gap, and says so in those words.
 */

/** Half an hour: 13 marks in a full session, 65 in a week — about 5px each across a 390px lane,
 *  wide enough to read a shape in, and aligned to the :00/:30 Eastern every session opens on. */
export const WEEK_BUCKET_MS = 30 * 60_000;

export interface WeekSession {
  /** `YYYY-MM-DD`, New York's calendar. */
  readonly date: string;
  readonly openAt: number;
  readonly closeAt: number;
}

export interface WeekLane {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  /** Its index in the heartbeat's `playbooks` (the newest verdict pass) when it is one of them —
   *  how a card whose name is withheld (#885) still finds its own lane. */
  readonly slot?: number;
  /** Per session, per bucket: the answer it gave most that half hour; null when no check asked it
   *  (before the bot ran it, a paused stretch) or the bucket has not happened yet. */
  readonly states: readonly (readonly (PlaybookVerdictState | null)[])[];
}

export interface WeekTrade {
  readonly at: number;
  readonly symbol: string;
  readonly side: Side;
  readonly playbookId?: string;
  readonly mode?: PlaybookMode;
}

export interface CheckWeekView {
  readonly bucketMs: number;
  readonly now: number;
  readonly sessions: readonly WeekSession[];
  /** Per session, per bucket: how many checks were recorded; null for a bucket not yet begun. */
  readonly checks: readonly (readonly (number | null)[])[];
  /** Open-market spans with no check recorded, longer than the stale window. */
  readonly gaps: readonly { readonly from: number; readonly to: number }[];
  readonly lanes: readonly WeekLane[];
  readonly trades: readonly WeekTrade[];
}

/** The window the store is asked for: this week's first open to its last close. Null on a week
 *  with no session at all (a holiday week has at least one; this is the guard, not a case). */
export function checkWeekWindow(now: Date): { readonly from: number; readonly to: number } | null {
  const sessions = weekSessions(now);
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  return first && last ? { from: first.openAt, to: last.closeAt } : null;
}

function weekSessions(now: Date): WeekSession[] {
  return sessionWeek(now).map((date) => ({ date, ...sessionBounds(date) }));
}

function bucketsIn(session: WeekSession, bucketMs: number): number {
  return Math.ceil((session.closeAt - session.openAt) / bucketMs);
}

/** Where `at` falls: its session and the bucket inside it, or undefined outside every session. */
function locate(
  sessions: readonly WeekSession[],
  at: number,
  bucketMs: number,
): { readonly s: number; readonly b: number } | undefined {
  const s = sessions.findIndex((x) => at >= x.openAt && at < x.closeAt);
  const session = sessions[s];
  return session ? { s, b: Math.floor((at - session.openAt) / bucketMs) } : undefined;
}

function emptyGrid<T>(sessions: readonly WeekSession[], bucketMs: number, fill: T): T[][] {
  return sessions.map((x) => Array.from({ length: bucketsIn(x, bucketMs) }, () => fill));
}

/** True once a bucket has begun — the grid draws nothing yet for one that has not. */
function begun(session: WeekSession, b: number, bucketMs: number, now: number): boolean {
  return session.openAt + b * bucketMs <= now;
}

function checkGrid(
  sessions: readonly WeekSession[],
  checks: readonly number[],
  bucketMs: number,
  now: number,
): (number | null)[][] {
  const grid: (number | null)[][] = sessions.map((x) =>
    Array.from({ length: bucketsIn(x, bucketMs) }, (_, b) =>
      begun(x, b, bucketMs, now) ? 0 : null,
    ),
  );
  for (const at of checks) {
    const where = locate(sessions, at, bucketMs);
    const row = where ? grid[where.s] : undefined;
    const count = where ? row?.[where.b] : undefined;
    if (where && row && typeof count === "number") row[where.b] = count + 1;
  }
  return grid;
}

/** Spans of each begun session with no check for longer than `staleMs`: open → first check, check →
 *  check, last check → the close (or now, for the session under way). */
function missedSpans(
  sessions: readonly WeekSession[],
  checks: readonly number[],
  now: number,
  staleMs: number,
): { from: number; to: number }[] {
  const gaps: { from: number; to: number }[] = [];
  for (const session of sessions) {
    if (session.openAt >= now) continue;
    const end = Math.min(session.closeAt, now);
    const inside = checks.filter((at) => at >= session.openAt && at < end);
    const marks = [session.openAt, ...inside, end];
    for (let i = 1; i < marks.length; i++) {
      const from = marks[i - 1] ?? 0;
      const to = marks[i] ?? 0;
      if (to - from > staleMs) gaps.push({ from, to });
    }
  }
  return gaps;
}

/** Which answer a playbook gave most in each bucket. A tie keeps the answer met first in the
 *  store's grouped order — rare, and either answer was true for half that half hour. */
function laneGrids(
  sessions: readonly WeekSession[],
  rows: CheckWeekRows["verdicts"],
  bucketMs: number,
): { playbookId: string; mode: PlaybookMode; states: (PlaybookVerdictState | null)[][] }[] {
  const lanes = new Map<
    string,
    {
      playbookId: string;
      mode: PlaybookMode;
      states: (PlaybookVerdictState | null)[][];
      best: Map<string, number>;
    }
  >();
  for (const row of rows) {
    const where = locate(sessions, row.bucket * bucketMs, bucketMs);
    if (!where) continue;
    const key = `${row.playbookId}\u0000${row.mode}`;
    let lane = lanes.get(key);
    if (!lane) {
      lane = {
        playbookId: row.playbookId,
        mode: row.mode,
        states: emptyGrid<PlaybookVerdictState | null>(sessions, bucketMs, null),
        best: new Map(),
      };
      lanes.set(key, lane);
    }
    const cell = `${where.s}:${where.b}`;
    if ((lane.best.get(cell) ?? 0) < row.n) {
      lane.best.set(cell, row.n);
      const target = lane.states[where.s];
      if (target) target[where.b] = row.state;
    }
  }
  return [...lanes.values()].map(({ playbookId, mode, states }) => ({ playbookId, mode, states }));
}

/**
 * `latest` is the heartbeat's own newest verdict pass, in its order: a lane that is one of them
 * carries its slot, so a card whose name is withheld still finds its lane. With the store unwired
 * the caller leaves the whole view off — a week of empty sessions would draw invented gaps.
 */
export function checkWeekView(
  rows: CheckWeekRows,
  now: Date,
  staleMs: number,
  latest: readonly { readonly playbookId: string; readonly mode: PlaybookMode }[] = [],
  bucketMs: number = WEEK_BUCKET_MS,
): CheckWeekView {
  const sessions = weekSessions(now);
  const at = now.getTime();
  const lanes = laneGrids(sessions, rows.verdicts, bucketMs).map((lane) => {
    const slot = latest.findIndex((v) => v.playbookId === lane.playbookId && v.mode === lane.mode);
    return slot >= 0 ? { ...lane, slot } : lane;
  });
  return {
    bucketMs,
    now: at,
    sessions,
    checks: checkGrid(sessions, rows.checks, bucketMs, at),
    gaps: missedSpans(sessions, rows.checks, at, staleMs),
    lanes,
    trades: rows.trades.filter((t) => locate(sessions, t.at, bucketMs) !== undefined),
  };
}
