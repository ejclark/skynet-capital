/**
 * CLI: which declared research signals are owed today, and the record that a run happened
 * (#4808 slice 2).
 *
 *   npm run research:signals                         # the schedule, in words
 *   npm run research:signals -- --json               # the same, as JSON for a workflow step
 *   npm run research:signals -- --cap 1              # hand out at most 1 (can only lower the dial)
 *   npm run research:signals -- --record "node scripts/research/premium-fit.mjs CRWV"
 *                                                    # a run happened today; --on YYYY-MM-DD to backdate
 *
 * The schedule reads only what the playbooks declare (`signal-schedule.ts`), so an instrument
 * nobody declares is never listed, and `--record` refuses one for the same reason. The count a tick
 * hands out is the research lane's ceiling: `researchCapNow()`, which is
 * `research-dispatch-budget.json` at `normal` and `work-mode.json`'s number at every other position,
 * and an unreadable dial reads as `conserve` (never unlimited). This script runs no instrument and
 * spends no tokens; it says which runs are owed, and notes the ones that happened.
 *
 * Paper only, educational: nothing here routes an order or sizes a trade.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { researchCapNow } from "../../scripts/moneypenny/events.mjs";
import { marketDayKey } from "../domain/market-day.js";
import {
  type DueRun,
  declaredRuns,
  type RunRecords,
  recordName,
  scheduleSignals,
} from "../playbooks/signal-schedule.js";

const RECORDS_DIR = join(process.cwd(), "docs", "research", "signal-runs");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const flag = (argv: readonly string[], name: string): string | undefined => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
};

/** Every record on disk, keyed by the run's command. An unreadable file throws — a broken record
 *  must not read as "never ran" and buy a run the lane already made. */
export function readRecords(dir: string = RECORDS_DIR): RunRecords {
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => n.endsWith(".json"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
  const records: Record<string, string> = {};
  for (const name of names) {
    const { instrument, on } = JSON.parse(readFileSync(join(dir, name), "utf8")) as {
      instrument?: string;
      on?: string;
    };
    if (!(instrument && on && DATE_RE.test(on))) {
      throw new Error(
        `signal-schedule: ${name} is not a run record (needs "instrument" and "on").`,
      );
    }
    records[instrument] = on;
  }
  return records;
}

const REASON_WORDS: Readonly<Record<DueRun["reason"], string>> = {
  "never-run": "never run",
  "print-landed": "a report landed since the last run",
  "week-elapsed": "a week since the last run",
};

const describe = (run: DueRun): string =>
  `${run.key}  — ${REASON_WORDS[run.reason]}${run.lastRunOn ? ` (${run.lastRunOn})` : ""}; for ${run.playbooks.join(", ")}`;

export interface Deps {
  readonly dir?: string;
  /** This tick's ceiling; production reads the work spigot's dial. */
  readonly cap?: () => number;
  /** The ET market day, YYYY-MM-DD. */
  readonly today?: () => string;
  readonly out?: (line: string) => void;
  readonly err?: (line: string) => void;
}

export function main(argv: readonly string[] = process.argv.slice(2), deps: Deps = {}): number {
  const dir = deps.dir ?? RECORDS_DIR;
  const out = deps.out ?? ((line: string) => console.log(line));
  const err = deps.err ?? ((line: string) => console.error(line));
  const today = deps.today?.() ?? marketDayKey(new Date().toISOString());
  const runs = declaredRuns();

  const recorded = flag(argv, "record");
  if (argv.includes("--record")) {
    const run = runs.find((r) => r.key === recorded);
    if (!run) {
      err(
        `signal-schedule: no playbook declares "${recorded ?? ""}", so it is not a run to record.`,
      );
      return 1;
    }
    const on = flag(argv, "on") ?? today;
    if (!DATE_RE.test(on)) {
      err(`signal-schedule: --on must be YYYY-MM-DD, got ${on}.`);
      return 1;
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, recordName(run)),
      `${JSON.stringify({ instrument: run.key, on }, null, 2)}\n`,
    );
    out(`recorded ${run.key} on ${on}`);
    return 0;
  }

  const dial = deps.cap?.() ?? researchCapNow();
  const asked = flag(argv, "cap");
  const cap = asked === undefined ? dial : Math.min(dial, Number(asked));
  if (!Number.isInteger(cap) || cap < 0) {
    err(`signal-schedule: --cap must be a whole number of runs, got ${asked}`);
    return 1;
  }
  const schedule = scheduleSignals({ runs, records: readRecords(dir), today, cap });

  if (argv.includes("--json")) {
    out(JSON.stringify(schedule.dispatch, null, 2));
    return 0;
  }
  out(
    `${runs.length} declared run(s); ${schedule.dispatch.length + schedule.deferred.length} owed on ${today}.`,
  );
  for (const run of schedule.dispatch) out(`  run     ${describe(run)}`);
  for (const run of schedule.deferred) out(`  later   ${describe(run)}`);
  if (schedule.deferred.length > 0) {
    out(`${schedule.deferred.length} deferred to a later tick (ceiling ${cap}).`);
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exit(main());
