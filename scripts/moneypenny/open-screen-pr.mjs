#!/usr/bin/env node
// Open a PR for the deterministic screen's ledger commit, and try to arm auto-merge — the
// PR-based replacement for a direct `git push origin HEAD:main` (issue #915, Eric: "some merge to
// main, open PRs for research; non-negotiable").
//
//   node scripts/moneypenny/open-screen-pr.mjs <branch> <screenedCount>
//
// Advisory by construction, same doctrine as incident-scan.mjs/digest-scan.mjs/
// plan-closure-scan.mjs: this always exits 0. The caller (moneypenny-events.yml's "Screen
// interval-elapsed pulses" step) has ALREADY written `due=$STILL_DUE` to GITHUB_OUTPUT before
// calling this — the same-run matrix legs read that output directly, never a fresh git read, so
// nothing downstream in this run depends on this script's success. The only cost of this script
// failing anywhere (branch already pushed but PR open fails, PR opens but auto-merge can't arm) is
// that a FUTURE run's screen re-probes the same already-screened events — cheap and idempotent
// (event-material-scan.mjs's screen is deterministic), never a paid research session. That bounded,
// self-healing cost is what makes "always exit 0, never block the run" the correct choice here,
// not a shortcut.
//
// Degrades to a clean, loud no-op with no GH_TOKEN/GITHUB_TOKEN or no network.
import { reexecWithProxy } from "../proxy-reexec.mjs";

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY; // "owner/repo", set by every GitHub Actions runner

const headers = () => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "skynet-capital-moneypenny",
});

/**
 * Classify a raw `enablePullRequestAutoMerge` GraphQL response body (as text). Pure — no network —
 * so it's the one part of this file worth unit-testing offline (tests/scripts/moneypenny/
 * open-screen-pr.spec.ts). Mirrors scripts/ship.sh's `cmd_automerge` two-failure-shape handling
 * (2026-08-26: a GraphQL-level failure carries an `errors` array, an HTTP-level one — rate limit,
 * bad token — comes back as a bare `{"message": ...}` with no `errors` key; checking only for
 * `errors` let a never-armed PR read as armed).
 *
 * - "already-clean": every required check already passed before the mutation landed (GitHub
 *   refuses to arm auto-merge on an already-mergeable PR) — the caller should merge directly.
 * - "error": any other GraphQL- or HTTP-level failure — arming didn't happen; PR stays open.
 * - "armed": no error shape matched — trust the mutation, same as ship.sh does.
 */
export function classifyAutoMergeResult(rawBody) {
  if (/clean status|already in clean/i.test(rawBody)) return "already-clean";
  if (/"errors"|"message"/.test(rawBody)) return "error";
  return "armed";
}

async function openPr(branch, title, body) {
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title, head: branch, base: "main", body }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`PR open failed (HTTP ${res.status}): ${JSON.stringify(json).slice(0, 300)}`);
  return json; // { number, node_id, ... }
}

async function tryArmAutoMerge(nodeId) {
  const query =
    "mutation($id: ID!) { enablePullRequestAutoMerge(input: {pullRequestId: $id, mergeMethod: SQUASH}) { pullRequest { number } } }";
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id: nodeId } }),
  });
  return classifyAutoMergeResult(await res.text());
}

async function mergeDirect(number) {
  await fetch(`https://api.github.com/repos/${repo}/pulls/${number}/merge`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ merge_method: "squash" }),
  });
}

async function main() {
  reexecWithProxy();
  const [branch, screenedCount] = process.argv.slice(2);
  if (!branch) {
    console.error("open-screen-pr: usage: open-screen-pr.mjs <branch> <screenedCount>");
    process.exit(0);
  }
  if (!(token && repo)) {
    console.log(
      "::warning::open-screen-pr: no GH_TOKEN/GITHUB_REPOSITORY — skipping PR open this run.",
    );
    process.exit(0);
  }
  const title = `docs(research): deterministic screen — ${screenedCount ?? "?"} pulse(s), no session needed`;
  const body =
    "Automated: interval-elapsed pulses screened as immaterial by `event-material-scan.mjs` " +
    "(issue #724). No research session spent. Auto-merges on green; see issue #915 for why this " +
    "is a PR and not a direct push to `main`.";
  let pr;
  try {
    pr = await openPr(branch, title, body);
  } catch (err) {
    console.log(
      `::warning::open-screen-pr: could not open a PR for ${branch} (${err.message}) — a future run will re-screen the same events (idempotent, no session cost).`,
    );
    process.exit(0);
  }
  console.log(`::notice::open-screen-pr: opened #${pr.number} for the deterministic screen.`);
  let verdict;
  try {
    verdict = await tryArmAutoMerge(pr.node_id);
  } catch (err) {
    console.log(
      `::warning::open-screen-pr: auto-merge arm request failed for #${pr.number} (${err.message}).`,
    );
    process.exit(0);
  }
  if (verdict === "already-clean") {
    await mergeDirect(pr.number);
    console.log(`::notice::open-screen-pr: #${pr.number} was already green — merged directly.`);
  } else if (verdict === "error") {
    console.log(
      `::warning::open-screen-pr: #${pr.number} opened but auto-merge could not be armed — it needs a manual merge, or a future run's screen will re-probe the same events.`,
    );
  } else {
    console.log(`::notice::open-screen-pr: auto-merge armed on #${pr.number}.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
