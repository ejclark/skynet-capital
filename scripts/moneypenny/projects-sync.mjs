#!/usr/bin/env node
// PROJECTS V2 SYNC — #3818 slice B, part 2. Keeps one issue's Status column current on the
// "Skynet Capital — Orchestration" project as its labels/state change: adds it to the board if
// it isn't there yet, then sets Status per `statusForIssue()`'s rule (scripts/moneypenny/projects.mjs).
//
// Needs GH_TOKEN = Eric's PROJECTS_PAT (same as projects-setup.mjs) — the App token still has no
// path to a personal-account project, so this can't ride the App identity like the rest of
// Moneypenny does. The repo is public, so the same PAT reads issue data fine too; no second token.
//
// "In Progress" comes from the `in-progress` LABEL (#3960, 2026-09-30), not from linked PRs: this
// script still never reads timeline cross-references, and a live session's PR auto-merges within
// minutes anyway. The claim lanes and `/work-issues` apply the label when a build starts and take
// it off at the end; the stall audit clears one left 6h quiet. Since it is a label, adding or
// removing it is an `issues` labeled/unlabeled event — the trigger this job already runs on. One
// caveat: an event a workflow's own GITHUB_TOKEN causes starts no new run, so a label written by
// a GITHUB_TOKEN step shows on the board at that issue's next event, not instantly.
//
//   GH_TOKEN=<eric's PAT> node scripts/moneypenny/projects-sync.mjs <issue-number>
//
// Run via moneypenny-events.yml's `sync-project` job, on issue labeled/unlabeled/closed/reopened.
// `syncIssue` is exported so projects-backfill.mjs (the #3818 consolidation pass) can reuse the
// same add/Status/Horizon glue across every open issue in one run, instead of re-deriving it.
//
// #3954: the board add is add-or-find (`resolveBoardItem`), because `gh project item-add` fails on
// an issue that is already an item — so every sync after an issue's first one went red until now.
//
// #3914: every `gh project` call here goes through `ghProject`, because gh reports any non-NOT_FOUND
// owner-lookup failure as the bare string `unknown owner type` — see projects.mjs's block above
// `MASKED_OWNER_FAILURE` for the reproduction and why that string is never a real classification.
//
// #4213: a rate-limit refusal is classified against the budget GraphQL itself reports, not REST's
// stale mirror — a burst of concurrent runs being throttled is ridden out, only a spent hour fails.
//
// #4183: the three board-wide reads are per-RUN constants, not per-issue ones — see
// `createBoardContext`. They used to run once per `syncIssue` call, which was free for the
// one-issue job this file is named for and a 9,000-point bill when projects-backfill.mjs calls it
// ninety times in five minutes.
import { missingDecisionCallout } from "./decision-callout.mjs";
import { ghRateLimit, ghRest, sh, withRetry } from "./gh.mjs";
import {
  explainMaskedOwnerFailure,
  isBacklogCandidate,
  isMaskedOwnerFailure,
  isRateLimitExhausted,
  isRetryableProjectsGhError,
  isRetryableRestError,
  resolveBoardItem,
  runThroughRateLimit,
  statusForIssue,
} from "./projects.mjs";

const OWNER = "ejclark";
const PROJECT_NUMBER = 2; // created by projects-setup.mjs's first live run (2026-09-27)

// `gh project item-list` defaults to 30 rows and the board passed that on its first backfill, so
// every lookup here asks for far more than the board will plausibly hold; `resolveBoardItem` throws
// rather than guess if the list ever does come back truncated (#3954).
const ITEM_LIST_LIMIT = 1000;

/**
 * Asks the credential directly what `gh project` refused to say (#3914). Never throws — its entire
 * job is turning an opaque failure into a sentence, so a failure here is the answer, not an error.
 */
function probeGraphql() {
  try {
    return { ok: true, text: sh("gh", ["api", "graphql", "-f", "query=query{viewer{login}}"]) };
  } catch (err) {
    return { ok: false, text: `${err?.stderr ?? ""} ${err?.message ?? ""}` };
  }
}

/**
 * EVERY `gh project` call in this module goes through here, so all of them get the same two things
 * #3914 proved were missing: a retry that can actually see gh's masked transient
 * (`isRetryableProjectsGhError`), and — when it sticks — an error that names the cause instead of
 * handing the next repair session `unknown owner type` and a stack trace. `item-edit` had no retry
 * at all before this; it shells to the same subcommand family and fails the same way.
 */
