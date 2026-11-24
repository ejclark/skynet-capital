#!/usr/bin/env node
// Open the calendar refresh's PR, or leave the one already open (#4479 slice 1b).
//
//   node scripts/print-dates-pr.mjs <branch> <log-file> <outcome>
//
// print-dates.yml runs `npm run confirm:print-dates` on a weekday clock. When the run rewrites
// `src/domain/earnings-calendar.ts`, the job force-pushes ONE fixed branch from current `main` and
// calls this. A fixed branch means one PR at a time: a refresh that runs again before the last one
// merged replaces its diff (the table is re-derived from `main` whole, so the old diff carries
// nothing the new one lacks) instead of opening a second PR that edits the same rows. The push
// itself updates the open PR; this script only opens one when none is open.
//
// The PR is ordinary plumbing: `src/domain/earnings-calendar.ts` is not in envelope.json, so
// pipeline.yml's arm job arms its squash auto-merge once verify and integration tests pass. The
// table only ever moves estimate → confirmed on the company's word, or adds a cadence estimate —
// never credentials, never an order (src/scripts/confirm-print-dates.ts's header).
//
// Exits 1 when it cannot open the PR, so the run is red and the change does not sit unnoticed on a
// branch nobody watches.
import { readFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

/**
 * Pure. Whether an open PR already carries the refresh branch.
 *
 * @param {readonly {head?: {ref?: string}}[]} openPrs
 * @param {string} branch
 */
export const refreshPrOpen = (openPrs, branch) => openPrs.some((pr) => pr?.head?.ref === branch);

/** Lines of the script's log a reader acts on: the decisions, not the fetch retries. */
const KEEP = /CONFIRMED|ESTIMATED|NEEDS IR|UNCHECKED|outcome:|wrote|nothing to change/;

/**
 * Pure. The PR title and body for one refresh run.
 *
 * @param {string} log the script's combined output
 * @param {string} outcome the script's `outcome` word
 * @param {string} today YYYY-MM-DD
 */
export function refreshPr(log, outcome, today) {
  const lines = log
    .split("\n")
    .filter((l) => KEEP.test(l))
    .map((l) => l.replace(/^\[confirm-print-dates\] /, "").trim());
  const needsIr = lines.filter((l) => l.startsWith("NEEDS IR"));
  const title = `chore(calendar): refresh earnings print dates (${today})`;
  const body = [
    "## Summary",
    "",
    "- The weekday calendar refresh (#4479) changed `src/domain/earnings-calendar.ts`: a near estimate the company has now dated, or a cadence estimate for a playbook symbol with no print in ~100 days.",
    "- A confirmed row cites Nasdaq's company-reported date (`CAL:`); a date that moved stays an estimate until someone reads IR.",
    needsIr.length > 0
      ? `- **${needsIr.length} row(s) need an IR read** — listed below; this PR does not confirm them.`
      : "- No row needs an IR read.",
    "",
    "## What the run decided",
    "",
    "```",
    ...lines,
    "```",
    "",
    `Outcome: \`${outcome}\`. Ordinary plumbing: auto-merges on green. A later run before this merges replaces this diff rather than opening a second PR.`,
    "",
    "Part of #4479",
  ].join("\n");
  return { title, body };
}

async function main() {
  reexecWithProxy();
  const [branch, logFile, outcome = "found"] = process.argv.slice(2);
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!(branch && logFile && token && repo)) {
    console.error(
      "usage: GH_TOKEN=… GITHUB_REPOSITORY=… print-dates-pr.mjs <branch> <log> <outcome>",
    );
    process.exit(1);
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "skynet-capital-print-dates",
  };
  const list = await fetch(
    `https://api.github.com/repos/${repo}/pulls?state=open&base=main&per_page=100`,
    { headers },
  );
  if (!list.ok) throw new Error(`list open PRs failed (HTTP ${list.status})`);
  if (refreshPrOpen(await list.json(), branch)) {
    console.log(`print-dates-pr: the refresh PR on ${branch} is open; the push updated it.`);
    return;
  }
  const { title, body } = refreshPr(
    readFileSync(logFile, "utf8"),
    outcome,
    new Date().toISOString().slice(0, 10),
  );
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, head: branch, base: "main", body }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`PR open failed (HTTP ${res.status}): ${JSON.stringify(json).slice(0, 300)}`);
  console.log(`print-dates-pr: opened ${json.html_url}`);
}

if (isMain(import.meta.url))
  main().catch((err) => {
    console.error(`print-dates-pr: ${err.message}`);
    process.exit(1);
  });
