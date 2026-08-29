#!/usr/bin/env node
// MONEYPENNY — REPAIR. The lane that notices a failed run on `main`, or a PR conflicted against
// it, and gets it worked — instead of it sitting red (or silently conflicted) until someone
// happens to look. Formerly "CI Medic" (renamed #912 — see docs/MONEYPENNY.md).
//
//   node scripts/moneypenny-repair.mjs                            # read $GITHUB_EVENT_PATH, act
//   node scripts/moneypenny-repair.mjs --dry-run --event f.json   # print the intents, touch nothing
//
// WHY IT EXISTS (Eric, 2026-08-22, after run 32545818804 blocked a feedback build): "we should
// have a job kicked off that automatically resolves these types of failures." The failure that
// prompted it was silent in the worst way — the feedback lane took the issue's claim lease, then
// died in a bash step, so the issue looked claimed and nothing built it. Nothing was watching.
//
// SHAPE — decide, then do, the same doctrine as moneypenny.mjs (the event router): `routeFailure()`
// is pure (an event plus its dependencies in, a list of intents out) and `execute()` is the only
// part that touches GitHub. Every branch is therefore testable from a fixture payload.
//
// WHY IT IS A SEPARATE ROUTER FROM THE EVENT LANE: the event router is issue/push-driven and its
// own header says so. This one is driven by `workflow_run` (CI failures) and `workflow_dispatch`
// (PR conflicts, #909) — giving the event router either trigger would arm it to fire on its own
// output. Separate files, separate blast radius — the two are siblings under one identity
// (Moneypenny), not one merged file; see #912's own reasoning for keeping them apart.
//
// THE LOOP GUARDS, ALL FOUR (a self-healing lane that can trigger itself is a bill, not a net):
//   1. It ignores its own workflow's failures.
//   2. It only acts on runs against the default branch — a red PR belongs to that PR's author and
//      its watching session, and repair PRs opened here would otherwise feed themselves.
//   3. One open issue per failure signature: a recurrence comments, it never files again.
//   4. Once a signature carries `needs-eric`, this lane goes quiet on it entirely.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { LABELS } from "./moneypenny.mjs";
import { jobLog } from "./moneypenny-repair-logs.mjs";

/** This workflow's own `name:`. Guard 1 — never treat this lane's own failure as work for itself. */
export const REPAIR_WORKFLOW = "Moneypenny Repair";
/**
 * `ci-failure` used to be declared right here, a SECOND label registry beside the router's —
 * the exact split #500 is about. One vocabulary now (scripts/moneypenny.mjs `LABELS`); this stays
 * exported under its old name so existing call sites and specs keep working.
 */
export const LABEL = LABELS.ciFailure;
/** Enough log to diagnose from, little enough to stay inside one fold. */
const LOG_TAIL_CHARS = 3500;

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

/** `[ci] Postmaster — build feedback issue` — the dedupe key, stable across recurrences. */
export function signature(run, jobName) {
  return `[ci] ${run.name} — ${jobName}`;
}

/**
 * The capsule (docs/ISSUES.md): the ask, a metadata table and the talking points above the fold;
 * the evidence — the failing step and the log tail — inside one `<details>`. A machine-filed issue
 * is still an issue a human reads first, so it obeys the same contract Claude-authored ones do.
 */
export function issueBody(run, failure) {
  const tail = (failure.logTail ?? "").slice(-LOG_TAIL_CHARS).trim();
  return [
    `**\`${failure.job}\` failed on \`main\` and the work it carries is not getting done.**`,
    "",
    "| | |",
    "|---|---|",
    `| **Workflow** | ${run.name} |`,
    `| **Job** | \`${failure.job}\` |`,
    `| **Failing step** | ${failure.step ?? "unknown"} |`,
    `| **Run** | [${run.id}](${run.html_url}) |`,
    "",
    `- Triggered by \`${run.event}\` on \`${run.head_branch}\`; the run's own conclusion is failure.`,
    "- A repair session is dispatched from this issue — it opens a PR or explains why it cannot.",
    "- Workflow-file fixes never auto-merge: those stop with `needs-eric` for Eric's call.",
    "",
    "<details>",
    "<summary><strong>The evidence</strong> — failing step and log tail</summary>",
    "",
    "```text",
    tail || "(no log captured)",
    "```",
    "",
    "</details>",
  ].join("\n");
}

/**
 * Decide what to do about a completed run. Pure.
 *
 * @param ctx {{ run: object, defaultBranch: string, failures: {job: string, step?: string, logTail?: string}[] }}
 * @param deps {{ openIssues?: {number: number, title: string, labels?: string[]}[] }}
 * @returns intents — `[]` means deliberately nothing.
 */
export function routeFailure(ctx, deps = {}) {
  const run = ctx.run ?? {};
  if (run.conclusion !== "failure") return [];
  if (run.name === REPAIR_WORKFLOW) return [];
  if (run.event === "pull_request") return [];
  if (run.head_branch !== (ctx.defaultBranch || "main")) return [];

  const open = deps.openIssues ?? [];
  const intents = [];
  for (const failure of ctx.failures ?? []) {
    const title = signature(run, failure.job);
    const existing = open.find((i) => i.title === title);
    if (!existing) {
      intents.push({
        type: "open-issue",
        title,
        body: issueBody(run, failure),
        labels: [LABEL.name],
        dispatch: true,
      });
      continue;
    }
    if ((existing.labels ?? []).includes(LABELS.needsEric.name)) {
      intents.push({ type: "skip", issue: existing.number, reason: "already escalated to Eric" });
      continue;
    }
    intents.push({
      type: "comment",
      issue: existing.number,
      body: `Failed again — run [${run.id}](${run.html_url}), step \`${failure.step ?? "unknown"}\`. Same signature, so this is a recurrence, not a new fault.`,
    });
  }
  return intents;
}

