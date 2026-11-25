#!/usr/bin/env node
// Open or update the paper checks' results PR (#8256 slice 2).
//
//   npx tsx scripts/paper-checks-pr.mjs <branch> <log-file>
//
// paper-checks.yml runs `npm run paper:checks` on demand, once per market window, against the
// dedicated paper test account. When a run writes answers into `docs/research/alpaca-paper-checks/`
// the job force-pushes ONE fixed branch (main plus one commit carrying the dated files and the
// README) and calls this. A fixed branch means one results PR at a time: before the run, the job
// copies the open PR's dated files into its checkout, so the run APPENDS to them and the new push
// carries every unmerged answer — nothing an earlier window answered is dropped by a later one.
//
// Run with tsx: it reads the check catalog and the dated files through
// src/alpaca/paper-checks/{catalog,results}.ts, the same code that wrote them.
//
// WHEN TO CLOSE THE ISSUE. The body says `Closes #8256` only once every scriptable check has a
// broker answer on the record (accepted or refused, in any dated file): one run covers one window,
// so "a run leaves every scriptable row answered" is read across the record, not one run. Until
// then the body says `Part of #8256` and never spells the closing keyword anywhere, even quoted —
// #8310 closed this issue early from a keyword quoted in a follow-up line (#8370).
//
// The body updates on every run, so the Closes/Part-of line always matches the record. The PR is
// an ordinary research record (`docs/research/` is not in envelope.json): pipeline.yml arms its
// auto-merge after verify and integration tests. Run logs and PR bodies are public; the log this
// reads was already scrubbed by scripts/paper-checks.mjs (no key, secret, account id or number).
//
// Exits 1 when it cannot open or update the PR, so the run is red and the answers do not sit
// unnoticed on a branch nobody watches.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PAPER_CHECKS } from "../src/alpaca/paper-checks/catalog.ts";
import { RESULTS_DIR, readResults } from "../src/alpaca/paper-checks/results.ts";
import { isMain } from "./is-main.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

export const ISSUE = 8256;
export const PARENT = 8161;

/** The outcomes that are the broker's answer to the question; anything else is still a wait. */
const ANSWERED = new Set(["accepted", "refused"]);

/**
 * Pure. The open PR on the results branch, or undefined.
 *
 * @param {readonly {number?: number, head?: {ref?: string}}[]} openPrs
 * @param {string} branch
 */
export const openPrOn = (openPrs, branch) => openPrs.find((pr) => pr?.head?.ref === branch);

/**
 * Pure. The scriptable checks with no broker answer anywhere on the record, in catalog order.
 *
 * @param {readonly {runs: readonly {rows: readonly {check: string, outcome: string}[]}[]}[]} files
 * @param {readonly {id: string, notScriptable?: string}[]} checks
 */
export function unanswered(files, checks) {
  const answered = new Set(
    files.flatMap((f) =>
      f.runs.flatMap((r) => r.rows.filter((row) => ANSWERED.has(row.outcome)).map((x) => x.check)),
    ),
  );
  return checks.filter((c) => !(c.notScriptable || answered.has(c.id))).map((c) => c.id);
}

/** Pure. The README's answers table: its header, divider and one row per check. */
export const answersTable = (readme) => readme.split("\n").filter((line) => line.startsWith("|"));

/**
 * Pure. The run's own lines a reader acts on: one per check, plus anything left open.
 * paper-checks.mjs prints `<check id>: <outcome> (<phase>) <answer>` per row.
 *
 * @param {string} log
 * @param {readonly {id: string}[]} checks
 */
export function runLines(log, checks) {
  const ids = checks.map((c) => `${c.id}: `);
  return log
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        ids.some((id) => l.startsWith(id)) ||
        l.startsWith("still open after cleanup") ||
        l.startsWith("still held after cleanup"),
    );
}

/**
 * Pure. The PR title and body for the record as it stands after this run.
 *
 * @param {{readme: string, log: string, waiting: readonly string[], today: string}} input
 */
export function resultsPr({ readme, log, waiting, today }) {
  const scriptable = PAPER_CHECKS.filter((c) => !c.notScriptable).length;
  const done = waiting.length === 0;
  const title = `chore(research): alpaca paper-check answers (${today})`;
  const lines = runLines(log, PAPER_CHECKS);
  const body = [
    "## The picture",
    "",
    "Picture: waived — a research record; the answers table below is the picture.",
    "",
    "## Summary",
    "",
    `- A paper-check run on the dedicated test account wrote its answers to \`${RESULTS_DIR}/\`: ${scriptable - waiting.length} of ${scriptable} scriptable checks now carry the broker's own answer.`,
    done
      ? "- Every scriptable check is answered, so this record finishes the work."
      : `- Still waiting on a window: ${waiting.map((id) => `\`${id}\``).join(", ")}.`,
    done ? `- Closes #${ISSUE}` : `- Part of #${ISSUE}`,
    `- Part of #${PARENT}`,
    "",
    "## The answers so far",
    "",
    ...answersTable(readme),
    "",
    "<details><summary>What this run saw</summary>",
    "",
    "```",
    ...(lines.length > 0 ? lines : ["(no check lines in the run log)"]),
    "```",
    "",
    "</details>",
    "",
    "A research record, so it merges itself on green. A later run before this merges adds its answers to this PR instead of opening a second one.",
  ].join("\n");
  return { title, body };
}

async function main() {
  reexecWithProxy();
  const [branch, logFile] = process.argv.slice(2);
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!(branch && logFile && token && repo)) {
    console.error("usage: GH_TOKEN=… GITHUB_REPOSITORY=… paper-checks-pr.mjs <branch> <log>");
    process.exit(1);
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "skynet-capital-paper-checks",
  };
  const dir = join(process.cwd(), RESULTS_DIR);
  const { title, body } = resultsPr({
    readme: readFileSync(join(dir, "README.md"), "utf8"),
    log: readFileSync(logFile, "utf8"),
    waiting: unanswered(readResults(dir), PAPER_CHECKS),
    today: new Date().toISOString().slice(0, 10),
  });
  const list = await fetch(
    `https://api.github.com/repos/${repo}/pulls?state=open&base=main&per_page=100`,
    { headers },
  );
  if (!list.ok) throw new Error(`list open PRs failed (HTTP ${list.status})`);
  const open = openPrOn(await list.json(), branch);
  const res = await fetch(
    open
      ? `https://api.github.com/repos/${repo}/pulls/${open.number}`
      : `https://api.github.com/repos/${repo}/pulls`,
    {
      method: open ? "PATCH" : "POST",
      headers,
      body: JSON.stringify(open ? { title, body } : { title, head: branch, base: "main", body }),
    },
  );
  const json = await res.json();
  if (!res.ok) {
    const what = open ? "update" : "open";
    throw new Error(
      `PR ${what} failed (HTTP ${res.status}): ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  console.log(`paper-checks-pr: ${open ? "updated" : "opened"} ${json.html_url}`);
}

if (isMain(import.meta.url))
  main().catch((err) => {
    console.error(`paper-checks-pr: ${err.message}`);
    process.exit(1);
  });
