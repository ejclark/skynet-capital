/**
 * THE SIGNAL SCHEDULE (#4808 slice 2) — which instrument runs are owed today, read from what the
 * playbooks declare and from nothing else. Eric, 2026-10-07: "Playbooks offer a structured mechanic
 * to drive research." Slice 1 made each house playbook name the signals it trades on
 * (`research-signals.ts`); this turns those declarations × the pair table's tickers into a list of
 * runs, each on its own cadence. EARS 2: WHEN a playbook × symbol pair exists, schedule that pair's
 * signals on their declared cadence, and schedule no instrument nothing declares.
 *
 * "NOTHING UNDECLARED" IS STRUCTURAL, NOT CHECKED. `declaredRuns` is the only source of a run, and
 * it reads `researchOf`; there is no list of instruments elsewhere to drift from. A run is keyed by
 * its command with the ticker filled in, so two playbooks that name one study on one ticker (S1 and
 * the call spread both read NVDA's run-up) are ONE run owed to both, not two.
 *
 * The instruments are scripts and cost zero tokens, but each one fetches from a free data source
 * that rate-limits, so the same per-tick ceiling the event lane answers to (`research-dispatch-
 * budget.json`, through the work spigot's dial) bounds how many runs a tick hands out. Deferral is
 * not dropping: the remainder stays owed and rides the next tick in the same order.
 *
 * LAST-RUN RECORDS are one small file per run under `docs/research/signal-runs/`, so two lanes
 * recording different runs never touch one file (the #1449 lesson). A schedule only reads them; the
 * script that runs an instrument writes its record (`src/scripts/signal-schedule.ts --record`).
 *
 * The calendar research this does NOT replace: events keep their own lane. Narrowing that lane to
 * protected windows is slice 4, deferred behind decision 4's deciding question.
 */

import { daysUntil, type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { type Pair, pairTable } from "./pair-table.js";
import { type PlaybookResearch, researchOf, type SignalCadence } from "./research-signals.js";

/** A weekly signal is owed again once this many calendar days have passed since its last run. */
const WEEKLY_DAYS = 7;

/** One instrument run on one ticker, and every playbook that declared it. */
export interface SignalRun {
  /** The command with the ticker filled in — the run's identity and its record's key. */
  readonly key: string;
  readonly symbol: string;
  readonly cadence: SignalCadence;
  /** The playbooks whose declaration asked for this run, sorted. */
  readonly playbooks: readonly string[];
}

export type DueReason = "never-run" | "print-landed" | "week-elapsed";

export interface DueRun extends SignalRun {
  readonly reason: DueReason;
  /** The run's last record, absent when it has never run. */
  readonly lastRunOn?: string;
}

/** The day each run last happened, keyed by `SignalRun.key`. */
export type RunRecords = Readonly<Record<string, string>>;

export interface Schedule {
  /** What this tick hands out, most overdue first. */
  readonly dispatch: readonly DueRun[];
  /** Owed but over the ceiling — kept for the next tick, never dropped. */
  readonly deferred: readonly DueRun[];
}

/**
 * Every run the playbooks declare, one per distinct command × ticker. `lookup` is injectable so a
 * spec can feed a roster the house one does not hold; production passes nothing.
 */
export function declaredRuns(
  pairs: readonly Pair[] = pairTable(),
  lookup: (playbookId: string) => PlaybookResearch | undefined = researchOf,
): readonly SignalRun[] {
  const runs = new Map<string, { run: Omit<SignalRun, "playbooks">; playbooks: Set<string> }>();
  for (const pair of pairs) {
    const research = lookup(pair.id);
    if (research?.kind !== "signals") continue;
    for (const symbol of pair.symbols) {
      for (const signal of research.signals) {
        const key = signal.instrument.replace("<SYM>", symbol);
        const entry = runs.get(key) ?? {
          run: { key, symbol, cadence: signal.cadence },
          playbooks: new Set<string>(),
        };
        entry.playbooks.add(pair.id);
        runs.set(key, entry);
      }
    }
  }
  return [...runs.values()]
    .map(({ run, playbooks }) => ({ ...run, playbooks: [...playbooks].sort() }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** The most recent confirmed print of `symbol` that has already happened (day D is after the
 *  close, so D itself is not yet a landed print). An estimate is not a print that landed. */
function latestLandedPrint(
  symbol: string,
  today: string,
  prints: readonly EarningsPrint[],
): EarningsPrint | undefined {
  return prints
    .filter((p) => p.symbol === symbol && p.status === "confirmed" && daysUntil(today, p.date) < 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** Why a run is owed today, or undefined when it is not. */
function dueReason(
  run: SignalRun,
  lastRunOn: string | undefined,
  today: string,
  prints: readonly EarningsPrint[],
): DueReason | undefined {
  if (lastRunOn === undefined) return "never-run";
  if (run.cadence === "weekly") {
    return daysUntil(lastRunOn, today) >= WEEKLY_DAYS ? "week-elapsed" : undefined;
  }
  // A print-keyed study only changes when a report lands: owed if the last run predates the latest
  // report that has come out since.
  const landed = latestLandedPrint(run.symbol, today, prints);
  return landed && lastRunOn <= landed.date ? "print-landed" : undefined;
}

/**
 * The runs owed on `today`, ranked and cut to `cap`. A run that has never happened leads, then the
 * longest-waiting, then by key — a total order, so the same inputs always hand out the same runs.
 * `today` is an ET market day key (YYYY-MM-DD).
 */
export function scheduleSignals(args: {
  readonly runs: readonly SignalRun[];
  readonly records: RunRecords;
  readonly today: string;
  readonly cap: number;
  readonly prints?: readonly EarningsPrint[];
}): Schedule {
  const { runs, records, today, cap, prints = UPCOMING_PRINTS } = args;
  const owed: DueRun[] = [];
  for (const run of runs) {
    const lastRunOn = records[run.key];
    const reason = dueReason(run, lastRunOn, today, prints);
    if (reason) owed.push({ ...run, reason, ...(lastRunOn ? { lastRunOn } : {}) });
  }
  owed.sort(
    (a, b) => (a.lastRunOn ?? "").localeCompare(b.lastRunOn ?? "") || a.key.localeCompare(b.key),
  );
  const room = Math.max(0, cap);
  return { dispatch: owed.slice(0, room), deferred: owed.slice(room) };
}

/** The file a run's record lives in, under `docs/research/signal-runs/`: `earnings-cycle--NVDA`. */
export function recordName(run: Pick<SignalRun, "key" | "symbol">): string {
  const script = run.key.split(" ")[1] ?? "";
  return `${script
    .split("/")
    .pop()
    ?.replace(/\.mjs$/, "")}--${run.symbol}.json`;
}
