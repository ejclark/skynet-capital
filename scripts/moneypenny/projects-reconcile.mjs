#!/usr/bin/env node
// THE BOARD'S SELF-HEALING SWEEP — #4393 slice 1, criterion 4. Recomputes Status for every board
// item whose column disagrees with `statusForIssue()`, closed issues still outside Done included —
// and adds any open blocked issue that never got a card at all (#4303, see `planReconcile`). Before
// the cards, the columns: a Status option list in projects.mjs the live field does not carry yet
// is written in place first (#4393 slice 4, `ensureStatusColumns`).
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
// workflow run (board-sync.yml, on every push to main — slice 2) is the live test — and the one assumption that run checks is
// that `gh project item-list --format json` puts the Status option's name on each item as `status`.
//
//   GH_TOKEN=<eric's PAT> node scripts/moneypenny/projects-reconcile.mjs [--dry-run]
import { missingDecisionCallout } from "./decision-callout.mjs";
import { ghRateLimit, ghRestAll, withRetry } from "./gh.mjs";
import {
  isBacklogCandidate,
  isRateLimitExhausted,
  isRetryableRestError,
  planBoardSweep,
  STATUS_OPTIONS,
  statusFieldUpdate,
  statusForIssue,
  subIssueCounts,
} from "./projects.mjs";
import { createBoardContext, syncIssue, writeStatusOptions } from "./projects-sync.mjs";

const REPO = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";

/**
 * Every open issue, with the bounded backoff `readIssue` already carries (#4182).
 *
 * `ghRestAll` shells to curl, whose 5xx wording the shared transient classifier never matched — the
 * reason `readIssue` had to be wrapped in the first place, and 12 of the 2026-09-30 backfill's 20
 * failures were GitHub 5xx. This read has no second chance inside the run: `ghRestAll` throws
 * rather than hand back a truncated list, so one 502 on page 2 ends the whole hourly sweep. A
 * rate-limit 403/429 still fails at once, by design — an hourly window does not reopen in six
 * seconds.
 */
export function readOpenIssuesWithRetry({ read = ghRestAll, sleep } = {}) {
  return withRetry(() => read("issues?state=open"), {
    isTransient: isRetryableRestError,
    ...(sleep ? { sleep } : {}),
  });
}

/**
 * The board's item list, refusing a page GitHub counted higher than it returned.
 *
 * `resolveBoardItem` already treats that truncation as fatal for ONE issue (#3954, "raise the
 * --limit on item-list"); a whole-board sweep shrugging at it is worse, because it reports the
 * items it could not see as agreeing — "600 item(s), 0 in the wrong column", green, while the rest
 * of the board drifts. Same silent-half-answer rule `ghRestAll` exists to refuse (#2968).
 */
export function boardItemsOrThrow(board) {
  const page = board.items() ?? {};
  const items = page.items ?? [];
  const counted = typeof page.totalCount === "number" ? page.totalCount : items.length;
  if (counted > items.length) {
    throw new Error(
      `the board lists ${items.length} item(s) but GitHub counts ${counted} — refusing to ` +
        "reconcile a truncated board and report the items it could not see as agreeing. Raise " +
        "ITEM_LIST_LIMIT in projects-sync.mjs.",
    );
  }
  return items;
}

/** The issue number of a board item that is an issue in THIS repo, else null (drafts, PRs, others). */
export function boardIssueNumber(item, repo = REPO) {
  const url = item?.content?.url ?? "";
  const m = new RegExp(
    `^https://github\\.com/${repo.replace(/[.]/g, "\\.")}/issues/(\\d+)$`,
    "i",
  ).exec(url);
  return m ? Number(m[1]) : null;
}

/**
 * What Status an open issue (a REST issue object) belongs in — `syncIssue`'s rule, no network.
 * `columns` is the live board's option names (see `statusForIssue`); the REST list carries
 * `sub_issues_summary`, which the Waiting rule reads.
 */
export function wantedStatusOf(issue, columns = STATUS_OPTIONS) {
  const labels = (issue?.labels ?? []).map((l) => (typeof l === "string" ? l : l?.name));
  if (!isBacklogCandidate({ labels })) return null;
  const decisionCalloutMissing = missingDecisionCallout({
    labels,
    body: issue?.body,
    author: issue?.user?.login,
  });
  return statusForIssue({
    state: issue?.state ?? "open",
    labels,
    decisionCalloutMissing,
    subIssues: subIssueCounts(issue),
    columns,
  });
}

