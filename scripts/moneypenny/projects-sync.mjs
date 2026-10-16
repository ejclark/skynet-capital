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
//
// #4439: and for the one-issue job the whole-board read was never free either — ~400 points a run
// meant a dozen `issues` events spent the PAT's hour, with `main` red behind them. `itemsFor` asks
// GitHub about the issue instead of about the board, and only a caller already holding a board list
// (a sweep) uses one.
import { missingDecisionCallout } from "./decision-callout.mjs";
import { ghRateLimit, ghRest, sh, withRetry } from "./gh.mjs";
import {
  boardItemsFromProjectItems,
  boardSyncSkip,
  explainMaskedOwnerFailure,
  isBacklogCandidate,
  isMaskedOwnerFailure,
  isRateLimitExhausted,
  isRetryableProjectsGhError,
  isRetryableRestError,
  resolveBoardItem,
  runThroughRateLimit,
  statusForIssue,
  subIssueCounts,
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
 * EVERY `gh` call in this module goes through here, so all of them get the same two things #3914
 * proved were missing: a retry that can actually see gh's masked transient
 * (`isRetryableProjectsGhError`), and — when it sticks — an error that names the cause instead of
 * handing the next repair session `unknown owner type` and a stack trace. `item-edit` had no retry
 * at all before this; it shells to the same subcommand family and fails the same way.
 *
 * `onStickyError` is the per-caller last word before the raw error escapes: only `gh project` can
 * produce `unknown owner type`, so only `ghProject` passes one (#4439 split this out so the
 * per-issue GraphQL read could share the rate-limit handling without inheriting that diagnosis).
 */
function runGh(call, argv, { onStickyError, input } = {}) {
  const run = () => (input === undefined ? sh("gh", argv) : sh("gh", argv, { input }));
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
      return runThroughRateLimit({ call, run, firstError: err, readBudget: ghRateLimit });
    }
    onStickyError?.(text, err);
    throw err;
  }
}