function ghProject(args) {
  const run = () => sh("gh", ["project", ...args]);
  try {
    return withRetry(run, { isTransient: isRetryableProjectsGhError });
  } catch (err) {
    const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
    // #4183: an exhausted hourly budget used to surface as a raw `child_process` stack trace, and
    // the repair session it dispatched spent its first ten minutes working out that "GraphQL: API
    // rate limit exceeded for user ID 3472134" was a quota, not a bug. `ghRateLimit` is free, so
    // asking GitHub for the reset stamp on the way out costs nothing and answers that in one line.
    // #4213: the same question also answers whether it is a quota AT ALL — `runThroughRateLimit`
    // rides out a throttled burst rather than failing `main` for a squeeze that clears in a minute.
    if (isRateLimitExhausted(text)) {
      return runThroughRateLimit({
        call: `\`gh project ${args[0]}\``,
        run,
        firstError: err,
        readBudget: ghRateLimit,
      });
    }
    if (!isMaskedOwnerFailure(text)) throw err;
    throw new Error(explainMaskedOwnerFailure(probeGraphql()), { cause: err });
  }
}

function ghProjectJson(args) {
  return JSON.parse(ghProject([...args, "--format", "json"]));
}

function findField(fieldList, name) {
  return fieldList.find((f) => f.name === name);
}

function optionByName(field, name) {
  return (field.options ?? []).find((o) => o.name === name);
}

function readItemsFromGh() {
  const raw = ghProjectJson([
    "item-list",
    String(PROJECT_NUMBER),
    "--owner",
    OWNER,
    "--limit",
    String(ITEM_LIST_LIMIT),
  ]);
  const items = Array.isArray(raw) ? raw : (raw.items ?? []);
  return { items, totalCount: raw?.totalCount };
}

function readFieldsFromGh() {
  const fields = ghProjectJson([
    "field-list",
    String(PROJECT_NUMBER),
    "--owner",
    OWNER,
    "--limit",
    "100",
  ]);
  return Array.isArray(fields) ? fields : (fields.fields ?? []);
}

function readProjectFromGh() {
  const projects = ghProjectJson(["list", "--owner", OWNER, "--limit", "100"]);
  const projectList = Array.isArray(projects) ? projects : (projects.projects ?? []);
  const project = projectList.find((p) => p.number === PROJECT_NUMBER);
  if (!project) throw new Error(`project #${PROJECT_NUMBER} not found under ${OWNER}`);
  return project;
}

/**
 * THE PER-RUN CONSTANTS, READ ONCE. #4183: the project's id, its field/option ids, and the board's
 * item list are the same for every issue a single process syncs — nothing but our own adds changes
 * them mid-run, and `noteAdded` folds those in. `syncIssue` re-read all three on every call, which
 * cost nothing noticeable for the one-issue `sync project status` job but spent Eric's entire
 * 5,000-point GraphQL hour when projects-backfill.mjs called it once per open issue (the item-list
 * page alone is priced at ~100 points by node count).
 *
 * LAZY ON PURPOSE. A sync that exits before it needs the board — a `ci-failure` tracker is not a
 * backlog candidate — must still spend zero GraphQL, which it cannot do if the constructor reads.
 *
 * The three readers are injected so the memoization is provable without a network call; the defaults
 * are the real `gh project` calls. A caller that wants today's per-issue behaviour simply builds a
 * fresh context per issue — the default when `syncIssue` is given no `board`.
 */
export function createBoardContext({
  readItems = readItemsFromGh,
  readFields = readFieldsFromGh,
  readProject = readProjectFromGh,
} = {}) {
  let items;
  let fields;
  let project;

  return {
    items({ refresh = false } = {}) {
      if (refresh || !items) items = readItems();
      return items;
    },
    fields() {
      fields ??= readFields();
      return fields;
    },
    project() {
      project ??= readProject();
      return project;
    },
    /**
     * Fold an item this process just added into the cached list, so the board we hold stays true
     * without paying for another `item-list`. A no-op before the list has been read — there is no
     * cache to keep honest yet, and inventing one would hide a later read's real answer.
     */
    noteAdded(item) {
      if (items && item) items.items = [...(items.items ?? []), item];
    },
  };
}

