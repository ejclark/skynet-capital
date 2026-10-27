/**
 * CLI: study a conviction's claims once, through the research budget (#5482 slice 3).
 *
 *   npm run research:claims                      # every stored conviction
 *   npm run research:claims -- ai-dip-2026-10    # one
 *   npm run research:claims -- --dry             # plan only: what would run, what is offered
 *   npm run research:claims -- --cap 1           # run at most 1 instrument (can only lower the dial)
 *   npm run research:claims -- --score-only      # score against the studies on file; run none
 *   npm run research:claims -- --event <id>      # the event lane's door: see below
 *
 * THE EVENT LANE'S DOOR (#5482). Nothing ran this pass on a schedule, and by standing rule nothing
 * here runs on a clock: a merge is the tick. The event lane is already re-dispatched the day a
 * registered forward test is due (`forward-test-due`, EVENT-RESEARCH.md), and a conviction's
 * proposals put a row on its claims' due days, so the session that scores a row runs this with
 * `--event <its-event-id>`. That selects only the stored convictions whose claims read that event's
 * forward tests (none: it writes nothing), and it implies `--score-only`, because a study re-run is
 * not a score: claim 7's cycle-phase floor band is CRWV-WHEEL's live strike ceiling
 * (`conviction-steering.ts`), and an unattended research PR must never move a pair's settings. A
 * score-only pass leaves `conviction-studies.json` untouched, so a `rerun` claim stays pending until
 * a full pass re-runs its study.
 *
 * For each claim it asks `planClaim` which house instrument (if any) measures what the claim
 * asserts, runs that instrument ONCE per symbol on the data the tape holds, and writes the verdict
 * to `src/playbooks/conviction-studies.json`, which the conviction store attaches to the claim. A
 * claim already studied for the same data date is not re-run. A claim no instrument measures is
 * offered a forward test (the event lane registers it; this script writes none of their ledgers) or
 * labelled untestable at size zero.
 *
 * The run count is bounded by the research lane's dial: `researchCapNow()`, which is
 * `research-dispatch-budget.json` at `normal` and `work-mode.json`'s number at every other position,
 * and an unreadable dial reads as `conserve` (never unlimited). `--cap` may only lower it.
 *
 * It then scores each claim against its own dated falsifier (`claim-score.ts`, #5482 slice 5) and
 * writes pass / fail / pending to `src/playbooks/conviction-scores.json`, so a claim whose day has
 * come, or whose study was just re-run, is scored in the same pass.
 *
 * Network: only through the instruments' own cached fetchers (Yahoo bars, SEC EDGAR, the Cboe
 * chain). Paper only, educational; nothing here routes an order or sizes a trade.
 */
import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { researchCapNow } from "../../scripts/moneypenny/events.mjs";
import { bars } from "../../scripts/research/market-data.mjs";
import { premiumFit } from "../../scripts/research/premium-fit.mjs";
import { claimLabel, type ScoreLedgerEntry } from "../playbooks/claim-score.js";
import type { StudyLedgerEntry } from "../playbooks/claim-studies.js";
import {
  type RunnerDeps,
  type RunnerResult,
  runClaimStudies,
  type StudyRunOutput,
  type StudyRunRequest,
} from "../playbooks/claim-study-runner.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";
import { readsEvent, scoreConviction } from "./claim-scoring-run.js";
import { flag } from "./cli-flag.js";

const run = promisify(execFile);
const ROOT = process.cwd();
const LEDGER_PATH = join(ROOT, "src", "playbooks", "conviction-studies.json");
const SCORES_PATH = join(ROOT, "src", "playbooks", "conviction-scores.json");
const MAX_BUFFER = 64 * 1024 * 1024;

/** The last session the symbol's cached tape holds. */
async function dataDate(symbol: string): Promise<string> {
  const tape = await bars(symbol);
  const last = tape.at(-1);
  if (!last) throw new Error(`no price history for ${symbol}`);
  return last.date;
}

