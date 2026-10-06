#!/usr/bin/env node
// PR provenance scan — #4393 criterion 8. The Orchestration board shows work through the issue a PR
// names (scripts/moneypenny/pr-issues.mjs); a PR that names none, and is not a machine lane's, is
// invisible to it — the in-flight cap cannot count it and no card moves. Measured 2026-10-06 over
// the last 100 merged PRs: 58 lane PRs (a standing card each class, exempt), 28 naming an issue,
// 14 naming nothing — ten of them one `chore/model-fit-*` grind fan-out.
//
//   node scripts/pr-provenance-scan.mjs                    # merged PRs: report vs the budget (advisory)
//   node scripts/pr-provenance-scan.mjs --update           # ratchet the budget down to today's count
//   node scripts/pr-provenance-scan.mjs --pr <branch> <title> <body-file>
//                                                          # one PR about to open (ship.sh calls this)
//
// ADVISORY WITH A RATCHET, never red (CLAUDE.md → *A gate is a momentum breaker…*): a PR with nothing
// to name — a typo fix, a grind with no issue — is legitimate, and what we want is the count going
// down, not a blocked merge. Same doctrine as ci-install-duration-scan.mjs, whose shape this follows:
// REST core bucket only, one page, a clean no-op with no token or no network.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { namesNoIssue } from "./moneypenny/pr-issues.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

const BUDGET_FILE = join(process.cwd(), "pr-provenance-budget.json");
const WINDOW = 100;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

/** owner/repo from the origin remote, handling the proxy URL form (…/git/OWNER/REPO). */
function repoSlug() {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" })
    .trim()
    .replace(/\.git$/, "");
  if (url.includes("/git/")) return url.slice(url.lastIndexOf("/git/") + 5);
  return url.replace(/^[a-z]+:\/\/[^/]+\//, "").replace(/^git@[^:]+:/, "");
}

async function recentMergedPrs() {
  const res = await fetch(
    `https://api.github.com/repos/${repoSlug()}/pulls?state=closed&sort=updated&direction=desc&per_page=${WINDOW}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "skynet-capital",
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return (await res.json()).filter((p) => p.merged_at);
}

function checkOne([branch, title, bodyFile]) {
  if (!(branch && bodyFile)) {
    console.error("usage: pr-provenance-scan.mjs --pr <branch> <title> <body-file>");
    return 1;
  }
  const body = readFileSync(bodyFile, "utf8");
  if (namesNoIssue({ title, body, headRef: branch })) {
    console.log(
      "pr-provenance-scan: this PR names no issue, so the Orchestration board cannot show it being built.\n" +
        '  Add "Part of #<n>" / "Closes #<n>" to the body if an issue exists (not blocking — a typo fix has none).',
    );
  }
  return 0;
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--pr") return checkOne(args.slice(1));
  if (!token) {
    console.log("pr-provenance-scan: no GH_TOKEN/GITHUB_TOKEN — skipping (offline no-op).");
    return 0;
  }
  reexecWithProxy();

  let prs;
  try {
    prs = await recentMergedPrs();
  } catch (err) {
    console.log(`pr-provenance-scan: could not reach GitHub (${err.message}) — skipping.`);
    return 0;
  }
  const unlinked = prs.filter((p) =>
    namesNoIssue({ title: p.title, body: p.body, headRef: p.head?.ref }),
  );
  const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
  console.log(
    `pr-provenance-scan: ${unlinked.length} of ${prs.length} recently merged PR(s) name no issue and ` +
      `are no lane's (budget ${budget.maxUnlinked})`,
  );
  for (const p of unlinked.slice(0, 10)) console.log(`  #${p.number} ${p.head?.ref}`);

  if (args.includes("--update")) {
    const next = Math.min(budget.maxUnlinked, unlinked.length);
    writeFileSync(BUDGET_FILE, `${JSON.stringify({ maxUnlinked: next }, null, 2)}\n`);
    console.log(`pr-provenance-scan: budget ratcheted to ${next}`);
    return 0;
  }
  if (unlinked.length > budget.maxUnlinked) {
    console.error(
      `pr-provenance-scan: over budget — name the issue in the PR body ("Part of #<n>"), or, for a ` +
        "fan-out with no issue, file one first (scripts/moneypenny/pr-issues.mjs lists what counts).",
    );
    return 1;
  }
  return 0;
}

process.exit(await main());
