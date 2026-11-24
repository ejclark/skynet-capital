/**
 * CLI: grade the capital-flow shadow ledger for #4563's tolerance tuning.
 *
 *   npx tsx src/scripts/flow-census.ts --file <flows.jsonl> [--activity <journal.jsonl>] [--now <iso>]
 *
 * `--file` is every `flows/*.jsonl` line concatenated (production keeps them under
 * `/data/history/flows/`). `--activity` is every fill-journal file concatenated (`/data/activity/
 * *.jsonl`): its lifecycle rows are how a line inside an assignment's window is caught (#7730), so
 * without it the census counts but never prints the all-clear. Prints the census as Markdown and
 * nothing else — counts only, no participant id or amount, because the run log it lands in is
 * public. An unreadable file exits 1: a failed read must never print "no flows, keep today's rule"
 * (an empty ledger is an empty FILE, which the caller writes when the flows directory does not exist
 * yet). The grading is `observatory/capital-flow-census.ts`; this file only reads.
 */
import { readFileSync } from "node:fs";
import {
  censusFlows,
  censusMarkdown,
  parseFlowLines,
  parseJournalLines,
} from "../observatory/capital-flow-census.js";
import { flag } from "./cli-flag.js";

const file = flag(process.argv, "file");
const activity = flag(process.argv, "activity");
const now = flag(process.argv, "now");

let text: string;
let journalText: string | undefined;
try {
  if (!file) throw new Error("--file is required");
  text = readFileSync(file, "utf8");
  journalText = activity ? readFileSync(activity, "utf8") : undefined;
} catch (error) {
  process.stderr.write(`flow-census: could not read the ledger (${String(error)})\n`);
  process.exit(1);
}

const census = censusFlows(
  parseFlowLines(text),
  now ? new Date(now) : new Date(),
  journalText === undefined ? undefined : parseJournalLines(journalText),
);
process.stdout.write(censusMarkdown(census));
