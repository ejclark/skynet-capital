/**
 * CLI: which discovery asks the research lane takes this pass (#7034 slice 3b).
 *
 *   npx tsx src/scripts/discovery-pass.ts --queue <queue.json> --heads <heads.json> \
 *     --ceiling <n> [--spent <n>]
 *
 * Prints a JSON array of `TakenAsk`s (no member words, no asker keys: the repo and its run logs are
 * public) and nothing else on stdout. An unreadable queue prints `[]`, closed the way the dial fails.
 * The pass logic is `domain/discovery-pass.ts`; this file only reads files.
 */
import { readFileSync } from "node:fs";
import { planPass } from "../domain/discovery-pass.js";
import { shelfAnswered } from "../server/discovery-answered.js";
import { parseDiscoveryQueue } from "../server/discovery-queue-store.js";

function arg(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

function readJson(path: string | undefined): unknown {
  if (!path) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

const queue = parseDiscoveryQueue(readJson(arg("queue"))) ?? [];
const heads = readJson(arg("heads"));
const taken = planPass({
  queue,
  ceiling: Number(arg("ceiling") ?? 0),
  spentByEvents: Number(arg("spent") ?? 0),
  answered: shelfAnswered(),
  openHeads: Array.isArray(heads) ? heads.filter((h): h is string => typeof h === "string") : [],
});
process.stdout.write(`${JSON.stringify(taken)}\n`);