function ghProject(args) {
  return runGh(`\`gh project ${args[0]}\``, ["project", ...args], {
    onStickyError: (text, err) => {
      if (!isMaskedOwnerFailure(text)) return;
      throw new Error(explainMaskedOwnerFailure(probeGraphql()), { cause: err });
    },
  });
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

// #4933 — THE PER-RUN READS SKIP gh's OWNER LOOKUP. Every `gh project <cmd> --owner ejclark` first
// runs gh's `UserOrgOwner` query, which asks for BOTH `user(login)` and `organization(login)` and
// counts on the org half failing with exactly `NOT_FOUND`; any other error shape on either half
// becomes `unknown owner type` (cli/cli queries.go, `OwnerIDAndType`). So each call paid a second
// query whose only job is to rediscover a hard-coded constant, through the one path that destroys
// GitHub's error. Run 37881706331 lost `field-list` there three times in ~8s while a plain GraphQL
// probe on the same token succeeded. Asked of `user(login)` directly, a GitHub fault keeps its own
// words, which `isTransientGhError` already retries (#4675's "Something went wrong" included).
// A token blind to the board gets `projectV2: null` + NOT_FOUND and gh exits non-zero — still loud.
// `item-add` / `item-list` stay on `gh project`, behind #3914's retry and diagnosis: neither runs
// on a sync whose issue is already on the board.
const PROJECT_SHAPE_QUERY = `query($owner:String!,$project:Int!){
  user(login:$owner){ projectV2(number:$project){ id number
    fields(first:100){ nodes{
      __typename
      ... on ProjectV2FieldCommon{ id name }
      ... on ProjectV2SingleSelectField{ options{ id name } }
    } }
  } }
}`;

/**
 * The project's id and its fields, shaped like `gh project list` / `field-list` rows, in one
 * GraphQL call with no owner lookup (#4933). `gh` injected so the argv and the fail-closed parse
 * are provable without a network call.
 */
export function readProjectShapeFromGh({
  gh = (argv) => runGh("`gh api graphql` (project fields)", argv),
} = {}) {
  const out = gh([
    "api",
    "graphql",
    "-f",
    `query=${PROJECT_SHAPE_QUERY}`,
    "-F",
    `owner=${OWNER}`,
    "-F",
    `project=${PROJECT_NUMBER}`,
  ]);
  const node = JSON.parse(out || "null")?.data?.user?.projectV2;
  if (!node?.id) throw new Error(`project #${PROJECT_NUMBER} not found under ${OWNER}`);
  const fields = (node.fields?.nodes ?? [])
    .filter((f) => f?.id && f?.name)
    .map(({ __typename, id, name, options }) => ({
      id,
      name,
      type: __typename,
      ...(options ? { options } : {}),
    }));
  return { project: { id: node.id, number: node.number }, fields };
}

function readFieldsFromGh() {
  return readProjectShapeFromGh().fields;
}

// The one question the events lane actually has — "which item does THIS issue already have on the
// board?" — asked of the issue instead of of the board (#4439, see projects.mjs's block above
// `boardItemsFromProjectItems` for the arithmetic). `first: 20` is generous: an issue on more than a
// couple of projects is already unusual, and the nodes are two fields each, so the whole read prices
// out at a single point against the ~400 one `item-list` costs.
//
// THE `projectOwner` ALIAS IS THE LOAD-BEARING HALF, not decoration. A token that cannot SEE the
// project gets `projectItems: {nodes: []}` — indistinguishable from "this issue is not on the board",
// and a FALSE miss is the one outcome worse than the bug being fixed: it would send every sync down
// the `item-add` → "Content already exists" → re-read-the-whole-list path, three board pages instead
// of one. Asking for the project's id in the same breath makes that case LOUD: GitHub answers
// `NOT_FOUND` and gh exits non-zero (verified 2026-10-01 against this session's App token, which is
// blind to a personal-account project exactly as this module's header says), so `itemsFor`'s fallback
// takes over and the run costs what it costs today. An empty `nodes` can then only mean what it says.
const ISSUE_PROJECT_ITEMS_QUERY = `query($owner:String!,$repo:String!,$number:Int!,$projectOwner:String!,$project:Int!){
  projectOwner: user(login:$projectOwner){ projectV2(number:$project){ id } }
  repository(owner:$owner,name:$repo){
    issue(number:$number){
      projectItems(first:20,includeArchived:false){ nodes{ id project{ number } } }
    }
  }
}`;

/**
 * One issue's board items over GraphQL — the events lane's whole board bill, ~1 point (#4439).
 *
 * Exported with `gh` injected so the two things that make it safe are provable without a network
 * call: the argv it asks (both halves of the query, this issue's number) and the fail-closed read of
 * a response whose `projectOwner` came back blind.
 */
export function readIssueItemsFromGh(
  issue,
  { gh = (argv) => runGh("`gh api graphql` (one issue's project items)", argv) } = {},
) {
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital").split("/");
  const out = gh([
    "api",
    "graphql",
    "-f",
    `query=${ISSUE_PROJECT_ITEMS_QUERY}`,
    "-F",
    `owner=${owner}`,
    "-F",
    `repo=${repo}`,
    "-F",
    `number=${Number(issue?.number)}`,
    "-F",
    `projectOwner=${OWNER}`,
    "-F",
    `project=${PROJECT_NUMBER}`,
  ]);
  const data = JSON.parse(out || "null")?.data;
  if (!data?.projectOwner?.projectV2?.id) {
    throw new Error(
      `this token cannot see project #${PROJECT_NUMBER} under ${OWNER}, so an empty projectItems ` +
        "list would be a false miss — reading the board instead (#4439).",
    );
  }
  return boardItemsFromProjectItems({
    nodes: data.repository?.issue?.projectItems?.nodes,
    projectNumber: PROJECT_NUMBER,
    issueUrl: issue?.html_url,
  });
}

function readProjectFromGh() {
  return readProjectShapeFromGh().project;
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
  readIssueItems = readIssueItemsFromGh,
  log = console.log,
} = {}) {
  let items;
  let fields;
  let project;

  const readAllItems = ({ refresh = false } = {}) => {
    if (refresh || !items) items = readItems();
    return items;
  };

  return {
    items: readAllItems,
    /**
     * The candidate items for ONE issue, charged at the cheapest source that can answer (#4439).
     * A list this context has already read answers for free, which is the whole-backlog sweep's
     * path and #4183's fix unchanged; otherwise GitHub is asked about this issue alone — ~1 point
     * against the ~400 a board page costs, and the events lane's entire bill.
     *
     * A failed lookup FALLS BACK to the whole-board read rather than failing the sync: this is a
     * cost optimisation, and a cost optimisation that invents a new way to fail `main` has made
     * things worse. An exhausted quota is the one failure that propagates — a board read cannot
     * succeed where this just didn't, and `runThroughRateLimit` has already had its say.
     */
    itemsFor(issue) {
      if (items) return items.items ?? [];
      try {
        return readIssueItems(issue);
      } catch (err) {
        const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
        if (isRateLimitExhausted(text)) throw err;
        log(
          `per-issue board lookup failed (${text.replace(/\s+/g, " ").trim().slice(0, 200)}) — ` +
            "falling back to the whole-board read (#4439)",
        );
        return readAllItems().items ?? [];
      }
    },
    fields({ refresh = false } = {}) {
      if (refresh || !fields) fields = readFields();
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

// THE STATUS FIELD'S OPTION LIST, WRITTEN IN PLACE (#4393 slice 4). `updateProjectV2Field` REPLACES
// the whole `singleSelectOptions` list (verified against GitHub's GraphQL schema — gh CLI has no
// subcommand that edits an existing field's options). Each option input carries an optional `id`
// (introspected live 2026-10-05: `ProjectV2SingleSelectFieldOptionInput { id, name, color,
// description }`), and `statusFieldUpdate` (projects.mjs) fills it for every option that survives,
// so a rename keeps its cards and a new option is simply added. Shared by projects-setup.mjs (the
// one-time provisioning) and projects-reconcile.mjs (which applies it on the first push after the
// option list in projects.mjs changes, so nobody has to remember the dispatch).
const UPDATE_STATUS_OPTIONS_MUTATION = `
  mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]) {
    updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
      projectV2Field {
        ... on ProjectV2SingleSelectField {
          id
          options { id name }
        }
      }
    }
  }
`;

/** Send `options` (from `statusFieldUpdate`) as the Status field's whole option list. */
export function writeStatusOptions(fieldId, options) {
  const body = JSON.stringify({
    query: UPDATE_STATUS_OPTIONS_MUTATION,
    variables: { fieldId, options },
  });
  const out = runGh("`gh api graphql` (updateProjectV2Field)", ["api", "graphql", "--input", "-"], {
    input: body,
  });
  return JSON.parse(out || "null")?.data?.updateProjectV2Field?.projectV2Field ?? null;
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

  // Add-or-find, never add-and-hope: `item-add` errors on an issue that is already an item, and
  // every sync after an issue's first one hits exactly that (#3954). The board list we already hold
  // answers that common case for free (#4183), and only a miss pays for the add.
  const { item, added } = resolveBoardItem({
    issueUrl: issue.html_url,
    cachedItems: board.itemsFor(issue),
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
  // The live board's own column names (#4393 slice 4): a rule that names a column the field does
  // not carry yet falls back rather than failing the sync — see `statusForIssue`'s `columns`.
  const columns = (findField(fieldList, "Status")?.options ?? []).map((o) => o.name);
  const status = statusForIssue({
    state: issue.state,
    labels,
    decisionCalloutMissing,
    subIssues: subIssueCounts(issue),
    ...(columns.length ? { columns } : {}),
  });

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

  let result;
  try {
    result = syncIssue(issueNumber);
  } catch (error) {
    // #4438: a rate limit skips with a warning (the board is a display); anything else stays red.
    let budget = {};
    try {
      budget = ghRateLimit().graphql ?? {};
    } catch {
      budget = {};
    }
    const warning = boardSyncSkip({ issueNumber, error, budget });
    if (!warning) throw error;
    console.log(warning);
    return;
  }
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