// ── the impure half ───────────────────────────────────────────────────────────

/** Loud on failure, same doctrine as the router's gatherDeps: unreadable ≠ empty. */
function json(label, args) {
  let out;
  try {
    out = sh("gh", args);
  } catch (err) {
    throw new Error(`${label} failed: ${String(err.stderr || err.message).trim()}`);
  }
  try {
    return JSON.parse(out || "[]");
  } catch {
    throw new Error(`${label} returned unparseable JSON:\n${out.slice(0, 400)}`);
  }
}

/**
 * A run that failed with NO failing job — GitHub rejected the workflow file itself (a duplicate
 * key, bad syntax), so nothing ever started. Learned the hard way on 2026-08-22, when exactly this
 * shape would have slipped past this lane silently: the run is named after the file path, carries
 * zero jobs, and is the most urgent failure there is, because the whole lane is dead.
 */
export function parseFailure(run) {
  return {
    job: "(the workflow never started)",
    step: "GitHub rejected the workflow file — zero jobs were created",
    logTail: [
      `Run ${run.id} completed with conclusion "failure" and no jobs.`,
      `The run is named "${run.name}", which is the file path rather than the workflow's name —`,
      "GitHub falls back to the path when it cannot parse the file.",
      "",
      "Check the file with: node scripts/workflow-lint.mjs",
    ].join("\n"),
  };
}

/** The failing jobs of a run, each with its failing step and the tail of its log. */
function gatherFailures(runId) {
  const jobs = json("gh api jobs", [
    "api",
    `repos/{owner}/{repo}/actions/runs/${runId}/jobs`,
    "--jq",
    ".jobs",
  ]);
  const failed = jobs.filter((j) => j.conclusion === "failure");
  return failed.map((j) => ({
    job: j.name,
    step: (j.steps ?? []).find((s) => s.conclusion === "failure")?.name,
    logTail: jobLog(j.id),
  }));
}

/** Zero failing jobs on a failed run is the workflow-rejected shape, not "nothing to report". */
function withParseFallback(run, failures) {
  return failures.length || run.conclusion !== "failure" ? failures : [parseFailure(run)];
}

function ensureLabel() {
  try {
    sh("gh", [
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/labels",
      "-f",
      `name=${LABEL.name}`,
      "-f",
      `color=${LABEL.color}`,
      "-f",
      `description=${LABEL.description}`,
    ]);
  } catch {
    /* 422 — the label already exists, which is the point */
  }
}

function execute(intents) {
  const dispatch = [];
  for (const intent of intents) {
    if (intent.type === "skip") {
      console.log(`::notice::moneypenny-repair quiet on #${intent.issue} — ${intent.reason}`);
      continue;
    }
    if (intent.type === "comment") {
      sh("gh", ["issue", "comment", String(intent.issue), "--body", intent.body]);
      console.log(`::notice::commented recurrence on #${intent.issue}`);
      continue;
    }
    if (intent.type === "open-issue") {
      ensureLabel();
      const url = sh("gh", [
        "issue",
        "create",
        "--title",
        intent.title,
        "--body",
        intent.body,
        "--label",
        intent.labels.join(","),
      ]);
      const number = url.split("/").pop();
      console.log(`::notice::filed ${intent.title} as #${number}`);
      if (intent.dispatch) dispatch.push(number);
    }
  }
  const out = process.env.GITHUB_OUTPUT;
  if (out && dispatch[0]) appendFileSync(out, `issue=${dispatch[0]}\n`);
}

function main(argv) {
  const dry = argv.includes("--dry-run");
  const evIdx = argv.indexOf("--event");
  const eventFile = evIdx >= 0 ? argv[evIdx + 1] : process.env.GITHUB_EVENT_PATH;
  const raw = eventFile && existsSync(eventFile) ? JSON.parse(readFileSync(eventFile, "utf8")) : {};
  const fixture = raw.deps;
  const run = raw.workflow_run ?? raw.run ?? {};

  const ctx = {
    run,
    defaultBranch: raw.repository?.default_branch ?? process.env.DEFAULT_BRANCH ?? "main",
    // A fixture supplies its own failures; a live run reads them from the API. A failed run with
    // no failing job means the workflow file itself was rejected — still a failure, still ours.
    failures: raw.failures ?? withParseFallback(run, dry ? [] : gatherFailures(run.id)),
  };
  const deps = fixture ?? (dry ? {} : { openIssues: openIssues() });
  const intents = routeFailure(ctx, deps);

  if (dry) {
    console.log(JSON.stringify(intents, null, 2));
    return;
  }
  execute(intents);
}

/** Open this lane's own issues, by signature. Only this label — it never reads the wider backlog. */
function openIssues() {
  return json("gh issue list", [
    "issue",
    "list",
    "--state",
    "open",
    "--label",
    LABEL.name,
    "--limit",
    "50",
    "--json",
    "number,title,labels",
  ]).map((i) => ({ ...i, labels: (i.labels ?? []).map((l) => l.name) }));
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
