/**
 * CLI: keep the forward earnings calendar current, rewriting `UPCOMING_PRINTS` in
 * earnings-calendar.ts in place (#4479). Two jobs, both in `src/research/print-date-refresh.ts`:
 *   - confirm a near estimate when Nasdaq's earnings-date page calls it the company's date (`CAL:`
 *     source, one hop from the announcement — distinct from a hand-verified `IR:` citation), never
 *     when it is Zacks' algorithmic guess;
 *   - move an estimate to a company date off it (still an estimate, window over both days,
 *     `ledgerId` kept) and report it — with every other company date it did not confirm — as
 *     NEEDS IR;
 *   - add a cadence estimate for a playbook symbol (S1-NVDA, G1-GOOG) with no print in ~100 days.
 *
 * It only ever edits a checked-in, reviewed table — never credentials, never an order — and its
 * output ships as an ordinary auto-merge-on-green PR, like any other plumbing change.
 *
 * SOURCE: api.nasdaq.com/api/analyst/<SYM>/earnings-date, one request per candidate symbol. It
 * replaced the by-date calendar (api/calendar/earnings), which lists confirmed dates and Zacks'
 * guesses alike — so on 2026-10-19 it would have "confirmed" NVDA's and CRWV's estimates. Wants
 * browser-like headers (verified live 2026-08-12; Node's fetch answered 200 on 2026-10-19).
 *
 * Usage:
 *   tsx src/scripts/confirm-print-dates.ts            # confirms/fills + rewrites the file
 *   tsx src/scripts/confirm-print-dates.ts --dry-run   # reports what WOULD change, writes nothing
 *
 * Exit 2 when every fetch failed (nothing was checked); exit 3 when a playbook symbol's fetch
 * failed (the print this exists for went unchecked). The last line is always `outcome: <word>`
 * (`unreachable` · `needs-ir` · `found` · `none`), also written to `$GITHUB_OUTPUT` when a job runs it.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { G1_GOOG, S1_NVDA } from "../playbooks/registry.js";
import {
  cadenceFills,
  fetchEarningsDate,
  type NeedsIr,
  refreshExitCode,
  rewriteCalendar,
  runConfirm,
} from "../research/print-date-refresh.js";

const CALENDAR_FILE = join(process.cwd(), "src", "domain", "earnings-calendar.ts");
const PLAYBOOK_SYMBOLS = [...S1_NVDA.symbols, ...G1_GOOG.symbols];

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const today = new Date().toISOString().slice(0, 10);
  const log = (line: string): void => console.log(`[confirm-print-dates] ${line}`);

  const result = await runConfirm(UPCOMING_PRINTS, today, (symbol) =>
    fetchEarningsDate(symbol, { fetch, sleep, log: (line) => console.warn(line) }),
  );
  log(
    result.checked.length === 0
      ? "no estimate inside the confirm lookahead."
      : `checked ${result.checked.map((p) => `${p.symbol} ${p.date}`).join(", ")}.`,
  );
  for (const { to } of result.updates)
    if (to.status === "confirmed") log(`${to.symbol}: CONFIRMED ${to.date}.`);
  for (const { print, said, why } of result.needsIr)
    console.warn(
      `[confirm-print-dates] NEEDS IR — ${print.symbol} ${print.date}: ${NEEDS_IR_WORDS[why](said)}`,
    );
  for (const symbol of result.failed)
    console.warn(
      `[confirm-print-dates] UNCHECKED — ${symbol}: no readable answer${PLAYBOOK_SYMBOLS.includes(symbol) ? " (a playbook symbol: this run is not a clean pass)" : ""}.`,
    );

  const exitCode = refreshExitCode(result, PLAYBOOK_SYMBOLS);
  if (result.outcome === "unreachable") {
    console.error(
      `[confirm-print-dates] SOURCE UNREACHABLE — all ${result.attempts} earnings-date fetches failed. ` +
        "Nothing was checked; do not treat this run as a clean pass.",
    );
    finish(result.outcome, exitCode);
    return;
  }

  const fills = cadenceFills(UPCOMING_PRINTS, PLAYBOOK_SYMBOLS, today);
  for (const f of fills)
    log(`${f.symbol}: no print in ~100 days — ESTIMATED ${f.date} from cadence.`);

  const changes = result.updates.length + fills.length;
  const answered = `${result.attempts - result.failures}/${result.attempts} symbol fetches answered`;
  if (changes === 0) log(`nothing to change (${answered}).`);
  else if (dryRun) log(`--dry-run: would change ${changes} row(s) (${answered}); nothing written.`);
  else {
    writeFileSync(
      CALENDAR_FILE,
      rewriteCalendar(readFileSync(CALENDAR_FILE, "utf8"), result.updates, fills),
    );
    execFileSync("npx", ["biome", "format", "--write", CALENDAR_FILE], { stdio: "inherit" });
    log(`wrote ${changes} row(s) to ${CALENDAR_FILE} (${answered}).`);
  }
  finish(result.outcome, exitCode);
}

/** What each NEEDS IR line says, in words a reader acts on. */
const NEEDS_IR_WORDS: Record<NeedsIr["why"], (said: string) => string> = {
  moved: (said) =>
    `the company's date is ${said}; moved there as an estimate, window over both days. An IR read confirms it.`,
  held: (said) =>
    `the company's date is still ${said}, where an earlier run moved it; one source does not confirm a move. An IR read confirms it.`,
  far: (said) =>
    `the company's date is ${said}, too far off to be this print; left alone. Read IR for which quarter it is.`,
  past: (said) =>
    `the company's date ${said} has passed while the estimate's window is still open; left alone. Read IR.`,
};

/** The last line a job reads: the outcome word, and the exit code that goes with it. */
function finish(outcome: string, exitCode: number): void {
  console.log(
    `[confirm-print-dates] outcome: ${outcome}${exitCode !== 0 ? ` (exit ${exitCode})` : ""}`,
  );
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `outcome=${outcome}\n`);
  process.exitCode = exitCode;
}

main().catch((error) => {
  console.error("[confirm-print-dates] failed:", error);
  process.exit(1);
});
