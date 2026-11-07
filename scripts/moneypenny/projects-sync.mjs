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
import { readFileSync } from "node:fs";
import { withOpenSubIssues } from "./admission.mjs";
import { missingDecisionCallout } from "./decision-callout.mjs";
import { ghRateLimit, ghRest, ghRestAll, isTransientGhError, sh, withRetry } from "./gh.mjs";
import { labelNames } from "./labels.mjs";
import { openPrsByIssue, platterClosesByIssue } from "./pr-issues.mjs";
import {
  boardItemsFromProjectItems,
  boardSyncSkip,
  cardFieldValues,
  explainMaskedOwnerFailure,
  findBoardItem,
  IN_COLUMN_SINCE,
  isBacklogCandidate,
  isMaskedOwnerFailure,
  isRateLimitExhausted,
  isRetryableProjectsGhError,
  isRetryableRestError,
  isStartedPlan,
  KIND,
  priorityValues,
  resolveBoardItem,
  runThroughRateLimit,
  SYNCED_PRIORITY,
  statusForIssue,
  subIssueCounts,
  WAITING_ON,
} from "./projects.mjs";
import { describeCardFields, planCardFields, wantedCardFields } from "./projects-fields.mjs";
import { describePriority, planPriority, wantedPriorityOf } from "./projects-priority.mjs";

const OWNER = "ejclark";
const PROJECT_NUMBER = 2; // created by projects-setup.mjs's first live run (2026-09-27)

// `gh project item-list` defaulted to 30 rows and the board passed that on its first backfill, so
// every whole-board read asks for far more than the board will plausibly hold (the page cap in
// `readBoardItemsFromGh`, #4760); `resolveBoardItem` throws rather than guess if the list ever does
// come back truncated (#3954).
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

function findField(fieldList, name) {
  return fieldList.find((f) => f.name === name);
}

function optionByName(field, name) {
  return (field.options ?? []).find((o) => o.name === name);
}

// #4760 — THE SWEEP'S BOARD READ ASKS ONLY FOR WHAT THE SWEEP READS. `gh project item-list` asked
// `fieldValues(first:100)` under every card, and GraphQL prices a connection by the `first` of
// everything nested in it — ~310 points a sweep at ~565 cards (measured 2026-10-25: back-to-back
// sweeps 4998 → 4688). board-sync.yml sweeps on every push to main, so 9 pushes spent Eric's hour:
// 47 of 143 sweeps refused on 2026-10-19/20, and every per-issue sync behind them skipped. 138 of
// those 143 sweeps wrote nothing. The consumers read four things — `id`, `content.url`, `status`
// and `totalCount` — so this asks for exactly those, with Status as one `fieldValueByName` object
// rather than a connection: `items(first:100)` is the only connection, 1 point per page by GitHub's
// formula. `rateLimit` rides in the same request so every sweep logs what it really spent — that
// logged number is the issue's After line, and the first live run is the test of the estimate.
//
// ARCHIVED CARDS ARE DROPPED here, as `item-list` dropped them, so `resolveBoardItem`'s archived
// message stays reachable. They leave `totalCount` too — otherwise `boardItemsOrThrow` would read
// every archived card as truncation. A page cap stops a runaway cursor; a capped read still counts
// more than it returns, so the truncation guards refuse it instead of reporting a half board.
// #6871: Priority and its hidden record ride along as two more single objects, not connections —
// the same price rule as Status above. A field the board does not carry yet answers null.
const PRIORITY_VALUES = `priority: fieldValueByName(name:"Priority"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
        synced: fieldValueByName(name:"${SYNCED_PRIORITY}"){ ... on ProjectV2ItemFieldTextValue{ text } }`;

// #6871 slice 3: Kind and "Waiting on" ride along the same way. A field the board does not carry yet
// answers null, so a sweep before the setup dispatch reads them as unset. "In this column since" is
// write-only: the sync stamps it when Status changes and never needs to read it back.
const CARD_VALUES = `kind: fieldValueByName(name:"${KIND}"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
        waiting: fieldValueByName(name:"${WAITING_ON}"){ ... on ProjectV2ItemFieldTextValue{ text } }`;

const BOARD_ITEMS_QUERY = `query($owner:String!,$project:Int!,$after:String){
  user(login:$owner){ projectV2(number:$project){
    items(first:100, after:$after){ totalCount pageInfo{ hasNextPage endCursor }
      nodes{ id isArchived
        content{ __typename ... on Issue{ url } ... on PullRequest{ url } }
        status: fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
        ${PRIORITY_VALUES}
        ${CARD_VALUES}
      } }
  } }
  rateLimit{ cost remaining resetAt }
}`;

