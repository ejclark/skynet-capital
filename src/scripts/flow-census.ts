/**
 * CLI: grade the capital-flow shadow ledger for #4563's tolerance tuning.
 *
 *   npx tsx src/scripts/flow-census.ts --file <flows.jsonl> [--now <iso>]
 *
 * `--file` is every `flows/*.jsonl` line concatenated (production keeps them under
 * `/data/history/flows/`). Prints the census as Markdown and nothing else — counts only, no
 * participant id or amount, because the run log it lands in is public. An unreadable file exits 1:
 * a failed read must never print "no flows, keep today's rule" (an empty ledger is an empty FILE,
 * which the caller writes when the flows directory does not exist yet). The grading is
 * `observatory/capital-flow-census.ts`; this file only reads.
 */
import { readFileSync } from "node:fs";
import { censusFlows, censusMarkdown, parseFlowLines } from "../observatory/capital-flow-census.js";
import { flag } from "./cli-flag.js";

const file = flag(process.argv, "file");
const now = flag(process.argv, "now");

let text: string;
try {
  if (!file) throw new Error("--file is required");
  text = readFileSync(file, "utf8");
} catch (error) {
  process.stderr.write(`flow-census: could not read the ledger (${String(error)})\n`);
  process.exit(1);
}

const census = censusFlows(parseFlowLines(text), now ? new Date(now) : new Date());
process.stdout.write(censusMarkdown(census));
