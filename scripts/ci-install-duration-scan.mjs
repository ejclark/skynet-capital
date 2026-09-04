#!/usr/bin/env node
// CI install-duration fitness scan — the eye for a resource dimension docs/COACHES.md already
// named ("Resource cost is a fitness dimension": tokens, GraphQL, GHA minutes, wall-clock) but
// had never mechanized, unlike every other dimension in this repo. The gap showed itself three
// times in one evening (2026-09-04, docs/LESSONS.md): a stale-ref detour, a cache key fixed in
// the wrong job, and the fix for that — each one needed Eric to read a live Actions log and say
// something before anyone noticed. This gate is the missing net: it watches the `verify` job's
// own install steps so a regression there is a number that ratchets, not a live complaint.
//
// The dimension: seconds spent in `verify`'s "Install dependencies" + "Install app dependencies"
// steps, median over the last N successful pull_request runs of Pipeline. A median (not the
// latest single run) absorbs ordinary registry-speed noise; a real regression — a cache miss that
// stops being transient, a dependency tree that grows — moves the median, not just one sample.
//
//   node scripts/ci-install-duration-scan.mjs             # report + enforce (advisory, see below)
//   node scripts/ci-install-duration-scan.mjs --update    # rewrite the budget (ratchet: only lower)
//   node scripts/ci-install-duration-scan.mjs --candidate # the single slowest sampled run, as JSON
//   node scripts/ci-install-duration-scan.mjs --n 15      # sample size (default 10)
//
// Resource doctrine (docs/COACHES.md): REST *core* bucket only — a handful of requests, no
// polling, no GraphQL. Degrades to a clean no-op (exit 0) with no token or no network, same as
// incident-scan.mjs. Wired advisory (tests/arch/ci-install-duration.spec.ts), matching every other
// debt gate since Eric's 2026-08-29 call: a friends-and-family repo addresses debt as it's
// noticed, never pre-blocks a PR on it.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reexecWithProxy } from "./proxy-reexec.mjs";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "ci-install-duration-budget.json");
const WATCHED_STEPS = ["Install dependencies", "Install app dependencies"];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const sampleSize = Number(args[args.indexOf("--n") + 1]) || 10;

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

/** owner/repo from the origin remote, handling the proxy URL form (…/git/OWNER/REPO). */
function repoSlug() {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" })
    .trim()
    .replace(/\.git$/, "");
  if (url.includes("/git/")) return url.slice(url.lastIndexOf("/git/") + 5);
  return url.replace(/^[a-z]+:\/\/[^/]+\//, "").replace(/^git@[^:]+:/, "");
}

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "skynet-capital",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
  return res.json();
}

/** The most recent successful `verify` job across the last `sampleSize` PR runs of Pipeline. */
async function recentVerifyJobs() {
  const runs =
    (
      await gh(
        `/repos/${repoSlug()}/actions/workflows/pipeline.yml/runs` +
          `?event=pull_request&status=success&per_page=${sampleSize}`,
      )
    ).workflow_runs ?? [];

  const jobs = await Promise.all(
    runs.map((run) => gh(`/repos/${repoSlug()}/actions/runs/${run.id}/jobs`)),
  );

  return jobs
    .map((page, i) => ({
      run: runs[i],
      verify: (page.jobs ?? []).find((j) => j.name === "verify"),
    }))
    .filter((r) => r.verify?.status === "completed");
}

/** Seconds spent in the watched install steps of one `verify` job, or null if a step is missing
 * (a docs-only PR skips them entirely — not a sample of install speed). */
function installSeconds(job) {
  const steps = job.steps ?? [];
  let total = 0;
  for (const name of WATCHED_STEPS) {
    const step = steps.find((s) => s.name === name);
    if (!(step?.started_at && step?.completed_at)) return null;
    total += (new Date(step.completed_at) - new Date(step.started_at)) / 1000;
  }
  return total;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  reexecWithProxy();

  if (!token) {
    console.log("ci-install-duration-scan: no GH_TOKEN/GITHUB_TOKEN — skipping (offline no-op).");
    return 0;
  }

  let sampled;
  try {
    sampled = await recentVerifyJobs();
  } catch (err) {
    console.log(`ci-install-duration-scan: could not reach GitHub (${err.message}) — skipping.`);
    return 0;
  }

  const timed = sampled
    .map((r) => ({ ...r, seconds: installSeconds(r.verify) }))
    .filter((r) => r.seconds !== null);

  if (timed.length === 0) {
    console.log("ci-install-duration-scan: no sampled run had both install steps — no-op.");
    return 0;
  }

  const durations = timed.map((r) => r.seconds);
  const med = median(durations);
  const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));

  if (flag("--candidate")) {
    const worst = timed.sort((a, b) => b.seconds - a.seconds)[0];
    console.log(
      JSON.stringify({
        sha: (worst.run.head_sha ?? "").slice(0, 7),
        seconds: Math.round(worst.seconds),
        url: worst.run.html_url,
      }),
    );
    return 0;
  }

  console.log(
    `ci-install-duration-scan: median ${Math.round(med)}s over ${timed.length} run(s) ` +
      `(watched steps: ${WATCHED_STEPS.join(", ")})`,
  );

  if (flag("--update")) {
    const next = Math.min(budget.maxInstallSeconds, Math.ceil(med * 1.2));
    writeFileSync(BUDGET_FILE, `${JSON.stringify({ maxInstallSeconds: next }, null, 2)}\n`);
    console.log(`ci-install-duration-scan: budget ratcheted to ${next}s`);
    return 0;
  }

  if (med > budget.maxInstallSeconds) {
    console.error(
      `\nci-install-duration-scan: median install time ${Math.round(med)}s exceeds the budget of ` +
        `${budget.maxInstallSeconds}s.\nCheck the cache: a "Cache restored" line should appear for ` +
        `both install steps (docs/LESSONS.md, 2026-09-04) — if it's missing, the shared cache on ` +
        `main isn't warm and the deploy job's cache-warm step needs a look.`,
    );
    return 1;
  }
  console.log(`ci-install-duration-scan: within budget (${budget.maxInstallSeconds}s). ✅`);
  return 0;
}

process.exit(await main());
