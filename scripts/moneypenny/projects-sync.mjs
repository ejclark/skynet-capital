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
import { ghRest, sh, withRetry } from "./gh.mjs";
import {
  explainMaskedOwnerFailure,
  isBacklogCandidate,
  isMaskedOwnerFailure,
  isRetryableProjectsGhError,
  resolveBoardItem,
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
  try {
    return withRetry(() => sh("gh", ["project", ...args]), {
      isTransient: isRetryableProjectsGhError,
    });
  } catch (err) {
    const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
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

/**
 * Adds the issue to the board if it isn't there yet, sets Status always, and sets Horizon only
 * when the caller supplies one — Horizon is a sequencing judgment (same footing as Priority,
 * which nothing here ever sets automatically either), so a plain per-issue sync call with no
 * `horizon` leaves it untouched rather than guessing.
 *
 * Returns `{skipped}` for a non-candidate (e.g. a `ci-failure` tracker), `{status, horizon, added}`
 * otherwise (`added` false = it was already an item). Throws loudly on any GitHub-side surprise —
 * never a silent partial write.
 */
export function syncIssue(issueNumber, { horizon } = {}) {
  const issue = ghRest(`issues/${issueNumber}`);
  const labels = (issue.labels ?? []).map((l) => l.name);

  if (!isBacklogCandidate({ labels })) {
    return { skipped: true, reason: "not a backlog candidate" };
  }

  const status = statusForIssue({ state: issue.state, labels });

  // Add-or-find, never add-and-hope: `item-add` errors on an issue that is already an item, and
  // every sync after an issue's first one hits exactly that (#3954).
  const { item, added } = resolveBoardItem({
    issueUrl: issue.html_url,
    addItem: () =>
      ghProjectJson([
        "item-add",
        String(PROJECT_NUMBER),
        "--owner",
        OWNER,
        "--url",
        issue.html_url,
      ]),
    listItems: () => {
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
    },
  });

  const fields = ghProjectJson([
    "field-list",
    String(PROJECT_NUMBER),
    "--owner",
    OWNER,
    "--limit",
    "100",
  ]);
  const fieldList = Array.isArray(fields) ? fields : (fields.fields ?? []);

  const projects = ghProjectJson(["list", "--owner", OWNER, "--limit", "100"]);
  const projectList = Array.isArray(projects) ? projects : (projects.projects ?? []);
  const project = projectList.find((p) => p.number === PROJECT_NUMBER);
  if (!project) throw new Error(`project #${PROJECT_NUMBER} not found under ${OWNER}`);

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

  return { status, horizon: horizon ?? null, added };
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
}

if (import.meta.url === `file://${process.argv[1]}`) main();