/**
 * The issue's own REST read, with the same bounded backoff every `gh project` call here already has
 * (#4182). `ghRest` shells to curl, whose 5xx wording `isTransientGhError` never matched, so a single
 * GitHub 502 on this read failed the issue outright — once in the events lane, a dozen times in one
 * backfill. 5xx and network blips only: a rate-limit 403/429 still fails at once, by design.
 * `read`/`sleep` are injected so the retry is provable without a network call.
 */
export function readIssue(issueNumber, { read = ghRest, sleep } = {}) {
  return withRetry(() => read(`issues/${issueNumber}`), {
    isTransient: isRetryableRestError,
    ...(sleep ? { sleep } : {}),
  });
}

/**
 * Adds the issue to the board if it isn't there yet, sets Status always, and sets Horizon only
 * when the caller supplies one — Horizon is a sequencing judgment (same footing as Priority,
 * which nothing here ever sets automatically either), so a plain per-issue sync call with no
 * `horizon` leaves it untouched rather than guessing.
 *
 * Returns `{skipped}` for a non-candidate (e.g. a `ci-failure` tracker), `{status, horizon, added}`
 * otherwise (`added` false = it was already an item). Throws loudly on any GitHub-side surprise —
 * never a silent partial write.
 *
 * `board` is a `createBoardContext()` the caller may share across many issues (#4183); left out, it
 * makes its own, which is the one-issue `sync project status` job's behaviour unchanged.
 */
export function syncIssue(issueNumber, { horizon, board = createBoardContext() } = {}) {
  const issue = readIssue(issueNumber);
  const labels = (issue.labels ?? []).map((l) => l.name);

  if (!isBacklogCandidate({ labels })) {
    return { skipped: true, reason: "not a backlog candidate" };
  }

  const decisionCalloutMissing = missingDecisionCallout({
    labels,
    body: issue.body,
    author: issue.user?.login,
  });
  const status = statusForIssue({ state: issue.state, labels, decisionCalloutMissing });

  // Add-or-find, never add-and-hope: `item-add` errors on an issue that is already an item, and
  // every sync after an issue's first one hits exactly that (#3954). The board list we already hold
  // answers that common case for free (#4183), and only a miss pays for the add.
  const { item, added } = resolveBoardItem({
    issueUrl: issue.html_url,
    cachedItems: board.items().items,
    addItem: () =>
      ghProjectJson([
        "item-add",
        String(PROJECT_NUMBER),
        "--owner",
        OWNER,
        "--url",
        issue.html_url,
      ]),
    listItems: () => board.items({ refresh: true }),
  });
  if (added) board.noteAdded(item);

  const fieldList = board.fields();
  const project = board.project();

  const setSingleSelect = (fieldName, optionName) => {
    const field = findField(fieldList, fieldName);
    if (!field)
      throw new Error(
        `no "${fieldName}" field found on project #${PROJECT_NUMBER} — has setup run?`,
      );
    const option = optionByName(field, optionName);
    if (!option) {
      const have = (field.options ?? []).map((o) => o.name).join(", ");
      throw new Error(`${fieldName} field has no "${optionName}" option (has: ${have})`);
    }
    ghProject([
      "item-edit",
      "--id",
      item.id,
      "--field-id",
      field.id,
      "--project-id",
      project.id,
      "--single-select-option-id",
      option.id,
    ]);
  };

  setSingleSelect("Status", status);
  if (horizon) setSingleSelect("Horizon", horizon);

  return { status, horizon: horizon ?? null, added, decisionCalloutMissing };
}

function main() {
  const issueNumber = process.argv[2];
  if (!issueNumber) {
    console.error("usage: projects-sync.mjs <issue-number>");
    process.exit(1);
  }

  const result = syncIssue(issueNumber);
  if (result.skipped) {
    console.log(`issue #${issueNumber}: ${result.reason}, skipping`);
    return;
  }
  console.log(
    `issue #${issueNumber}: ${result.added ? "added to board" : "already on board"}, ` +
      `Status="${result.status}"${result.horizon ? ` Horizon="${result.horizon}"` : ""}`,
  );
  if (result.decisionCalloutMissing) {
    console.log(
      `issue #${issueNumber}: labelled needs-eric with no "Needs from you" callout — kept out of Blocked (#3913)`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
