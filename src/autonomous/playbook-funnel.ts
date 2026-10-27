import { isSession, sessionsBefore } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import { findPair } from "../playbooks/pair-table.js";
import { type PassSignal, passSignalOf } from "../playbooks/research-signals.js";
import type { PlaybookFunnelRows } from "./decision-db-playbook-funnel.js";
import { computeFunnel } from "./decision-funnel.js";

/**
 * EACH PLAYBOOK'S FUNNEL OVER ITS LAST SESSIONS (#4450 slices 5a–5b, EARS 5): checks → signals
 * raised → asked to trade → refused by a guard → placed → filled, per playbook and per session. The plan's brief was that
 * nearly every bot trade looked forced. The initiator split (slice 4) says how many trades a
 * playbook started; this says where a playbook's trades stop on the way: never asked, refused,
 * or placed and unfilled.
 *
 * A SIGNAL IS A DECLARED ONE (#4808 slice 1, `research-signals.ts`), so the word keeps one meaning.
 * A pass raised one when the playbook's verdict was `long` AND its declared signal is one the pass
 * computes (`raisedOnPass` — the run-up window S1, G1 and the call spread read). Every other
 * playbook gets `null` for the stage, never 0: the wheel and the dip-to-bounce pairs declare signals
 * only a research run measures (`unmeasured`), and a playbook declaring no research signal raises
 * none by definition (`none`). A zero there would read as "looked and found nothing". The stage is
 * a count beside the others, not a strict filter: an exit order can be asked for with no signal.
 *
 * Sessions are New York trading days (`market-calendar.ts`). A check or intent on a weekend or a
 * holiday is outside every session and isn't counted; one after the close counts on that day.
 * Every session in the window gets a day, zeros included, so "asked on 2 of 10" is measured
 * against all ten rather than the days that happened to have rows.
 */

/** Ten sessions: the window slice 6's deciding question names ("over 10 trading days, on how
 *  many did no playbook raise a signal?"). */
const FUNNEL_SESSIONS = 10;

interface PlaybookFunnelCounts {
  /** Passes that consulted the playbook. */
  readonly checks: number;
  /** Passes on which it raised its declared signal; null when no pass can measure that. */
  readonly signals: number | null;
  /** Order intents the playbook raised. */
  readonly asked: number;
  /** Intents a risk guard refused outright. */
  readonly refused: number;
  /** Intents the broker took. */
  readonly placed: number;
  /** Placed intents the broker confirmed filled. */
  readonly filled: number;
}

interface PlaybookFunnelDay extends PlaybookFunnelCounts {
  /** `YYYY-MM-DD`, New York's calendar. */
  readonly date: string;
}

export interface PlaybookFunnelRow {
  readonly playbookId: string;
  /** The whole window. */
  readonly totals: PlaybookFunnelCounts;
  /** One per session, oldest first — the same dates as the view's `sessions`. */
  readonly days: readonly PlaybookFunnelDay[];
  /** Whether a pass can count its signal — why `signals` is a number or null. */
  readonly passSignal: PassSignal;
  /** Sessions on which it raised its signal at least once; null with `signals`. */
  readonly signalledOn: number | null;
  /** Sessions on which it asked to trade at least once. */
  readonly askedOn: number;
  /** Refused intents by which guard fired; only reasons that occurred. */
  readonly refusalsByReason: Readonly<Partial<Record<GuardRefusalReason, number>>>;
}

export interface PlaybookFunnelView {
  /** The window, oldest first. */
  readonly sessions: readonly string[];
  readonly playbooks: readonly PlaybookFunnelRow[];
  /** Sessions on which any reported playbook raised a signal — slice 6's deciding question ("over
   *  10 trading days, on how many did no playbook raise a signal?") is `sessions` minus this. Only
   *  `counted` playbooks can add to it. */
  readonly signalledSessions: number;
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
type Fate = PlaybookFunnelRows["intents"][number];

function counts(checks: number, signals: number | null, fates: readonly Fate[]) {
  const funnel = computeFunnel(
    checks,
    0,
    fates.map((f) => ({ ...f, count: f.n })),
  );
  return {
    counts: {
      checks,
      signals,
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
  // playbook → date → its checks, signals and intent fates that day.
  const byPlaybook = new Map<
    string,
    Map<string, { checks: number; signals: number; fates: Fate[] }>
  >();
  const cell = (playbookId: string, date: string) => {
    const days = byPlaybook.get(playbookId) ?? new Map();
    byPlaybook.set(playbookId, days);
    const day = days.get(date) ?? { checks: 0, signals: 0, fates: [] };
    days.set(date, day);
    return day;
  };
  for (const row of rows.checks) {
    const date = sessionOf(row.hour);
    if (!(date && keep(row.playbookId))) continue;
    const day = cell(row.playbookId, date);
    day.checks += row.n;
    day.signals += row.signals;
  }
  for (const row of rows.intents) {
    const date = sessionOf(row.hour);
    if (date && keep(row.playbookId)) cell(row.playbookId, date).fates.push(row);
  }

  const playbooks = [...byPlaybook].map(([playbookId, cells]): PlaybookFunnelRow => {
    const passSignal = passSignalOf(playbookId);
    const signalsOf = (n: number) => (passSignal === "counted" ? n : null);
    const days = sessions.map((date): PlaybookFunnelDay => {
      const day = cells.get(date) ?? { checks: 0, signals: 0, fates: [] };
      return { date, ...counts(day.checks, signalsOf(day.signals), day.fates).counts };
    });
    const all = [...cells.values()];
    const whole = counts(
      all.reduce((sum, day) => sum + day.checks, 0),
      signalsOf(all.reduce((sum, day) => sum + day.signals, 0)),
      all.flatMap((day) => day.fates),
    );
    return {
      playbookId,
      totals: whole.counts,
      days,
      passSignal,
      signalledOn: signalsOf(days.filter((day) => (day.signals ?? 0) > 0).length),
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
  const signalledSessions = sessions.filter((_, i) =>
    playbooks.some((p) => (p.days[i]?.signals ?? 0) > 0),
  ).length;
  return { sessions, playbooks, signalledSessions };
}

/** Each house playbook's funnel, read now — the Research card's view, and what the forced pick
 *  reads before it fires (`scout-stand-down.ts`). House pairs only (`findPair`): a member's authored
 *  `U-*` play is theirs, and its activity is not the house's to publish. */
export function readHouseFunnel(
  playbookFunnel: (from: number, to: number) => PlaybookFunnelRows,
  now = new Date(),
): PlaybookFunnelView {
  const sessions = funnelSessions(now);
  const { from, to } = funnelWindow(sessions, now);
  return playbookFunnelView(playbookFunnel(from, to), sessions, (id) => findPair(id) !== undefined);
}
