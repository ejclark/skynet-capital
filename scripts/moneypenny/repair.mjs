#!/usr/bin/env node
// MONEYPENNY — REPAIR. The lane that notices a failed run on `main`, or a PR conflicted against
// it, and gets it worked — instead of it sitting red (or silently conflicted) until someone
// happens to look. Formerly "CI Medic" (renamed #912 — see docs/MONEYPENNY.md).
//
//   node scripts/moneypenny/repair.mjs                            # read $GITHUB_EVENT_PATH, act
//   node scripts/moneypenny/repair.mjs --dry-run --event f.json   # print the intents, touch nothing
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
//   3. One open issue per failure signature: a recurrence comments, it never files again — and a
//      matrix job's legs fold onto one signature (`normalizeJobName`), so one fault is one issue.
//   4. Once a signature carries `needs-eric`, this lane goes quiet on it entirely.
//
// THE STALENESS GUARD, separate from the four above and deliberately not one of them (#4374): the
// loop guards stop this lane feeding itself, this one stops it reporting a fault that is already
// fixed. Guard 3's dedupe only reads OPEN issues, so the window slams shut the instant the fixing
// PR merges and closes the capsule — while runs started on pre-fix commits keep finishing for
// minutes afterwards. Measured: run 36800376847 started 01:17:21Z on `ec0605b8`, #4361 merged and
// closed #4359 (same signature) at 01:20:06Z, and 49s later this lane filed #4374 as a brand-new
// fault and spent a full Opus repair session on a bug that no longer existed. The test is purely
// temporal — a run that STARTED before the fix merged cannot have carried it — which is why it can
// never silence the net: a fault that genuinely survives the fix fails a run that starts *after*
// the close, and files normally. See `fixedWhileInFlight`.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { raiseAlarmIfBurst } from "./burst-alarm.mjs";
import { LABELS } from "./index.mjs";
import { jobLog } from "./repair-logs.mjs";

/** This workflow's own `name:`. Guard 1 — never treat this lane's own failure as work for itself. */
export const REPAIR_WORKFLOW = "Moneypenny Repair (CI self-healing)";
/**
 * `ci-failure` used to be declared right here, a SECOND label registry beside the router's —
 * the exact split #500 is about. One vocabulary now (scripts/moneypenny/index.mjs `LABELS`); this stays
 * exported under its old name so existing call sites and specs keep working.
 */
export const LABEL = LABELS.ciFailure;
/** Enough log to diagnose from, little enough to stay inside one fold. */
const LOG_TAIL_CHARS = 3500;

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

/**
 * A matrix leg's values, as GitHub appends them to the job name: `research due events` is reported
 * as `research due events (fomc-2026-09-16, event-passed-unscored)`. Only a TRAILING group is
 * stripped, so a workflow whose job name legitimately ends in a parenthetical keeps it when it is
 * not a matrix leg — and a job name that is ENTIRELY parenthesised (`(the workflow never started)`,
 * `parseFailure`) is left alone rather than normalised to nothing.
 */
const MATRIX_SUFFIX = /\s*\([^()]*\)\s*$/;
/**
 * The same suffix with its closing paren cut off: GitHub truncates a job name at 100 characters and
 * appends a literal `...`, so a long leg arrives unterminated — measured on #3229, whose job name
 * ends `…staleness-ceiling, 2026-09-16, bar-cl...` and whose title ran to 153 chars. Matching only
 * the closed form would have left exactly that class still filing one issue per leg.
 */
