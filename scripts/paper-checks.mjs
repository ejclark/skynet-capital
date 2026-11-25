// Test nine Alpaca paper limits on a dedicated paper test account, date each answer, and cancel
// every order it places (#8256, shape 5 of #8161). The checks, the guard and the cleanup live in
// src/alpaca/paper-checks/ (so tests/arch/paper-only.spec.ts scans them); this file is the process:
// flags, signals, writing the dated record, the exit code.
//
// Usage: npm run paper:checks -- [--only <id,id>] [--dry-run] [--same-day-qty <n>]
//
// Credentials — read from these two variables ONLY, with no fallback (documented here and in
// docs/research/alpaca-paper-checks/README.md, because .env.example is a protected path):
//   SKYNET_PAPER_CHECK_KEY     the key of a paper account used for nothing but these checks
//   SKYNET_PAPER_CHECK_SECRET  its secret
// Never a member's key, a bot's key, Eric's own account or a Connect token.
//
// Exit codes: 2 refused before placing anything; 1 something it placed is still open after
// cleanup (the ids are in the results file), or the broker couldn't be read; 130 interrupted and
// cleaned up; 0 otherwise. A broker refusal is an answer, never a
// failure. Run logs are public: only check ids, outcomes and the broker's words are printed.
import { join } from "node:path";
import { parseOnly } from "../src/alpaca/paper-checks/catalog.ts";
import {
  credentialsFrom,
  dryRunTransport,
  PaperCheckRefused,
  redactor,
  transportsFor,
} from "../src/alpaca/paper-checks/guard.ts";
import { RESULTS_DIR, writeResults } from "../src/alpaca/paper-checks/results.ts";
import { createRun } from "../src/alpaca/paper-checks/run.ts";
import { etDate } from "../src/alpaca/paper-checks/windows.ts";
import { campaignById, castSymbols } from "../src/domain/campaigns.ts";
import { reexecWithProxy } from "./proxy-reexec.mjs";

reexecWithProxy();

function flag(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
}

function fail(code, message) {
  process.stderr.write(`paper-checks: ${message}\n`);
  process.exit(code);
}

let only;
try {
  only = parseOnly(flag("--only"));
} catch (error) {
  fail(2, error.message);
}
const dryRun = process.argv.includes("--dry-run");
const sameDayQty = Number(flag("--same-day-qty") ?? 25);
if (!(Number.isInteger(sameDayQty) && sameDayQty > 0))
  fail(2, "--same-day-qty takes a whole number");

let credentials;
try {
  credentials = credentialsFrom(process.env);
} catch (error) {
  fail(2, error instanceof PaperCheckRefused ? error.message : String(error));
}

const campaign = campaignById("ai-buildout");
// The key and secret from the start; the account's id and number as soon as the guard reads them.
const scrub = (text) => {
  const account = run.secrets();
  const secrets = [credentials.apiKey, credentials.apiSecret];
  return redactor(account ? [...secrets, account.id, account.number] : secrets)(text);
};
const log = (line) => process.stdout.write(`${scrub(line)}\n`);
// A re-run of the same workflow run gets its own client order ids (the broker refuses a repeat).
const runId = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_RUN_ID}.${process.env.GITHUB_RUN_ATTEMPT ?? "1"}`
  : Date.now().toString(36);
const transports = transportsFor(credentials);
const interrupted = new AbortController();
const run = createRun({
  trading: dryRun ? dryRunTransport(transports.trading, log) : transports.trading,
  data: transports.data,
  only,
  runId,
  dryRun,
  sameDayQty,
  campaignSymbols: campaign ? castSymbols(campaign) : [],
  now: () => Date.now(),
  // A signal ends any wait at once (check 1 can watch the open for 20 minutes).
  sleep: (ms) =>
    new Promise((resolve) => {
      if (interrupted.signal.aborted) return resolve();
      const timer = setTimeout(resolve, ms);
      interrupted.signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    }),
});

const resultsDir = join(process.cwd(), RESULTS_DIR);

function report(record) {
  for (const row of record.rows) {
    log(
      `${row.check}: ${row.outcome} (${row.phase}) ${row.answer}${row.nextWindow ? ` [next ${row.nextWindow}]` : ""}`,
    );
  }
  if (record.unread) log(`could not read after cleanup: ${record.unread.join(", ")}`);
  const unread = (what) => record.unread?.some((u) => u.startsWith(what));
  const open = unread("open orders") ? "not confirmed closed" : "still open after cleanup";
  if (record.stillOpen.length > 0) log(`${open}: ${record.stillOpen.join(", ")}`);
  const held = unread("positions") ? "not confirmed closed" : "still held after cleanup";
  if (record.positionsLeft.length > 0) log(`${held}: ${record.positionsLeft.join(", ")}`);
  if (dryRun) {
    log("dry run: nothing sent and no results written");
    return;
  }
  writeResults(resultsDir, etDate(Date.now()), record, scrub);
  log(`results: ${RESULTS_DIR}/${etDate(Date.now())}.json and README.md`);
}

// A signal stops new orders and new checks; `execute` then cleans up after the last order it
// placed and returns the record, which is written like any other (exit 130, or 1 if left open).
// A second signal kills the process outright.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    log(`${signal}: stopping, then cancelling everything this run placed`);
    run.interrupt();
    interrupted.abort();
  });
}

try {
  const record = await run.execute();
  report(record);
  process.exit(record.exitCode);
} catch (error) {
  if (error instanceof PaperCheckRefused) fail(2, `refused, nothing placed: ${error.message}`);
  await run.cleanup(); // execute's own cleanup has run if anything was placed; this is a no-op then
  fail(1, scrub(error instanceof Error ? error.message : String(error)));
}
