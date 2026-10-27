#!/usr/bin/env node
// Stuck-PR scan — the eye for a PR that is GREEN and still not merging.
//
// Every other net here fires on red. Two incidents in a fortnight were green: #4449 sat unarmed for
// 29 hours (2026-10-02) and #5221 sat armed, green and "blocked" for 5 days (2026-10-16). Both were
// found by luck. This reads the open PRs' heads through the REST core bucket and names each one that
// has been green longer than it takes a healthy merge — and the one command that clears it.
//
//   node scripts/stuck-pr-scan.mjs              # report; exit 1 when a PR is stuck
//   node scripts/stuck-pr-scan.mjs --hours 6    # age threshold (default 3; healthy merges take minutes)
//   node scripts/stuck-pr-scan.mjs --json       # the stuck list, always exit 0
//   node scripts/stuck-pr-scan.mjs --count      # {"stuck": [...]|null} for the digest line
//
// The class and its evidence live in scripts/stuck-pr-decide.mjs's header and docs/LESSONS.md
// (2026-10-16). Rides the path every change already takes: scripts/ship.sh runs it beside
// incident-scan.mjs, so a stalled PR surfaces at the next PR any session opens — hours, not days.
//
// Resource doctrine (docs/COACHES.md): REST core only, no GraphQL, no polling. A PR younger than the
// threshold cannot have been green that long, so it costs nothing. No token or no network is a clean
// no-op (exit 0, "unknown" under --count) — never a flaky gate.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { breachOf } from "./envelope-scan.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";
import {
  boardedBranches,
  DEFAULT_HOURS,
  describe,
  exemptReason,
  judgePr,
} from "./stuck-pr-decide.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const hoursArg = Number(args[args.indexOf("--hours") + 1]);
const hours = hoursArg > 0 ? hoursArg : DEFAULT_HOURS;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

/** owner/repo from the origin remote, handling the proxy URL form (…/git/OWNER/REPO). */
function repoSlug() {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" })
    .trim()
    .replace(/\.git$/, "");
  if (url.includes("/git/")) return url.slice(url.lastIndexOf("/git/") + 5);
  return url.replace(/^[a-z]+:\/\/[^/]+\//, "").replace(/^git@[^:]+:/, "");
}

async function api(path) {
  const res = await fetch(`https://api.github.com/repos/${repoSlug()}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "skynet-capital",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
  return res.json();
}

/** Every stuck open PR, newest facts only: one list call, then 2–3 calls per PR old enough to matter,
 *  plus one file list per PR judged stuck — an envelope-protected or platter-boarded diff is left to
 *  Eric's merge on purpose, so it is not stuck (#5381–#5383, 2026-10-26). */
async function scan() {
  const open = await api("pulls?state=open&per_page=100");
  const cutoff = Date.now() - hours * 3.6e6;
  const rules = JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];
  const isProtected = (path) => breachOf(path, rules) !== null;
  const isBoarded = boardedBranches(open);
  const stuck = [];
  for (const listed of open) {
    if (listed.draft || Date.parse(listed.created_at) > cutoff) continue;
    const sha = listed.head.sha;
    const [checks, suites] = await Promise.all([
      api(`commits/${sha}/check-runs?per_page=100`),
      api(`commits/${sha}/check-suites?per_page=100`),
    ]);
    // `mergeable_state` is only on the single-PR read, and only worth a call once the checks are in.
    const pr = await api(`pulls/${listed.number}`);
    const verdict = judgePr({
      pr,
      checkRuns: checks.check_runs ?? [],
      suites: suites.check_suites ?? [],
      hours,
    });
    if (!verdict) continue;
    const files = (await api(`pulls/${listed.number}/files?per_page=100`)).map((f) => f.filename);
    if (exemptReason({ pr, files, isProtected, isBoarded })) continue;
    stuck.push({ ...verdict, title: pr.title, url: pr.html_url, branch: pr.head.ref });
  }
  return stuck;
}

async function main() {
  reexecWithProxy();
  if (!token) {
    if (flag("--count")) console.log(JSON.stringify({ stuck: null }));
    else console.log("stuck-pr-scan: no GH_TOKEN/GITHUB_TOKEN — skipping (offline no-op).");
    return 0;
  }
  let stuck;
  try {
    stuck = await scan();
  } catch (err) {
    console.error(`stuck-pr-scan: could not read GitHub (${err.message}) — skipping.`);
    if (flag("--count")) console.log(JSON.stringify({ stuck: null }));
    return 0;
  }
  if (flag("--count")) {
    console.log(JSON.stringify({ stuck }));
    return 0;
  }
  if (flag("--json")) {
    console.log(JSON.stringify(stuck, null, 2));
    return 0;
  }
  if (stuck.length === 0) {
    console.log(`stuck-pr-scan: no open PR has been green but unmerged for more than ${hours}h.`);
    return 0;
  }
  console.error(
    `stuck-pr-scan: ${stuck.length} open PR(s) green for more than ${hours}h and not merging:`,
  );
  for (const s of stuck) console.error(`  ${describe(s)}`);
  return 1;
}

process.exitCode = await main();
