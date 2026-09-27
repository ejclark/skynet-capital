#!/usr/bin/env node
// PROJECTS V2 SYNC — #3818 slice B, part 2. Keeps one issue's Status column current on the
// "Skynet Capital — Orchestration" project as its labels/state change: adds it to the board if
// it isn't there yet, then sets Status per `statusForIssue()`'s rule (scripts/moneypenny/projects.mjs).
//
// Needs GH_TOKEN = Eric's PROJECTS_PAT (same as projects-setup.mjs) — the App token still has no
// path to a personal-account project, so this can't ride the App identity like the rest of
// Moneypenny does. The repo is public, so the same PAT reads issue data fine too; no second token.
//
// KNOWN GAP, said plainly: "In Progress" (an open linked PR) is never set by this script — reading
// timeline cross-references reliably needs more than this slice's scope, so every issue here reads
// as Backlog/Ready/Blocked/Done only. `statusForIssue()`'s own default for `hasOpenLinkedPr` is
// `false`, so this is an honest partial implementation, not a bug — a natural next slice.
//
//   GH_TOKEN=<eric's PAT> node scripts/moneypenny/projects-sync.mjs <issue-number>
//
// Run via moneypenny-events.yml's `sync-project` job, on issue labeled/unlabeled/closed/reopened.
import { ghRest, sh, withRetry } from "./gh.mjs";
import { statusForIssue } from "./projects.mjs";

const OWNER = "ejclark";
const PROJECT_NUMBER = 2; // created by projects-setup.mjs's first live run (2026-09-27)

function ghJson(args) {
  return JSON.parse(withRetry(() => sh("gh", [...args, "--format", "json"])));
}

function main() {
  const issueNumber = process.argv[2];
  if (!issueNumber) {
    console.error("usage: projects-sync.mjs <issue-number>");
    process.exit(1);
  }

  const issue = ghRest(`issues/${issueNumber}`);
  const labels = (issue.labels ?? []).map((l) => l.name);
  const status = statusForIssue({ state: issue.state, labels });
  console.log(
    `issue #${issueNumber}: state=${issue.state} labels=[${labels.join(", ")}] -> Status=${status}`,
  );

  const item = ghJson([
    "project",
    "item-add",
    String(PROJECT_NUMBER),
    "--owner",
    OWNER,
    "--url",
    issue.html_url,
  ]);

  const fields = ghJson([
    "project",
    "field-list",
    String(PROJECT_NUMBER),
    "--owner",
    OWNER,
    "--limit",
    "100",
  ]);
  const fieldList = Array.isArray(fields) ? fields : (fields.fields ?? []);
  const statusField = fieldList.find((f) => f.name === "Status");
  if (!statusField) {
    console.error(`no "Status" field found on project #${PROJECT_NUMBER} — has setup run?`);
    process.exit(1);
  }
  const option = (statusField.options ?? []).find((o) => o.name === status);
  if (!option) {
    const have = (statusField.options ?? []).map((o) => o.name).join(", ");
    console.error(
      `Status field has no "${status}" option (has: ${have}) — run projects-setup.mjs to fix its options`,
    );
    process.exit(1);
  }

  const projects = ghJson(["project", "list", "--owner", OWNER, "--limit", "100"]);
  const projectList = Array.isArray(projects) ? projects : (projects.projects ?? []);
  const project = projectList.find((p) => p.number === PROJECT_NUMBER);
  if (!project) {
    console.error(`project #${PROJECT_NUMBER} not found under ${OWNER}`);
    process.exit(1);
  }

  sh("gh", [
    "project",
    "item-edit",
    "--id",
    item.id,
    "--field-id",
    statusField.id,
    "--project-id",
    project.id,
    "--single-select-option-id",
    option.id,
  ]);
  console.log(`set issue #${issueNumber}'s item to Status="${status}"`);
}

main();
