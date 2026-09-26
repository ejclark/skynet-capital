#!/usr/bin/env node
// PROJECTS V2 SETUP — one-time (idempotent, safe to re-run), #3818 slice B. Creates the
// "Skynet Capital — Orchestration" project under ejclark and its four fields (Status, Priority,
// Horizon, Target date) via `gh project`, which the Moneypenny App's installation token can drive
// now that its Projects permission is admin (Eric, 2026-09-26).
//
// UNVERIFIED LIVE (say so plainly, not "tested"): GraphQL — which `gh project` compiles to — is
// blocked from interactive Claude Code sessions (confirmed by calling it directly), so this
// script's real IO could not be exercised while writing it. It prints the raw `gh` output at every
// step for that reason: if a step's shape is wrong, the run's own log is the diagnostic, and
// re-running is safe because every step checks for the existing thing first.
//
//   GH_TOKEN=<app-installation-token> node scripts/moneypenny/projects-setup.mjs
//
// Run via projects-setup.yml (workflow_dispatch), which mints that token from the App identity —
// never with a personal token; the App is what carries the Projects permission.
import { sh, withRetry } from "./gh.mjs";
import { FIELDS, PROJECT_TITLE } from "./projects.mjs";

const OWNER = "ejclark";

function ghJson(args) {
  return JSON.parse(withRetry(() => sh("gh", [...args, "--format", "json"])));
}

function findProject(title) {
  const projects = ghJson(["project", "list", "--owner", OWNER, "--limit", "100"]);
  const list = Array.isArray(projects) ? projects : (projects.projects ?? []);
  return list.find((p) => p.title === title);
}

function createProject(title) {
  const created = ghJson(["project", "create", "--owner", OWNER, "--title", title]);
  console.log(`created project #${created.number}: ${created.url}`);
  return created;
}

function findField(projectNumber, name) {
  const fields = ghJson([
    "project",
    "field-list",
    String(projectNumber),
    "--owner",
    OWNER,
    "--limit",
    "100",
  ]);
  const list = Array.isArray(fields) ? fields : (fields.fields ?? []);
  return list.find((f) => f.name === name);
}

function createField(projectNumber, field) {
  const args = [
    "project",
    "field-create",
    String(projectNumber),
    "--owner",
    OWNER,
    "--name",
    field.name,
    "--data-type",
    field.dataType,
  ];
  if (field.options) args.push("--single-select-options", field.options.join(","));
  const created = ghJson(args);
  console.log(`created field "${field.name}" (${field.dataType}): ${JSON.stringify(created)}`);
  return created;
}

function main() {
  console.log(`looking for project "${PROJECT_TITLE}" under ${OWNER}...`);
  let project = findProject(PROJECT_TITLE);
  if (project) {
    console.log(`found existing project #${project.number}: ${project.url}`);
  } else {
    project = createProject(PROJECT_TITLE);
  }

  for (const field of FIELDS) {
    const existing = findField(project.number, field.name);
    if (existing) {
      console.log(`field "${field.name}" already exists, skipping`);
      continue;
    }
    createField(project.number, field);
  }

  console.log(
    `done. Board/Backlog/Roadmap views (grouping, sort, layout) are one-time UI setup on ` +
      `${project.url} — the API doesn't fully cover view layout, so this is the one manual step ` +
      `left after this script.`,
  );
}

main();