async function execute(request: StudyRunRequest): Promise<StudyRunOutput> {
  const { instrument, symbol, dataDate: today } = request;
  if (instrument === "premium-fit") {
    // `today` is the data date, so the chain the instrument reads is the one cached for that day.
    const finding = (await premiumFit(symbol, { today })) as { asOf?: string };
    return { output: finding, ...(finding.asOf ? { dataAsOf: finding.asOf } : {}) };
  }
  if (instrument === "earnings-cycle") {
    const { stdout } = await run(
      process.execPath,
      ["scripts/research/earnings-cycle.mjs", symbol],
      { cwd: ROOT, maxBuffer: MAX_BUFFER },
    );
    return { output: stdout };
  }
  // cycle-phase is a script with no exports: it writes its reading as JSON to the path it is given.
  const dir = mkdtempSync(join(tmpdir(), "claim-studies-"));
  try {
    const out = join(dir, "cycle-phase.json");
    await run(process.execPath, ["scripts/research/cycle-phase.mjs", symbol, `--json=${out}`], {
      cwd: ROOT,
      maxBuffer: MAX_BUFFER,
    });
    const reading = JSON.parse(readFileSync(out, "utf8")) as {
      today?: { options?: { asOf?: string } };
    }[];
    const asOf = reading[0]?.today?.options?.asOf;
    return { output: reading, ...(asOf ? { dataAsOf: asOf } : {}) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The claim's own label in its call sheet ("2a"), else its position. */
const labelOf = (conviction: Conviction, position: number): string =>
  claimLabel(conviction.claims[position - 1]?.statement ?? "", position);

function describe(result: RunnerResult, conviction: Conviction): string[] {
  const lines = result.runs.map((r) => {
    const labels = r.claims.map((n) => labelOf(conviction, n)).join(", ");
    const claims = `claim${r.claims.length > 1 ? "s" : ""} ${labels}`;
    const tail = r.error ? ` (${r.error})` : "";
    return `  ${r.outcome.padEnd(8)} ${r.instrument} ${r.symbol} @ ${r.dataDate ?? "?"} for ${claims}${tail}`;
  });
  const { cap, used, deferred } = result.budget;
  lines.push(`  budget: ${used} of ${cap} run(s) used, ${deferred} deferred to a later pass`);
  return lines;
}

type Selection =
  | { readonly convictions: readonly Conviction[]; readonly scoreOnly: boolean }
  | { readonly exit: number };

/** Which convictions this pass reads, and whether it may run studies; or the exit code that ends
 *  it. `--event` keeps only the convictions whose claims read that event and implies scores only. */
function select(argv: readonly string[]): Selection {
  const event = flag(argv, "event");
  if (argv.includes("--event") && (event === undefined || event.startsWith("--"))) {
    console.error("--event needs an event id");
    return { exit: 1 };
  }
  const ids = argv.filter(
    (a, i) => !a.startsWith("--") && argv[i - 1] !== "--cap" && argv[i - 1] !== "--event",
  );
  const named = ids.length > 0 ? ids.map((id) => CONVICTIONS.get(id)) : CONVICTIONS.all();
  const found = named.filter((c): c is Conviction => c !== undefined);
  if (found.length < named.length) {
    console.error(`no such conviction: ${ids.join(", ")}`);
    return { exit: 1 };
  }
  if (event === undefined) return { convictions: found, scoreOnly: argv.includes("--score-only") };
  const convictions = found.filter((c) => readsEvent(c, event));
  if (convictions.length === 0) {
    console.log(`no stored conviction scores from ${event}'s forward tests; nothing written`);
    return { exit: 0 };
  }
  return { convictions, scoreOnly: true };
}

/** Run one conviction's studies within what is left of the budget, and say what each claim got. */
async function study(
  conviction: Conviction,
  deps: RunnerDeps,
  cap: number,
  dry: boolean,
): Promise<RunnerResult> {
  const result = await runClaimStudies(conviction, deps, { cap, dry });
  console.log(`${conviction.id} (${conviction.claims.length} claims)`);
  for (const line of describe(result, conviction)) console.log(line);
  result.entries.forEach((entry) => {
    const n = conviction.claims.findIndex((c) => c.statement === entry.statement) + 1;
    const s = entry.study;
    const what =
      s.disposition === "studied"
        ? `${s.verdict.reading} (${s.verdict.confidence}) ${s.verdict.call}`
        : s.disposition === "offer"
          ? `offer to register a forward test, score by ${s.forwardTest.scoreBy}`
          : "untestable, size zero";
    console.log(`  claim ${labelOf(conviction, n)}: ${s.disposition} — ${what}`);
  });
  return result;
}

/** A ledger written with its convictions in id order, so a re-run diffs only what moved. */
function writeLedger(path: string, ledger: Record<string, unknown>): void {
  const sorted = Object.fromEntries(Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(path, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`wrote ${path}`);
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const dry = argv.includes("--dry");
  const selection = select(argv);
  if ("exit" in selection) return selection.exit;
  const { convictions, scoreOnly } = selection;

  const dial = researchCapNow();
  const asked = flag(argv, "cap");
  const cap = asked === undefined ? dial : Math.min(dial, Number(asked));
  if (!Number.isInteger(cap) || cap < 0) {
    console.error(`--cap must be a whole number of runs, got ${asked}`);
    return 1;
  }

  const deps: RunnerDeps = { dataDate, execute };
  let ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as Record<string, unknown>;
  let scores = JSON.parse(readFileSync(SCORES_PATH, "utf8")) as Record<
    string,
    readonly ScoreLedgerEntry[]
  >;
  let used = 0;
  for (const conviction of convictions) {
    let studies = (ledger[conviction.id] ?? []) as readonly StudyLedgerEntry[];
    if (scoreOnly) {
      // Score against the studies on file; the studies ledger is neither re-run nor rewritten.
      console.log(`${conviction.id} (${conviction.claims.length} claims), scores only`);
    } else {
      // One pass shares the budget: what an earlier conviction used, a later one cannot.
      const result = await study(conviction, deps, Math.max(0, cap - used), dry);
      used += result.budget.used;
      studies = result.entries;
      ledger = { ...ledger, [conviction.id]: studies };
    }
    // Scoring follows the studies: a re-run just written feeds the `rerun` check, and a claim whose
    // day has come is read against its falsifier. Nothing here sizes a trade or edits a pair.
    const scoring = await scoreConviction(conviction, studies);
    console.log("  scores:");
    for (const line of scoring.lines) console.log(line);
    scores = { ...scores, [conviction.id]: scoring.entries };
  }
  if (!dry) {
    mkdirSync(join(ROOT, "src", "playbooks"), { recursive: true });
    if (!scoreOnly) writeLedger(LEDGER_PATH, ledger);
    writeLedger(SCORES_PATH, scores);
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exit(await main());
