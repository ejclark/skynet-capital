#!/usr/bin/env node
// Plan-closure scan — catches the drift #928 and #885 hit: a multi-slice `plan`/`feedback` issue
// whose final PR shipped without a `Closes #N` keyword, so GitHub never auto-closed it and the
// issue sat open describing already-superseded state (found in a 2026-08-30 /work-issues pass).
//
// The heuristic: this repo's branch names routinely embed the issue they slice (feat/469-…,
// envelope-928-slice3-…, plan/894) but nothing checked that the PR closing that slice actually
// says so. This rides the same path as incident-scan.mjs/digest-scan.mjs — an advisory at PR-open
// time, not a hard gate, because most slices of a multi-slice plan should NOT close the issue yet.
//
//   node scripts/plan-closure-scan.mjs <branch> <body-file>   # advisory report (exit 0 always)
//
// Degrades to a clean no-op with no GH_TOKEN/GITHUB_TOKEN or no network — never a flaky gate.
// Pure number/keyword extraction is exported and unit-tested offline (tests/arch/plan-closure-scan.spec.ts).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

/** owner/repo from the origin remote, handling the proxy URL form (…/git/OWNER/REPO). */
function repoSlug() {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" })
    .trim()
    .replace(/\.git$/, "");
  if (url.includes("/git/")) return url.slice(url.lastIndexOf("/git/") + 5);
  return url.replace(/^[a-z]+:\/\/[^/]+\//, "").replace(/^git@[^:]+:/, "");
}

/** Issue numbers a branch name plausibly embeds. 2+ digits — this repo's issues run in the
 *  hundreds, and a 1-digit match ("cycle-1", "slice-2") is almost always a counter, not a ref. */
export function candidateIssueNumbers(branch) {
  const hits = [...branch.matchAll(/(?<!\d)(\d{2,6})(?!\d)/g)].map((m) => m[1]);
  return [...new Set(hits)];
}

/** Does the PR body already carry a GitHub auto-close keyword for this issue number? */
export function hasClosingKeyword(body, n) {
  return new RegExp(`\\b(closes|fixes|resolves)\\s+#${n}\\b`, "i").test(body);
}

const PLAN_LABELS = new Set(["plan", "feedback"]);

/** Fetch one issue's {open, labels}, or null if it doesn't exist / isn't reachable. */
async function issueState(n) {
  const res = await fetch(`https://api.github.com/repos/${repoSlug()}/issues/${n}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "skynet-capital",
    },
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (body.pull_request) return null; // PR numbers collide with issue numbers — skip
  return {
    open: body.state === "open",
    labels: (body.labels ?? []).map((l) => (typeof l === "string" ? l : l.name)),
  };
}

async function main() {
  const [branch, bodyFile] = process.argv.slice(2);
  if (!(branch && bodyFile)) {
    console.error("usage: plan-closure-scan.mjs <branch> <body-file>");
    process.exit(1);
  }
  if (!token) return; // no-op without a token — same degrade as incident-scan.mjs
  reexecWithProxy();

  const body = readFileSync(bodyFile, "utf8");
  const candidates = candidateIssueNumbers(branch).filter((n) => !hasClosingKeyword(body, n));
  if (candidates.length === 0) return;

  const flags = [];
  for (const n of candidates) {
    const state = await issueState(n).catch(() => null);
    if (!state) continue;
    if (state.open && state.labels.some((l) => PLAN_LABELS.has(l))) {
      flags.push({ n, labels: state.labels });
    }
  }
  if (flags.length === 0) return;

  console.log(
    "plan-closure-scan: this branch references open plan/feedback issue(s) with no closing keyword:",
  );
  for (const { n, labels } of flags) {
    console.log(`  #${n} (${labels.join(", ")}) — add "Closes #${n}" if this is the final slice`);
  }
  console.log(
    "  (not blocking — most slices of a multi-slice plan shouldn't close the issue yet;" +
      " see docs/ISSUES.md → slicing sketch)",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
