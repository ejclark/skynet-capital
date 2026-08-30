#!/usr/bin/env node
// Repair-lane watchlist drift gate — flags a workflow file that moneypenny-repair.yml's
// `workflow_run.workflows:` list doesn't know about.
//
// WHY (issue #933): the list is a hardcoded name array (required in practice — GitHub's
// `workflow_run` trigger has no wildcard/glob form, and dropping the list entirely made GitHub
// reject the file outright, see moneypenny-repair.yml's own header comment). A `check_run`/
// `check_suite` trigger was considered as a way around the enumeration, but it fires repo-wide for
// EVERY check suite (any app, any branch), so replacing the list would trade "forget to update a
// static array" for "filter untrusted noise correctly inside the loop-guarded job itself" — a worse
// bug surface for a lane that already has one documented loop-safety incident (docs/LESSONS.md).
// Kept the enumerated list; this script makes forgetting to update it loud instead of silent.
//
// A workflow is exempt via WATCHLIST_EXEMPT below with a one-line reason — same shape as
// arch-grandfather.json: a short, explicit list, never a silent skip.
//
//   node scripts/repair-watchlist-scan.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const WORKFLOWS_DIR = join(ROOT, ".github/workflows");
const REPAIR_FILE = join(WORKFLOWS_DIR, "moneypenny-repair.yml");

const WATCHLIST_EXEMPT = {
  "Moneypenny Repair": "loop guard 1 — this lane never watches its own failures",
  Claude: "human-interactive lane; a failure surfaces directly in the thread that triggered it",
};

function workflowName(file) {
  const text = readFileSync(file, "utf8");
  const match = text.match(/^name:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function watchedNames(repairText) {
  const match = repairText.match(/workflow_run:\s*\n\s*workflows:\s*\[([\s\S]*?)\]/);
  if (!match) return null;
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const repairText = readFileSync(REPAIR_FILE, "utf8");
const watched = watchedNames(repairText);

if (!watched) {
  console.error(
    "repair-watchlist-scan: could not find moneypenny-repair.yml's workflow_run.workflows list — " +
      "the file shape changed; update this scanner's regex.",
  );
  process.exit(1);
}

const files = readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
const missing = [];

for (const file of files) {
  const full = join(WORKFLOWS_DIR, file);
  const name = workflowName(full);
  if (!name) continue;
  if (WATCHLIST_EXEMPT[name]) continue;
  const inList = watched.includes(name) || watched.includes(`.github/workflows/${file}`);
  if (!inList) missing.push({ file, name });
}

if (missing.length === 0) {
  console.log(
    "repair-watchlist-scan: every non-exempt workflow is in moneypenny-repair.yml's watch list.",
  );
  process.exit(0);
}

console.error(
  "repair-watchlist-scan: workflow(s) missing from moneypenny-repair.yml's watch list:\n",
);
for (const { file, name } of missing) {
  console.error(`  - ${file} (name: "${name}")`);
}
console.error(
  "\nAdd the workflow's name (and, for safety against an unparseable file, its path) to " +
    "moneypenny-repair.yml's `workflow_run.workflows` list, or add it to WATCHLIST_EXEMPT in this " +
    "script with a one-line reason if it's deliberately unwatched.",
);
process.exit(1);