/**
 * Every card on the board as `{items:[{id, status?, content:{type, url?}}], totalCount}` — the
 * shape `gh project item-list --format json` returned, at ~1 point per 100 cards (#4760). `gh` and
 * `log` injected so the argv, the pagination and the archived filter are provable without a network.
 */
export function readBoardItemsFromGh({
  gh = (argv) => runGh("`gh api graphql` (board items)", argv),
  log = console.log,
  maxPages = Math.ceil(ITEM_LIST_LIMIT / 100),
} = {}) {
  const items = [];
  let reported;
  let archived = 0;
  let cost = 0;
  let remaining;
  let pages = 0;
  let after;
  while (pages < maxPages) {
    const argv = [
      "api",
      "graphql",
      "-f",
      `query=${BOARD_ITEMS_QUERY}`,
      "-F",
      `owner=${OWNER}`,
      "-F",
      `project=${PROJECT_NUMBER}`,
    ];
    if (after) argv.push("-f", `after=${after}`);
    const data = JSON.parse(gh(argv) || "null")?.data;
    const page = data?.user?.projectV2?.items;
    if (!page) throw new Error(`project #${PROJECT_NUMBER} not found under ${OWNER}`);
    pages += 1;
    reported = page.totalCount;
    cost += data.rateLimit?.cost ?? 0;
    remaining = data.rateLimit?.remaining ?? remaining;
    for (const node of page.nodes ?? []) {
      if (!node?.id) continue;
      if (node.isArchived) {
        archived += 1;
        continue;
      }
      const { __typename, url } = node.content ?? {};
      items.push({
        id: node.id,
        ...(node.status?.name ? { status: node.status.name } : {}),
        ...priorityValues(node),
        ...cardFieldValues(node),
        content: __typename ? { type: __typename, ...(url ? { url } : {}) } : null,
      });
    }
    if (!(page.pageInfo?.hasNextPage && page.pageInfo.endCursor)) break;
    after = page.pageInfo.endCursor;
  }
  log(
    `board read: ${items.length} item(s) in ${pages} page(s), ${cost} graphql point(s) spent, ` +
      `${remaining ?? "?"} left (#4760)`,
  );
  const totalCount = typeof reported === "number" ? reported - archived : items.length;
  return { items, totalCount };
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
// `item-add` left it in #5792 (see `addIssueToBoardFromGh`) — every brand-new issue's first sync
// runs it, so "rarely runs" was never true of the add — and `item-list` in #4760
// (`readBoardItemsFromGh`), for its price rather than its owner lookup. An option's `color` and
// `description` ride along (#6871 slice 2): `statusFieldUpdate` rewrites a column whose dial
// sentence went stale, which a names-only read could never see.
const PROJECT_SHAPE_QUERY = `query($owner:String!,$project:Int!){
  user(login:$owner){ projectV2(number:$project){ id number
    fields(first:100){ nodes{
      __typename
      ... on ProjectV2FieldCommon{ id name }
      ... on ProjectV2SingleSelectField{ options{ id name color description } }
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
      projectItems(first:20,includeArchived:false){ nodes{ id project{ number }
        status: fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
        ${PRIORITY_VALUES}
        ${CARD_VALUES} } }
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

// #5792 — THE ADD SKIPS gh's OWNER LOOKUP TOO. Run 39184644834 lost `gh project item-add 2 --owner
// ejclark` for brand-new #5791 to the same masked `unknown owner type` #4933 took off the reads,
// while the GraphQL probe on the same token succeeded. `item-add` is a thin wrapper over this one
// mutation; asked directly with ids we already hold (the board's from `board.project()`, the issue's
// `node_id` from its REST read), a GitHub fault keeps its own words for `isTransientGhError`, and a
// second add still answers `Content already exists in this project` for `resolveBoardItem`.
const ADD_ITEM_MUTATION = `mutation($project:ID!,$content:ID!){
  addProjectV2ItemById(input:{projectId:$project,contentId:$content}){ item{ id } }
}`;

/**
 * Put one issue on the board by id, shaped like the `item-list` row `findBoardItem` matches on, so
 * `noteAdded` keeps a cached list honest. `gh` injected so the argv and the fail-closed parse are
 * provable without a network call.
 */
export function addIssueToBoardFromGh(
  { projectId, issue },
  { gh = (argv) => runGh("`gh api graphql` (addProjectV2ItemById)", argv) } = {},
) {
  if (!projectId) throw new Error(`no project id for #${PROJECT_NUMBER} — cannot add to the board`);
  if (!issue?.node_id) {
    throw new Error(`issue ${issue?.html_url ?? "?"} has no node_id — cannot add it to the board`);
  }
  const out = gh([
    "api",
    "graphql",
    "-f",
    `query=${ADD_ITEM_MUTATION}`,
    "-F",
    `project=${projectId}`,
    "-F",
    `content=${issue.node_id}`,
  ]);
  const id = JSON.parse(out || "null")?.data?.addProjectV2ItemById?.item?.id;
  if (!id)
    throw new Error(`adding ${issue.html_url} to project #${PROJECT_NUMBER} returned no item`);
  return { id, content: { type: "Issue", url: issue.html_url } };
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
  readItems = readBoardItemsFromGh,
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
    /**
     * Always asks GitHub about this issue alone, never a held list (#6775): the re-check after a
     * sibling's add, which a cached or lagging whole-board list is exactly what failed to show.
     */
    issueItems(issue) {
      return readIssueItems(issue);
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

// ── which column (#6871 slice 2) ─────────────────────────────────────────────────────────────────

/**
 * The column one open or closed issue (a REST row) belongs in — `statusForIssue` fed with
 * everything the rule reads, or null for a card the board never carries (`isBacklogCandidate`).
 * Shared by the one-issue sync and the reconcile sweep so the two can never disagree.
 *
 * `context` carries the reads beyond the issue's own row, each optional:
 *   columns          — the live board's option names (the rename window, `statusForIssue`)
 *   openSubIssuesOf  — issue → its open sub-issues `[{number, labels}]`, undefined when unread
 *   prMaps           — () => {boardedOn, openPrOn}: the open-PR reads (`platterClosesByIssue`,
 *                      `openPrsByIssue`). Asked only for a card that would otherwise read Ready —
 *                      the only column those two checks can move — so a sync that lands anywhere
 *                      else costs no PR list.
 */
export function wantedColumn(issue, context = {}) {
  return wantedCard(issue, context)?.status ?? null;
}

/**
 * `wantedColumn` with the reads behind it (#6871 slice 3): `{status, decisionCalloutMissing,
 * boardedOn, namedByOpenPr}`, or null for a card the board never carries. The extras are what the
 * "Waiting on" field needs to name who acts next, so it and the column come from ONE evaluation of
 * the rule and cannot disagree. `boardedOn` / `namedByOpenPr` are undefined unless the card read
 * Ready first (the only column those two checks can move).
 */
export function wantedCard(issue, { columns, openSubIssuesOf, prMaps } = {}) {
  const labels = labelNames(issue?.labels);
  if (!isBacklogCandidate({ labels })) return null;
  const decisionCalloutMissing = missingDecisionCallout({ labels, body: issue?.body });
  const base = {
    number: issue?.number,
    state: issue?.state ?? "open",
    labels,
    decisionCalloutMissing,
    subIssues: subIssueCounts(issue),
    openSubIssues: openSubIssuesOf?.(issue),
    blockedBy: Number(issue?.issue_dependencies_summary?.blocked_by) || 0,
    ...(columns?.length ? { columns } : {}),
  };
  const status = statusForIssue(base);
  if (status !== "Ready" || !prMaps) return { status, decisionCalloutMissing };
  const { boardedOn, openPrOn } = prMaps();
  const namedByOpenPr = Boolean(openPrOn?.has(Number(issue?.number)));
  return {
    status: statusForIssue({ ...base, boardedOn, namedByOpenPr }),
    decisionCalloutMissing,
    boardedOn,
    namedByOpenPr,
  };
}

/**
 * The open-PR reads as `{boardedOn, openPrOn}` from ONE `pulls?state=open` list, memoized —
 * FAIL-OPEN to empty maps, as `readBoarded` and the sweep's own open-PR read already are: the
 * board is a display, and a card left in Ready for one sweep costs less than a red sync.
 */
export function openPrMaps({ read = () => ghRestAll("pulls?state=open"), log = console.log } = {}) {
  let maps;
  return () => {
    if (maps) return maps;
    try {
      const rows = read() ?? [];
      maps = { boardedOn: platterClosesByIssue(rows), openPrOn: openPrsByIssue(rows) };
    } catch (err) {
      log(
        `::warning::the open PRs could not be read — Ready is not screened for open or boarded PRs this run: ${String(err?.message).slice(0, 200)}`,
      );
      maps = { boardedOn: new Map(), openPrOn: new Map() };
    }
    return maps;
  };
}

/**
 * One issue's open sub-issues, read only for a started plan (one REST call; `withOpenSubIssues`,
 * admission.mjs, the read the started-plan cap makes) — undefined for anything else, and on a
 * failed read, which keeps the plan's seat exactly as the cap does.
 */
export function readOpenSubIssuesOf(issue, readAll = ghRestAll) {
  const labels = labelNames(issue?.labels);
  if (!isStartedPlan({ labels, subIssues: subIssueCounts(issue) })) return undefined;
  return withOpenSubIssues({ ...issue, labels }, readAll).openSubIssues;
}

// ── Priority (#6871 slice B1) ────────────────────────────────────────────────────────────────────
// The decision is projects-priority.mjs's `planPriority`; this is its IO. rank.mjs reads the same
// Horizon triage file, so `Later` means P3 on the board exactly as it does in `npm run rank`.
const HORIZONS_PATH = new URL("./projects-horizons.json", import.meta.url);
let horizonTriage;
/** The hand Horizon triage (issue number → Now/Next/Later), read once per process. */
export function readHorizons() {
  if (horizonTriage) return horizonTriage;
  try {
    horizonTriage = JSON.parse(readFileSync(HORIZONS_PATH, "utf8"));
  } catch {
    horizonTriage = {};
  }
  return horizonTriage;
}

const REPO = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";

/** A label write over REST (the core bucket), retried on GitHub's 5xx like every call here. */
function ghLabel(argv) {
  return withRetry(() => sh("gh", argv), { isTransient: isTransientGhError });
}

/**
 * Bring one open issue's Priority card in line with its labels — or, when a human dragged the card,
 * carry the drag back to the labels FIRST (Eric, 2026-11-04: "Drag sets priority"). Every write
 * arrives through `io`, so each route is provable without a network call:
 *   io.readFresh()        → this card as GitHub sees it now, or undefined
 *   io.setPriority(name)  · io.setRecord(text) · io.addLabel(name) · io.removeLabel(name)
 *
 * `fresh` says whether `item`'s values were read moments ago. A sweep's are from its start, and a
 * drag made since would be overwritten by a stale "write" — so before acting on held values, the
 * card is re-read (one point) and re-planned. Order is load-bearing (projects-priority.mjs header):
 * Priority before its record; labels (old off, new on) before the record on a drag.
 *
 * Returns the plan it applied, or `{action: "skipped", reason}`.
 */
export function syncPriority({ issue, item, fresh = false, ready = true, horizons = {}, io }) {
  if (issue?.state === "closed") return { action: "skipped", reason: "closed" };
  if (!ready) {
    return {
      action: "skipped",
      reason: `no "${SYNCED_PRIORITY}" field on the board yet — projects-setup.yml creates it`,
    };
  }
  const wanted = wantedPriorityOf(issue, { horizons });
  const planFor = (card) =>
    planPriority({
      current: card?.priority ?? null,
      synced: card?.syncedPriority ?? null,
      wanted,
      labels: issue?.labels,
    });
  let plan = planFor(item);
  if (!fresh && plan.action !== "none" && plan.action !== "foreign") {
    const now = io.readFresh();
    if (now) plan = planFor(now);
  }
  if (plan.action === "write") {
    io.setPriority(plan.value);
    io.setRecord(plan.value);
  } else if (plan.action === "record") {
    io.setRecord(plan.value);
  } else if (plan.action === "drag") {
    // Remove before add: with no P label for a moment, a sync reading in between still sees the
    // card off its record and re-plans the same drag. Two P labels at once would let `classOf`
    // pick the old lane and overwrite the drag.
    for (const name of plan.remove) io.removeLabel(name);
    for (const name of plan.add) io.addLabel(name);
    io.setRecord(plan.lane);
  }
  return plan;
}

/**
 * Adds the issue to the board if it isn't there yet, sets Status when it differs, sets Priority
 * from the labels (or carries a drag back to them, `syncPriority`), and sets Horizon only when the
 * caller supplies one — Horizon is a sequencing judgment, so a plain per-issue sync call with no
 * `horizon` leaves it untouched rather than guessing.
 *
 * Returns `{skipped}` for a non-candidate (e.g. a `ci-failure` tracker), `{status, horizon, added,
 * priority}` otherwise (`added` false = it was already an item). Throws loudly on any GitHub-side
 * surprise — never a silent partial write.
 *
 * `board` is a `createBoardContext()` the caller may share across many issues (#4183); left out, it
 * makes its own, which is the one-issue `sync project status` job's behaviour unchanged.
 */
export function syncIssue(
  issueNumber,
  {
    horizon,
    board = createBoardContext(),
    context = oneIssueContext(),
    today = new Date().toISOString().slice(0, 10),
  } = {},
) {
  const issue = readIssue(issueNumber);
  const labels = (issue.labels ?? []).map((l) => l.name);

  if (!isBacklogCandidate({ labels })) {
    return { skipped: true, reason: "not a backlog candidate" };
  }

  const decisionCalloutMissing = missingDecisionCallout({ labels, body: issue.body });

  // Add-or-find, never add-and-hope: `item-add` errors on an issue that is already an item, and
  // every sync after an issue's first one hits exactly that (#3954). The board list we already hold
  // answers that common case for free (#4183), and only a miss pays for the add.
  const { item, added } = resolveBoardItem({
    issueUrl: issue.html_url,
    cachedItems: board.itemsFor(issue),
    addItem: () => addIssueToBoardFromGh({ projectId: board.project().id, issue }),
    lookupItems: () => board.issueItems(issue),
    listItems: () => board.items({ refresh: true }),
  });
  if (added) board.noteAdded(item);

  const fieldList = board.fields();
  const project = board.project();
  // The live board's own column names (#4393 slice 4): a rule that names a column the field does
  // not carry yet falls back rather than failing the sync — see `statusForIssue`'s `columns`.
  const columns = (findField(fieldList, "Status")?.options ?? []).map((o) => o.name);
  const card = wantedCard(issue, { ...context, columns });
  const status = card.status;

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

  const setValue = (fieldName, flag, value) => {
    const { id } = findField(fieldList, fieldName);
    ghProject([
      "item-edit",
      "--id",
      item.id,
      "--field-id",
      id,
      "--project-id",
      project.id,
      ...(flag ? [flag, value] : ["--clear"]),
    ]);
  };
  const setText = (fieldName, text) => setValue(fieldName, "--text", text);

  // Kind, "Waiting on" and "In this column since" (#6871 slice 3). A closed card keeps its Kind,
  // gets the day (Done is a column too) and has its "Waiting on" cleared; a field setup has not
  // made yet is skipped, not an error. The day is
  // written BEFORE Status (projects-fields.mjs header): a failed Status write then re-writes both.
  const closed = status === "Done";
  const present = {
    [IN_COLUMN_SINCE]: Boolean(findField(fieldList, IN_COLUMN_SINCE)),
    [KIND]: !closed && Boolean(findField(fieldList, KIND)),
    [WAITING_ON]: Boolean(findField(fieldList, WAITING_ON)),
  };
  const fieldWrites = planCardFields({
    have: item,
    // A closed card keeps its Kind, but nothing waits on anyone: "Waiting on" is cleared.
    wanted: closed
      ? { waitingOn: "" }
      : wantedCardFields(issue, card, { horizons: readHorizons() }),
    status,
    today,
    present,
  });
  const writeCardField = (w) => {
    if (w.kind === "select") setSingleSelect(w.field, w.value);
    else if (w.kind === "date") setValue(w.field, "--date", w.value);
    else if (w.kind === "text") setText(w.field, w.value);
    else setValue(w.field, null);
  };
  for (const w of fieldWrites.filter((x) => x.kind === "date")) writeCardField(w);

  // The card's own Status rides on both reads (the board list, and since #6871 slice 2 the
  // per-issue lookup too), so an unchanged Status is not rewritten — a sweep filling Priority
  // would otherwise pay a third mutation per card, and every label event a needless write.
  if (item.status !== status) setSingleSelect("Status", status);
  if (horizon) setSingleSelect("Horizon", horizon);
  for (const w of fieldWrites.filter((x) => x.kind !== "date")) writeCardField(w);
  const labelsPath = `repos/${REPO}/issues/${issue.number}/labels`;
  const priority = syncPriority({
    issue,
    item,
    fresh: added,
    ready: Boolean(findField(fieldList, SYNCED_PRIORITY)),
    horizons: readHorizons(),
    io: {
      readFresh: () => {
        try {
          return findBoardItem(board.issueItems(issue), issue.html_url);
        } catch (err) {
          if (isRateLimitExhausted(`${err?.stderr ?? ""} ${err?.message ?? ""}`)) throw err;
          return undefined;
        }
      },
      setPriority: (name) => setSingleSelect("Priority", name),
      setRecord: (text) => setText(SYNCED_PRIORITY, text),
      addLabel: (name) => ghLabel(["api", "-X", "POST", labelsPath, "-f", `labels[]=${name}`]),
      removeLabel: (name) =>
        ghLabel(["api", "-X", "DELETE", `${labelsPath}/${encodeURIComponent(name)}`]),
    },
  });

  return {
    status,
    horizon: horizon ?? null,
    added,
    decisionCalloutMissing,
    priority,
    fields: fieldWrites,
    parent: localParentOf(issue),
  };
}

/**
 * The parent issue's number when the parent lives in THIS repo, else null. `parent_issue_url` is an
 * API url and GitHub allows a parent in another repo; reading only its number would re-sync, or
 * group sub-issues under, an unrelated local issue with the same number.
 */
export function localParentOf(issue, repo = REPO) {
  const m = /^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/issues\/(\d+)$/.exec(
    String(issue?.parent_issue_url ?? ""),
  );
  return m && m[1].toLowerCase() === repo.toLowerCase() ? Number(m[2]) : null;
}

/**
 * The reads a one-issue sync makes for itself: its sub-issues when it is a started plan, and the
 * open-PR list only when it would land in Ready. A sweep passes its own, read once for every card.
 */
export function oneIssueContext() {
  return { openSubIssuesOf: (issue) => readOpenSubIssuesOf(issue), prMaps: openPrMaps() };
}

/**
 * Sync one issue, skipping with a warning on a rate limit or a GitHub-side fault (#4438, #6746);
 * anything else stays red. Returns the result, or null when it skipped.
 */
function syncOrSkip(issueNumber, opts) {
  try {
    return syncIssue(issueNumber, opts);
  } catch (error) {
    let budget = {};
    try {
      budget = ghRateLimit().graphql ?? {};
    } catch {
      budget = {};
    }
    const warning = boardSyncSkip({ issueNumber, error, budget });
    if (!warning) throw error;
    console.log(warning);
    return null;
  }
}

function report(issueNumber, result) {
  if (result.skipped) {
    console.log(`issue #${issueNumber}: ${result.reason}, skipping`);
    return;
  }
  console.log(
    `issue #${issueNumber}: ${result.added ? "added to board" : "already on board"}, ` +
      `Status="${result.status}"${result.horizon ? ` Horizon="${result.horizon}"` : ""}`,
  );
  const p = result.priority;
  console.log(
    p?.action === "skipped"
      ? `issue #${issueNumber}: Priority not synced — ${p.reason}`
      : describePriority(issueNumber, p),
  );
  if (result.fields?.length) console.log(describeCardFields(issueNumber, result.fields));
  if (result.decisionCalloutMissing) {
    console.log(
      `issue #${issueNumber}: labelled needs-eric with no "Needs from you" callout — kept in Backlog until the ask is written (#3913)`,
    );
  }
}

function main() {
  const issueNumber = process.argv[2];
  if (!issueNumber) {
    console.error("usage: projects-sync.mjs <issue-number>");
    process.exit(1);
  }
  const board = createBoardContext();
  const context = oneIssueContext();
  const result = syncOrSkip(issueNumber, { board, context });
  if (!result) return;
  report(issueNumber, result);
  // #6871 slice 2: a sub-issue's labels decide whether its parent plan holds a cap seat (Next part
  // queued) or waits on an approval (Next part needs approval), and the parent gets no event of
  // its own when a child's labels change. One level up, sharing this run's board and PR reads.
  // The child's own sync has landed, so a parent failure warns rather than reddening this job;
  // the reconcile sweep on the next push heals the parent's card.
  if (!result.parent) return;
  try {
    const parent = syncOrSkip(String(result.parent), { board, context });
    if (parent) report(String(result.parent), parent);
  } catch (err) {
    const text = String(err?.message ?? err)
      .replace(/\s+/g, " ")
      .slice(0, 300);
    console.log(
      `::warning title=Parent not synced::#${issueNumber}'s parent #${result.parent} was not synced — the next sweep re-syncs it. Cause: ${text}`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