/**
 * THE COLUMNS FIRST, THEN THE CARDS (#4393 slice 4). When projects.mjs's option list changes — the
 * rename to Building now, the new Waiting column — the live Status field has to follow before any
 * card can land in a new column. The plan said "add the option via a projects-setup.yml dispatch";
 * doing it here instead means the merge that changes the list also applies it, on the same push,
 * with nobody remembering a dispatch, and every later sweep proves it still holds. One read of the
 * field (already part of the board context), a write only on a mismatch, ids kept so no card moves.
 *
 * Returns the column names the cards may be planned against: the new list once written, the board's
 * current one on a dry run (which only says what it would change).
 */
export function ensureStatusColumns({
  board,
  write = writeStatusOptions,
  dryRun = false,
  log = console.log,
} = {}) {
  const field = (board.fields() ?? []).find((f) => f?.name === "Status");
  if (!field) throw new Error('no "Status" field on the board — has projects-setup run?');
  const have = (field.options ?? []).map((o) => o.name);
  const options = statusFieldUpdate(field.options ?? []);
  if (!options) return have;
  const change = `(${have.join(", ")}) → (${options.map((o) => o.name).join(", ")})`;
  if (dryRun) {
    log(`Status field: would change ${change}`);
    return have;
  }
  write(field.id, options);
  log(`Status field: changed ${change}, ids kept for ${options.filter((o) => o.id).length}`);
  const fresh = (board.fields({ refresh: true }) ?? []).find((f) => f?.name === "Status");
  return (fresh?.options ?? options).map((o) => o.name);
}

/**
 * The pure half: which board items sit in the wrong column? `items` is the board's item list,
 * `openIssues` every open issue (REST shape). An issue on the board but not in `openIssues` is
 * treated as closed and wants Done. Returns `[{number, have, want}]`, ascending by number.
 * `statusOf(item)` reads an item's current Status; the default is gh's `status` key.
 *
 * #4303 (#3959 slice 3) — AN OPEN ASK THAT NEVER REACHED THE BOARD IS DRIFT TOO. The Blocked column
 * is the one place a household member checks for an open ask, so "every open needs-eric/needs-info
 * issue is listed there" has to hold, not just "every listed card is in the right column". A card is
 * added only by the event job on a label change, and the event job is exactly what dropped runs
 * on 2026-09-30 — an issue whose one `needs-info` event died never got a card, and a sweep that
 * walks only cards could not see it. So an open issue absent from the board that wants Blocked
 * comes back as `have: null`; `syncIssue` adds it (add-or-find, #3954). Only Blocked, on purpose:
 * Backlog/Ready cards are a convenience the pull rule never reads (it reads labels), and adding
 * every uncarded issue is projects-backfill.mjs's one-shot job, at a GraphQL cost an hourly sweep
 * should not carry.
 */
export function planReconcile({
  items = [],
  openIssues = [],
  statusOf = (item) => item?.status ?? null,
  repo = REPO,
  columns = STATUS_OPTIONS,
} = {}) {
  const open = new Map(
    openIssues.filter((i) => i && !i.pull_request).map((i) => [Number(i.number), i]),
  );
  const drift = [];
  const carded = new Set();
  for (const item of items) {
    const number = boardIssueNumber(item, repo);
    if (!number) continue;
    carded.add(number);
    const issue = open.get(number);
    const want = issue ? wantedStatusOf(issue, columns) : "Done";
    if (!want) continue;
    const have = statusOf(item) ?? null;
    if (have !== want) drift.push({ number, have, want });
  }
  for (const [number, issue] of open) {
    if (!carded.has(number) && wantedStatusOf(issue, columns) === "Blocked")
      drift.push({ number, have: null, want: "Blocked" });
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
  readOpenIssues = readOpenIssuesWithRetry,
  rateLimit = () => ghRateLimit().graphql ?? {},
  sync = (number, opts) => syncIssue(String(number), opts),
  ensureColumns = ensureStatusColumns,
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

  const columns = ensureColumns({ board, dryRun, log });
  const items = boardItemsOrThrow(board);
  const drift = planReconcile({ items, openIssues, columns, ...(statusOf ? { statusOf } : {}) });
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
