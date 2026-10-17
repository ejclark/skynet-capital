/**
 * CLI: study a conviction's claims once, through the research budget (#5482 slice 3).
 *
 *   npm run research:claims                      # every stored conviction
 *   npm run research:claims -- ai-dip-2026-10    # one
 *   npm run research:claims -- --dry             # plan only: what would run, what is offered
 *   npm run research:claims -- --cap 1           # run at most 1 instrument (can only lower the dial)
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
import {
  type RunnerDeps,
  type RunnerResult,
  runClaimStudies,
  type StudyRunOutput,
  type StudyRunRequest,
} from "../playbooks/claim-study-runner.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";

const run = promisify(execFile);
const ROOT = process.cwd();
const LEDGER_PATH = join(ROOT, "src", "playbooks", "conviction-studies.json");
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

const flag = (argv: readonly string[], name: string): string | undefined => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
};

/** The claim's own label in its call sheet ("2a"), else its position. */
const labelOf = (conviction: Conviction, position: number): string =>
  conviction.claims[position - 1]?.statement.match(/^(\d+[a-z]?)\./)?.[1] ?? String(position);

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

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const dry = argv.includes("--dry");
  const ids = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--cap");
  const convictions = ids.length > 0 ? ids.map((id) => CONVICTIONS.get(id)) : CONVICTIONS.all();
  if (convictions.some((c) => c === undefined)) {
    console.error(`no such conviction: ${ids.join(", ")}`);
    return 1;
  }

  const dial = researchCapNow();
  const asked = flag(argv, "cap");
  const cap = asked === undefined ? dial : Math.min(dial, Number(asked));
  if (!Number.isInteger(cap) || cap < 0) {
    console.error(`--cap must be a whole number of runs, got ${asked}`);
    return 1;
  }

  const deps: RunnerDeps = { dataDate, execute };
  let ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as Record<string, unknown>;
  let used = 0;
  for (const conviction of convictions) {
    if (!conviction) continue;
    // One pass shares the budget: what an earlier conviction used, a later one cannot.
    const result = await runClaimStudies(conviction, deps, { cap: Math.max(0, cap - used), dry });
    used += result.budget.used;
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
    ledger = { ...ledger, [conviction.id]: result.entries };
  }
  if (!dry) {
    mkdirSync(join(ROOT, "src", "playbooks"), { recursive: true });
    const sorted = Object.fromEntries(
      Object.entries(ledger).sort(([a], [b]) => a.localeCompare(b)),
    );
    writeFileSync(LEDGER_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`wrote ${LEDGER_PATH}`);
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exit(await main());
