#!/usr/bin/env node
// Open the day's edition PR, or leave the one already open (#8252 PR 2).
//
//   node scripts/edition-pr.mjs <branch> <edition-file>
//
// print-dates.yml's `edition` job runs `npm run edition:write` on the refresh's weekday clock. When
// it writes `src/domain/editions/<date>.json` (and the news collector's `src/domain/news/<date>.json`),
// the job force-pushes one branch per close, `chore/edition-<date>`, from current `main`, and calls
// this. One branch per close means a re-run for the same close updates its PR rather than opening a
// second; the push itself updates an open PR, and this script only opens one when none is open.
//
// The PR is ordinary data: editions and news files are not in envelope.json, so pipeline.yml's arm
// job arms its squash auto-merge once verify (which runs `parseEdition` and its words check on every
// edition) and integration tests pass. Numbers come from code only; no model wrote any of it.
//
// Exits 1 when it cannot open the PR, so the run is red and the edition does not sit unnoticed on a
// branch nobody watches.
import { readFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

/**
 * Pure. Whether an open PR already carries the branch.
 *
 * @param {readonly {head?: {ref?: string}}[]} openPrs
 * @param {string} branch
 */
export const editionPrOpen = (openPrs, branch) => openPrs.some((pr) => pr?.head?.ref === branch);

/**
 * Pure. The PR title and body for one edition: what its stories lead with, so the diff reviews
 * itself. Reads the record only; never a member's name (an edition carries none).
 *
 * @param {{date: string, writtenBy: string, stories: readonly {id: string, line: string, facts: readonly {label: string, value: string}[]}[], next: readonly unknown[]}} edition
 */
export function editionPr(edition) {
  const title = `chore(edition): the day's edition for ${edition.date}`;
  const stories = edition.stories.map((s) => {
    const lead = s.facts[0];
    return `- **${s.id}**: ${s.line}${lead ? ` (${lead.label} ${lead.value})` : ""}`;
  });
  const body = [
    "## The picture",
    "",
    "Picture: waived — a data file; the landing page renders it through `/api/edition`.",
    "",
    "## Summary",
    "",
    `- The weekday run wrote the ${edition.date} edition: ${edition.stories.length} stories, ${edition.next.length} dated next.`,
    "- Numbers come from code only; verify runs `parseEdition`'s words check on it. Auto-merges on green.",
    "",
    "## What it leads with",
    "",
    ...stories,
    "",
    `Written by: ${edition.writtenBy}`,
    "",
    "Part of #8252",
  ].join("\n");
  return { title, body };
}

async function main() {
  reexecWithProxy();
  const [branch, file] = process.argv.slice(2);
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!(branch && file && token && repo)) {
    console.error("usage: GH_TOKEN=… GITHUB_REPOSITORY=… edition-pr.mjs <branch> <edition-file>");
    process.exit(1);
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "skynet-capital-edition",
  };
  const list = await fetch(
    `https://api.github.com/repos/${repo}/pulls?state=open&base=main&per_page=100`,
    { headers },
  );
  if (!list.ok) throw new Error(`list open PRs failed (HTTP ${list.status})`);
  if (editionPrOpen(await list.json(), branch)) {
    console.log(`edition-pr: the PR on ${branch} is open; the push updated it.`);
    return;
  }
  const { title, body } = editionPr(JSON.parse(readFileSync(file, "utf8")));
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, head: branch, base: "main", body }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`PR open failed (HTTP ${res.status}): ${JSON.stringify(json).slice(0, 300)}`);
  console.log(`edition-pr: opened ${json.html_url}`);
}

if (isMain(import.meta.url))
  main().catch((err) => {
    console.error(`edition-pr: ${err.message}`);
    process.exit(1);
  });
