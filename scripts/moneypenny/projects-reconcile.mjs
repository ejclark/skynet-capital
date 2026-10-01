#!/usr/bin/env node
// THE BOARD'S SELF-HEALING SWEEP — #4393 slice 1, criterion 4. Recomputes Status for every board
// item whose column disagrees with `statusForIssue()`, closed issues still outside Done included.
//
// WHY A SWEEP AND NOT A BETTER EVENT JOB. On 2026-10-01 the In Progress column showed #3818, #3953,
// #3977 and #4327 while zero open issues carried `in-progress` and two of them were closed. Cause:
// eight consecutive `sync project status` failures 2026-09-30 22:24–22:31Z (GraphQL rate limit), no
// retry, and that job fires only on an issue event — a closed issue never gets another, so its card
// stayed wrong forever. An hourly recompute heals whatever an event run dropped, whatever the cause.
//
// CHEAP BY CONSTRUCTION (#4183 is what a careless board sweep costs — the 5,000-point hour gone in
// under six minutes):
//   1. The free budget pre-flight first (`ghRateLimit` + `planBoardSweep`, projects.mjs) — refuse to
//      start below the floor rather than half-write the board.
//   2. ONE board read per run (`createBoardContext`, projects-sync.mjs). Every write after it
//      resolves its item from that cached list, so no `item-add` and no second `item-list`.
//   3. Issue state over REST, in one paginated read of the open issues (the plentiful core bucket).
//      A board issue missing from that list is closed (or gone); `syncIssue` re-reads it before it
//      writes, so "missing" never writes Done on a guess.
//   4. Writes only where the column is wrong — an agreeing board costs the pre-flight, one
//      item-list page and one REST list, and writes nothing.
//   5. An exhausted quota aborts the sweep at once, like projects-backfill.mjs; the next hour's run
//      picks up where it stopped (the sweep is idempotent).
//
// NEEDS GH_TOKEN = PROJECTS_PAT (Eric's classic PAT with `project` scope), same as
// projects-sync.mjs: the App token has no path to a personal-account project. THIS SCRIPT HAS NOT
// BEEN RUN LIVE. It was written in a session whose token lacks the `project` scope, so its real IO
// is unexercised; the spec drives `reconcileBoard` end to end through injected IO only. Its first
// workflow run (slice 2's hourly cron) is the live test — and the one assumption that run checks is
// that `gh project item-list --format json` puts the Status option's name on each item as `status`.
//
//   GH_TOKEN=<eric's PAT> node scripts/moneypenny/projects-reconcile.mjs [--dry-run]
import { missingDecisionCallout } from "./decision-callout.mjs";
import { ghRateLimit, ghRestAll } from "./gh.mjs";
import {
  isBacklogCandidate,
  isRateLimitExhausted,
  planBoardSweep,
  statusForIssue,
} from "./projects.mjs";
import { createBoardContext, syncIssue } from "./projects-sync.mjs";

const REPO = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";

/** The issue number of a board item that is an issue in THIS repo, else null (drafts, PRs, others). */
export function boardIssueNumber(item, repo = REPO) {
  const url = item?.content?.url ?? "";
  const m = new RegExp(
    `^https://github\\.com/${repo.replace(/[.]/g, "\\.")}/issues/(\\d+)$`,
    "i",
  ).exec(url);
  return m ? Number(m[1]) : null;
}

/** What Status an open issue (a REST issue object) belongs in — `syncIssue`'s rule, no network. */
export function wantedStatusOf(issue) {
  const labels = (issue?.labels ?? []).map((l) => (typeof l === "string" ? l : l?.name));
  if (!isBacklogCandidate({ labels })) return null;
  const decisionCalloutMissing = missingDecisionCallout({
    labels,
    body: issue?.body,
    author: issue?.user?.login,
  });
  return statusForIssue({ state: issue?.state ?? "open", labels, decisionCalloutMissing });
}

/**
 * The pure half: which board items sit in the wrong column? `items` is the board's item list,
 * `openIssues` every open issue (REST shape). An issue on the board but not in `openIssues` is
 * treated as closed and wants Done. Returns `[{number, have, want}]`, ascending by number.
 * `statusOf(item)` reads an item's current Status; the default is gh's `status` key.
 */
export function planReconcile({
  items = [],
  openIssues = [],
  statusOf = (item) => item?.status ?? null,
  repo = REPO,
} = {}) {
  const open = new Map(
    openIssues.filter((i) => i && !i.pull_request).map((i) => [Number(i.number), i]),
  );
  const drift = [];
  for (const item of items) {
    const number = boardIssueNumber(item, repo);
    if (!number) continue;
    const issue = open.get(number);
    const want = issue ? wantedStatusOf(issue) : "Done";
    if (!want) continue;
    const have = statusOf(item) ?? null;
    if (have !== want) drift.push({ number, have, want });
  }
  return drift.sort((a, b) => a.number - b.number);
}

/**
 * The sweep. Every IO edge is injected so a spec drives it without a network call; the defaults
 * are the real reads and `syncIssue`. Returns a summary the CLI prints; never throws on a
 * per-issue failure (it records it), but stops at the first exhausted-quota failure.
 */
export function reconcileBoard({
  board = createBoardContext(),
  readOpenIssues = () => ghRestAll("issues?state=open"),
  rateLimit = () => ghRateLimit().graphql ?? {},
  sync = (number, opts) => syncIssue(String(number), opts),
  statusOf,
  dryRun = false,
  log = console.log,
} = {}) {
  const openIssues = readOpenIssues().filter((i) => !i?.pull_request);

  const { remaining, reset } = rateLimit();
  const budget = planBoardSweep({ issueCount: openIssues.length, remaining, reset });
  log(`budget check: ${budget.reason}`);
  if (!budget.ok)
    return { started: false, reason: budget.reason, drift: [], fixed: [], failed: [] };

  const items = board.items().items ?? [];
  const drift = planReconcile({ items, openIssues, ...(statusOf ? { statusOf } : {}) });
  log(`board: ${items.length} item(s), ${drift.length} in the wrong column`);

  const fixed = [];
  const failed = [];
  let aborted = false;
  for (const d of drift) {
    if (dryRun) {
      log(`#${d.number}: would move "${d.have ?? "(none)"}" → "${d.want}"`);
      continue;
    }
    try {
      const result = sync(d.number, { board });
      if (result?.skipped) {
        log(`#${d.number}: skipped — ${result.reason}`);
        continue;
      }
      fixed.push({ ...d, now: result?.status });
      log(`#${d.number}: "${d.have ?? "(none)"}" → "${result?.status}"`);
    } catch (err) {
      failed.push({ number: d.number, message: err?.message });
      log(`#${d.number}: FAILED — ${err?.message}`);
      if (isRateLimitExhausted(err?.message)) {
        aborted = true;
        log("aborting the sweep — the hourly GraphQL budget is spent; the next run resumes.");
        break;
      }
    }
  }
  return { started: true, drift, fixed, failed, aborted };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const result = reconcileBoard({ dryRun });
  if (!result.started) process.exit(1);
  console.log(
    `\nreconcile: ${result.drift.length} drifted, ${result.fixed.length} fixed, ` +
      `${result.failed.length} failed${result.aborted ? " (aborted on rate limit)" : ""}`,
  );
  if (result.failed.length > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
