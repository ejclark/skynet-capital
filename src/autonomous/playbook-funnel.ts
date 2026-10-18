import { isSession, sessionsBefore } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import type { PlaybookFunnelRows } from "./decision-db-playbook-funnel.js";
import { computeFunnel } from "./decision-funnel.js";

/**
 * EACH PLAYBOOK'S FUNNEL OVER ITS LAST SESSIONS (#4450 slice 5a, EARS 5): checks → asked to trade
 * → refused by a guard → placed → filled, per playbook and per session. The plan's brief was that
 * nearly every bot trade looked forced. The initiator split (slice 4) says how many trades a
 * playbook started; this says where a playbook's trades stop on the way: never asked, refused,
 * or placed and unfilled.
 *
 * NO "SIGNALS" STAGE YET, ON PURPOSE. The plan's funnel is checks → signals → … and a signal is
 * what #4808 has each playbook declare (an instrument and a threshold). Counting anything else as a
 * signal here would give the word a second meaning before #4808 lands; the stage slots in between
 * checks and asked when it does (slice 5b). "Asked to trade" is the nearest fact the store holds
 * today: the playbook raised an order intent.
 *
 * Sessions are New York trading days (`market-calendar.ts`). A check or intent on a weekend or a
 * holiday is outside every session and isn't counted; one after the close counts on that day.
 * Every session in the window gets a day, zeros included, so "asked on 2 of 10" is measured
 * against all ten rather than the days that happened to have rows.
 */

/** Ten sessions: the window slice 6's deciding question names ("over 10 trading days, on how
 *  many did no playbook raise a signal?"). */
export const FUNNEL_SESSIONS = 10;

export interface PlaybookFunnelCounts {
  /** Passes that consulted the playbook. */
  readonly checks: number;
  /** Order intents the playbook raised. */
  readonly asked: number;
  /** Intents a risk guard refused outright. */
  readonly refused: number;
  /** Intents the broker took. */
  readonly placed: number;
  /** Placed intents the broker confirmed filled. */
  readonly filled: number;
}

export interface PlaybookFunnelDay extends PlaybookFunnelCounts {
  /** `YYYY-MM-DD`, New York's calendar. */
  readonly date: string;
}

export interface PlaybookFunnelRow {
  readonly playbookId: string;
  /** The whole window. */
  readonly totals: PlaybookFunnelCounts;
  /** One per session, oldest first — the same dates as the view's `sessions`. */
  readonly days: readonly PlaybookFunnelDay[];
  /** Sessions on which it asked to trade at least once. */
  readonly askedOn: number;
  /** Refused intents by which guard fired; only reasons that occurred. */
  readonly refusalsByReason: Readonly<Partial<Record<GuardRefusalReason, number>>>;
}

export interface PlaybookFunnelView {
  /** The window, oldest first. */
  readonly sessions: readonly string[];
  readonly playbooks: readonly PlaybookFunnelRow[];
}

/** The newest `count` sessions up to and including `now`'s New York date, oldest first. */
export function funnelSessions(now: Date, count = FUNNEL_SESSIONS): string[] {
  const today = marketDayKey(now.toISOString());
  let at = isSession(today) ? today : sessionsBefore(today, 1);
  const dates = [at];
  while (dates.length < count) {
    at = sessionsBefore(at, 1);
    dates.unshift(at);
  }
  return dates;
}

/** The store window that covers `sessions`: from the oldest date's UTC midnight — hours before New
 *  York's — to `now`. Hours outside the sessions are dropped by the fold, never counted. */
export function funnelWindow(
  sessions: readonly string[],
  now: Date,
): { readonly from: number; readonly to: number } {
  const oldest = sessions[0] ?? marketDayKey(now.toISOString());
  return { from: Date.parse(`${oldest}T00:00:00Z`), to: now.getTime() + 1 };
}

const HOUR_MS = 3_600_000;
const ZERO: PlaybookFunnelCounts = { checks: 0, asked: 0, refused: 0, placed: 0, filled: 0 };

type Fate = PlaybookFunnelRows["intents"][number];

function counts(checks: number, fates: readonly Fate[]) {
  const funnel = computeFunnel(
    checks,
    0,
    fates.map((f) => ({ ...f, count: f.n })),
  );
  return {
    counts: {
      checks,
      asked: funnel.rawIntents,
      refused: funnel.rawIntents - funnel.survivedGuards,
      placed: funnel.placed,
      filled: funnel.filled,
    },
    refusalsByReason: funnel.refusalsByReason,
  };
}

/** The store's hour rows folded into sessions, one row per playbook that was checked or asked in
 *  the window, ordered by most asked, then most checked, then id. `keep` narrows which playbook
 *  ids are reported at all (the server keeps house pairs only). */
export function playbookFunnelView(
  rows: PlaybookFunnelRows,
  sessions: readonly string[],
  keep: (playbookId: string) => boolean = () => true,
): PlaybookFunnelView {
  const dayOf = new Map<number, string | undefined>();
  const inWindow = new Set(sessions);
  const sessionOf = (hour: number): string | undefined => {
    if (!dayOf.has(hour)) {
      const date = marketDayKey(new Date(hour * HOUR_MS).toISOString());
      dayOf.set(hour, inWindow.has(date) ? date : undefined);
    }
    return dayOf.get(hour);
  };
  // playbook → date → its checks and intent fates that day.
  const byPlaybook = new Map<string, Map<string, { checks: number; fates: Fate[] }>>();
  const cell = (playbookId: string, date: string) => {
    const days = byPlaybook.get(playbookId) ?? new Map();
    byPlaybook.set(playbookId, days);
    const day = days.get(date) ?? { checks: 0, fates: [] };
    days.set(date, day);
    return day;
  };
  for (const row of rows.checks) {
    const date = sessionOf(row.hour);
    if (date && keep(row.playbookId)) cell(row.playbookId, date).checks += row.n;
  }
  for (const row of rows.intents) {
    const date = sessionOf(row.hour);
    if (date && keep(row.playbookId)) cell(row.playbookId, date).fates.push(row);
  }

  const playbooks = [...byPlaybook].map(([playbookId, cells]): PlaybookFunnelRow => {
    const days = sessions.map((date): PlaybookFunnelDay => {
      const day = cells.get(date);
      return { date, ...(day ? counts(day.checks, day.fates).counts : ZERO) };
    });
    const all = [...cells.values()];
    const whole = counts(
      all.reduce((sum, day) => sum + day.checks, 0),
      all.flatMap((day) => day.fates),
    );
    return {
      playbookId,
      totals: whole.counts,
      days,
      askedOn: days.filter((day) => day.asked > 0).length,
      refusalsByReason: whole.refusalsByReason,
    };
  });
  playbooks.sort(
    (a, b) =>
      b.totals.asked - a.totals.asked ||
      b.totals.checks - a.totals.checks ||
      a.playbookId.localeCompare(b.playbookId),
  );
  return { sessions, playbooks };
}