const MATRIX_SUFFIX_TRUNCATED = /\s*\([^()]*$/;
/** `scripts/issue-lint.mjs` MAX_TITLE — the lane obeys the contract it lints humans against. */
const MAX_TITLE = 120;

/**
 * One failing job is one fault, whatever the matrix says. Keying on the leg's values made every
 * event its own "stable" signature: 19 open `ci-failure` issues for ONE failing job, 35% of the
 * backlog, plus 16 titles over the 120-char lint ceiling (#3913, gap 1 — measured 2026-09-28).
 * #3280 fixed the same bug on the repair *dispatch* side; this is the issue-filing key.
 * The leg's own name stays in the body, where it belongs — it is evidence, never the key.
 */
export function normalizeJobName(jobName) {
  const name = String(jobName ?? "");
  for (const suffix of [MATRIX_SUFFIX, MATRIX_SUFFIX_TRUNCATED]) {
    const stripped = name.replace(suffix, "").trim();
    // Empty means the whole name was parenthesised — `(the workflow never started)`, which is
    // `parseFailure`'s own label, not a leg. Keep it.
    if (stripped && stripped !== name) return stripped;
  }
  return name;
}

/**
 * `[ci] Postmaster — build feedback issue` — the dedupe key, stable across recurrences. Clamped to
 * the lint ceiling: the `[ci] <workflow> — ` prefix alone can run 50+ chars and GitHub allows a
 * 100-char job name, so an unclamped signature can file a title its own `issue-lint` spec rejects.
 * Truncation is deterministic, so a clamped signature is still a stable key.
 */
export function signature(run, jobName) {
  const title = `[ci] ${run.name} — ${normalizeJobName(jobName)}`;
  return title.length <= MAX_TITLE ? title : `${title.slice(0, MAX_TITLE - 1)}…`;
}

/**
 * Collapse a run's failing jobs onto one entry per signature. With `fail-fast: false`, one broken
 * matrix job fails once per leg, so a single fault arrives as N failures in the SAME run — and N
 * open-issue intents, since the open-issues list cannot yet know about a sibling filed seconds ago.
 * The representative carries the others as `siblings`, which the body and the recurrence comment
 * report: the count is the blast radius, and losing it would be the dishonest way to dedupe.
 */
export function foldFailures(run, failures = []) {
  const byTitle = new Map();
  for (const failure of failures) {
    const title = signature(run, failure.job);
    const first = byTitle.get(title);
    if (first) first.siblings.push({ job: failure.job, step: failure.step });
    else byTitle.set(title, { ...failure, siblings: [] });
  }
  return [...byTitle.values()];
}

/**
 * Names the other matrix legs that failed the same way, bounded — a fold is not a log dump. Only
 * the representative leg's log is quoted above, so a leg that died at a DIFFERENT step says so on
 * its line: the repair session this issue dispatches gets one body, and a second root cause hidden
 * behind "same signature" is the one thing folding could honestly lose.
 */
const LEGS_SHOWN = 10;
function legLines(siblings = [], primaryStep) {
  if (!siblings.length) return [];
  const shown = siblings.slice(0, LEGS_SHOWN);
  const rest = siblings.length - shown.length;
  const elsewhere = siblings.some(({ step }) => step && step !== primaryStep);
  return [
    "",
    `The other ${siblings.length} matrix ${siblings.length === 1 ? "leg" : "legs"} that failed in this run:`,
    "",
    ...shown.map(({ job, step }) =>
      step && step !== primaryStep ? `- \`${job}\` — died at \`${step}\`` : `- \`${job}\``,
    ),
    ...(rest ? [`- …and ${rest} more.`] : []),
    ...(elsewhere
      ? ["", "A leg that died at a different step may be a second fault — check it before closing."]
      : []),
  ];
}

/**
 * The capsule (docs/ISSUES.md): the ask, a metadata table and the talking points above the fold;
 * the evidence — the failing step and the log tail — inside one `<details>`. A machine-filed issue
 * is still an issue a human reads first, so it obeys the same contract Claude-authored ones do.
 *
 * It leads with the JOB, not the leg, so the headline says the same thing the title does; the leg
 * that produced this log is a row below it, because that is what it is — evidence for one fault.
 */
export function issueBody(run, failure) {
  const tail = (failure.logTail ?? "").slice(-LOG_TAIL_CHARS).trim();
  const siblings = failure.siblings ?? [];
  const job = normalizeJobName(failure.job);
  return [
    `**\`${job}\` failed on \`main\` and the work it carries is not getting done.**`,
    "",
    "| | |",
    "|---|---|",
    `| **Workflow** | ${run.name} |`,
    `| **Job** | \`${job}\` |`,
    ...(failure.job === job ? [] : [`| **Matrix leg** | \`${failure.job}\` |`]),
    `| **Failing step** | ${failure.step ?? "unknown"} |`,
    `| **Run** | [${run.id}](${run.html_url}) |`,
    ...(siblings.length
      ? [`| **Legs failed** | ${siblings.length + 1} of this job, in this one run |`]
      : []),
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
    ...legLines(siblings, failure.step),
    "",
    "</details>",
  ].join("\n");
}

/**
 * THE STALENESS GUARD (see the header). Was this signature's capsule closed AFTER this run started?
 * If so the fix merged while the run was still in flight, so the run tested a commit that predates
 * it — a stale report, not a new fault.
 *
 * Fail-safe direction is deliberate: a missing or unparseable `run_started_at`/`closedAt` returns
 * `null`, which falls through to filing. This guard may only ever suppress a report it can PROVE is
 * stale; where it cannot prove that, the net stays loud.
 *
 * @param run {{ run_started_at?: string }}
 * @param closedIssues {{ number: number, title: string, closedAt?: string }[]}
 * @param title the failure signature
 * @returns the closed capsule this run is a stale echo of, or `null`
 */
export function fixedWhileInFlight(run, closedIssues, title) {
  const started = Date.parse(run?.run_started_at ?? "");
  if (!Number.isFinite(started)) return null;
  for (const issue of closedIssues ?? []) {
    if (issue.title !== title) continue;
    const closed = Date.parse(issue.closedAt ?? "");
    if (Number.isFinite(closed) && closed > started) return issue;
  }
  return null;
}

/** What a stale echo leaves behind — visible on the closed capsule, never a fresh one. */
function staleEchoBody(run, failure, issue) {
  return [
    `Stale echo, not a recurrence — no new fault here.`,
    "",
    `Run [${run.id}](${run.html_url}) failed at job \`${failure.job}\`, step \`${failure.step ?? "unknown"}\`, but it started at \`${run.run_started_at}\` on \`${(run.head_sha ?? "").slice(0, 8)}\` — before this issue was closed at \`${issue.closedAt}\`. The fix merged while the run was already in flight, so it was testing a commit that predates it.`,
    "",
    `No capsule filed and no repair session dispatched. If this signature survives the fix, the next failing run will start *after* this close and file normally.`,
  ].join("\n");
}

/**
 * Decide what to do about a completed run. Pure.
 *
 * @param ctx {{ run: object, defaultBranch: string, failures: {job: string, step?: string, logTail?: string}[] }}
 * @param deps {{ openIssues?: {number: number, title: string, labels?: string[]}[], closedIssues?: {number: number, title: string, closedAt?: string}[] }}
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
  for (const failure of foldFailures(run, ctx.failures ?? [])) {
    const title = signature(run, failure.job);
    const existing = open.find((i) => i.title === title);
    if (!existing) {
      // The staleness guard runs only where guard 3 found nothing open — an OPEN capsule for this
      // signature always wins, so a live fault is still commented on as a recurrence.
      const echoed = fixedWhileInFlight(run, deps.closedIssues, title);
      if (echoed) {
        intents.push({
          type: "comment",
          issue: echoed.number,
          body: staleEchoBody(run, failure, echoed),
        });
        continue;
      }
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
      body: [
        `Failed again — run [${run.id}](${run.html_url}), job \`${failure.job}\`, step \`${failure.step ?? "unknown"}\`. Same signature, so this is a recurrence, not a new fault.`,
        ...(failure.siblings?.length
          ? [
              "",
              `${failure.siblings.length + 1} matrix legs of this job failed in that one run; one fault, so one comment.`,
              ...failure.siblings
                .filter(({ step }) => step && step !== failure.step)
                .map(
                  ({ job, step }) => `- \`${job}\` died at \`${step}\` — possibly a second fault.`,
                ),
            ]
          : []),
      ].join("\n"),
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

/**
 * A job GitHub cancelled before any runner picked it up: no runner name, not one step. The run
 * still concludes `failure`, and the check run's only annotation reads "The job was not acquired
 * by Runner of type hosted even after multiple attempts". A human cancelling a queued job concludes
 * the RUN `cancelled`, which `routeFailure` never sees — so on a failed run this shape is GitHub's.
 */
export function neverAcquired(job) {
  return job?.conclusion === "cancelled" && !job.runner_name && !(job.steps ?? []).length;
}

/**
 * A failed run whose jobs never got a runner (#4656). Measured 2026-10-05 20:32Z: three Moneypenny
 * Events runs each queued `route` for exactly 15 minutes, were cancelled unstarted, and — with no
 * `failure` job to find — fell through to `parseFailure`, which filed "GitHub rejected the workflow
 * file" for a file that parsed fine and sent a repair session hunting a syntax error that did not
 * exist. Its own run-level signature, like `parseFailure`'s, so one outage is one issue per
 * workflow rather than one per starved job. Each job's `runs-on` labels are listed because a
 * mistyped label starves a job the same way — that one IS ours, and this is where it would show.
 */
export function runnerStarved(run, jobs) {
  const names = jobs.map((j) => `\`${j.name}\` (${(j.labels ?? []).join(", ") || "no labels"})`);
  return {
    job: "(no runner was ever assigned)",
    step: "GitHub never assigned a runner — the jobs were cancelled before their first step",
    logTail: [
      `Run ${run.id} completed with conclusion "failure", but no job failed.`,
      `Cancelled unstarted (no runner name, zero steps): ${names.join(", ")}.`,
      "",
      "For a GitHub-hosted label (ubuntu-latest) that is GitHub's runner capacity, not this repo —",
      'the job annotation reads "The job was not acquired by Runner of type hosted even after multiple attempts".',
      `Recover the dropped event with a re-run once runners are back: gh run rerun ${run.id} --failed`,
      "A label above that is not a GitHub-hosted runner would starve the same way, and that one is ours.",
    ].join("\n"),
  };
}

/**
 * Turn a run's jobs into the failures to report. Pure — `logOf` is the only impure part and is
 * injected. Jobs that failed are the normal case; a failed run with none of those is either starved
 * of runners (`runnerStarved`) or rejected outright (`parseFailure`) — never "nothing to report".
 */
export function failuresFrom(run, jobs = [], logOf = () => "") {
  const failed = jobs
    .filter((j) => j.conclusion === "failure")
    .map((j) => ({
      job: j.name,
      step: (j.steps ?? []).find((s) => s.conclusion === "failure")?.name,
      logTail: logOf(j.id),
    }));
  if (failed.length || run.conclusion !== "failure") return failed;
  const starved = jobs.filter(neverAcquired);
  return starved.length ? [runnerStarved(run, starved)] : [parseFailure(run)];
}

/** The jobs of a run, as the API reports them. */
function fetchJobs(runId) {
  return json("gh api jobs", [
    "api",
    `repos/{owner}/{repo}/actions/runs/${runId}/jobs`,
    "--jq",
    ".jobs",
  ]);
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

/** Acts on the intents; returns the capsules it filed, so the burst alarm can count them. */
function execute(intents) {
  const dispatch = [];
  const filed = [];
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
      filed.push({
        number: Number(number),
        title: intent.title,
        createdAt: new Date().toISOString(),
      });
      if (intent.dispatch) dispatch.push(number);
    }
  }
  const out = process.env.GITHUB_OUTPUT;
  if (out && dispatch[0]) appendFileSync(out, `issue=${dispatch[0]}\n`);
  return filed;
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
    // A fixture supplies its own failures (or the raw jobs to classify); a live run reads the jobs
    // from the API. A failed run with no failing job is still a failure — `failuresFrom` says which.
    failures:
      raw.failures ??
      failuresFrom(run, raw.jobs ?? (dry ? [] : fetchJobs(run.id)), dry ? undefined : jobLog),
  };
  const deps = fixture ?? (dry ? {} : { openIssues: openIssues(), closedIssues: closedIssues() });
  const intents = routeFailure(ctx, deps);

  if (dry) {
    console.log(JSON.stringify(intents, null, 2));
    return;
  }
  const filed = execute(intents);
  // #4292: a new capsule is the only moment a burst can grow, so it is the moment to check the
  // repair job is alive. Fail-quiet by construction — it never throws into this triage step.
  if (filed.length)
    raiseAlarmIfBurst(run.name, [...(deps.openIssues ?? []), ...filed], {
      selfRunId: process.env.GITHUB_RUN_ID,
    });
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
    "number,title,labels,createdAt",
  ]).map((i) => ({ ...i, labels: (i.labels ?? []).map((l) => l.name) }));
}

/**
 * This lane's CLOSED capsules, for the staleness guard. Same label-only scope as `openIssues` — it
 * never reads the wider backlog.
 *
 * Over-fetching is harmless and under-fetching only costs loudness: the guard's own `closedAt >
 * run_started_at` test is exact, so every row that cannot satisfy it is discarded anyway, and a
 * capsule missed by the window simply gets reported as a fresh fault — the status quo. Only an
 * issue closed in the last few minutes can ever match, and `ci-failure` runs at tens of issues
 * total, so 50 is comfortably past the horizon that matters.
 */
function closedIssues() {
  return json("gh issue list", [
    "issue",
    "list",
    "--state",
    "closed",
    "--label",
    LABEL.name,
    "--limit",
    "50",
    "--json",
    "number,title,closedAt",
  ]);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
