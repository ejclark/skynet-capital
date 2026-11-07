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
//   2. `routeFailure` only acts on runs against the default branch, and repair PRs opened here would
//      otherwise feed themselves. A red PR a session opened goes to red-session-pr.mjs instead
//      (#6605), which leaves this lane's own PRs alone and spends one session per PR at most.
//   3. One open issue per failure signature: a recurrence comments, it never files again — and a
//      matrix job's legs fold onto one signature (`normalizeJobName`), so one fault is one issue.
//      A capsule closed within `REOPEN_DAYS` still owns its signature: the fault reopens it.
//   4. Once a signature carries `needs-eric`, this lane goes quiet on it entirely.
//   And one thing that is not a fault at all: a leg whose log shows a usage limit ended it
//   (`limitRejected`) neither files, comments nor dispatches — a repair session cannot fix a
//   refusal, and a recurrence comment per refused run is how #6098 took 16 in 15 hours. The log has
//   to SHOW it: a session that died with no reason printed stays a fault (#6579).
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
// the close, and files normally. It reads only closes a fix made: the audit tick also closes a
// capsule once its job has gone green, with no fix anywhere, and a run overlapping THAT close is
// not stale (#6579). See `fixedWhileInFlight`.
//
// ONE FAULT, ONE NUMBER, ACROSS CLOSES (#6953 slice 2). Guard 3 reads only OPEN capsules, so a fault
// that stops for a while — long enough for the audit tick to prove it green and close it — and
// then comes back was filed as a brand-new issue. Measured: the breaker's `route` failure was filed
// 9 times in 5 days (#6640 → #6942), its question to Eric worded 4 ways under 9 numbers, and each
// filing dispatched a repair session to re-derive the same answer. A signature whose capsule closed
// within `REOPEN_DAYS` now REOPENS that capsule with a recurrence count instead (`reopenable`). One
// whose ask was handed to a session on close (`needs-session`, capsule-stall.mjs) reopens without a
// fresh repair session: the fix is known and waits on a session that can land it.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { raiseAlarmIfBurst } from "./burst-alarm.mjs";
import { LABELS } from "./labels.mjs";
import { CAPSULE_SLOT, gatherRedSessionPr, routeRedSessionPr, sayOnPr } from "./red-session-pr.mjs";
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
    ...(diedWithoutReason(failure)
      ? [
          "- The session errored with no API status in this log. A limit or a dead token reads this way: check those first.",
        ]
      : []),
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
 * How `gh issue list` spells a close that claims the work was done. The audit tick's proof close is
 * `NOT_PLANNED`, deliberately: "no fix merged here" (`closeProvenCapsule`, capsule-stall.mjs).
 */
const CLOSED_AS_DONE = "COMPLETED";

/**
 * THE STALENESS GUARD (see the header). Was this signature's capsule closed as done AFTER this run
 * started? If so the fix merged while the run was still in flight, so the run tested a commit that
 * predates it — a stale report, not a new fault. A capsule closed any other way had no fix for the
 * run to predate: the audit tick rides every push, so its proof close overlaps that push's own runs,
 * and one of them failing is the fault coming back, which reopens that capsule (`reopenable`).
 *
 * Fail-safe direction is deliberate: a missing or unparseable `run_started_at`/`closedAt`, or a
 * close that does not say it was done, returns `null`, which falls through to filing. This guard may
 * only ever suppress a report it can PROVE is stale; where it cannot prove that, the net stays loud.
 *
 * @param run {{ run_started_at?: string }}
 * @param closedIssues {{ number: number, title: string, closedAt?: string, stateReason?: string }[]}
 * @param title the failure signature
 * @returns the closed capsule this run is a stale echo of, or `null`
 */
export function fixedWhileInFlight(run, closedIssues, title) {
  const started = Date.parse(run?.run_started_at ?? "");
  if (!Number.isFinite(started)) return null;
  for (const issue of closedIssues ?? []) {
    if (issue.title !== title || issue.stateReason !== CLOSED_AS_DONE) continue;
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

/** How far back a closed capsule still owns its signature: a fault back within this reopens it. */
export const REOPEN_DAYS = 14;
/** Left on every reopen, so capsule-stall.mjs reads only what was said since (its `sinceReopen`). */
export const REOPEN_MARKER = "<!-- moneypenny:capsule-reopened -->";
/** The body row that counts the closes a fault has come back from. */
const CAME_BACK = /^\| \*\*Came back after a close\*\* \| (\d+) times? \|$/m;
/** Labels that describe the capsule's last life, and would mislead on its next one. */
const STALE_ON_REOPEN = [LABELS.inProgress.name, LABELS.stall.name];

/** How many times this capsule has been reopened by a returning fault, read from its body. Pure. */
export function recurrenceCount(body) {
  return Number(CAME_BACK.exec(String(body ?? ""))?.[1] ?? 0);
}

/**
 * `body` with its recurrence row set to `n`: replaced where it exists, else added below the `Run`
 * row (or `Legs failed`, which follows it) so it reads with the rest of the metadata table. A body
 * with no table is returned unchanged — the reopen comment carries the count anyway. Pure.
 */
export function withRecurrence(body, n) {
  const text = String(body ?? "");
  const row = `| **Came back after a close** | ${n} ${n === 1 ? "time" : "times"} |`;
  if (CAME_BACK.test(text)) return text.replace(CAME_BACK, row);
  const lines = text.split("\n");
  const run = lines.findIndex((l) => l.startsWith("| **Run** |"));
  if (run === -1) return text;
  const at = lines[run + 1]?.startsWith("| **Legs failed** |") ? run + 2 : run + 1;
  lines.splice(at, 0, row);
  return lines.join("\n");
}

/**
 * The capsule a returning fault reopens: the newest one with this signature closed within
 * `REOPEN_DAYS` of the run's start — or after it, which is the audit tick's proof close overlapping
 * the run (#6579). Runs after the staleness guard, so a fix's close the run predates never gets
 * here. A run with no readable start, or a capsule with no readable close, files fresh: that is the
 * status quo, and loud either way. Pure.
 *
 * @returns the closed capsule to reopen, or `null`
 */
export function reopenable(run, closedIssues, title, days = REOPEN_DAYS) {
  const started = Date.parse(run?.run_started_at ?? "");
  if (!Number.isFinite(started)) return null;
  const from = started - days * 864e5;
  let best = null;
  for (const issue of closedIssues ?? []) {
    if (issue.title !== title) continue;
    const closed = Date.parse(issue.closedAt ?? "");
    if (!Number.isFinite(closed) || closed < from) continue;
    if (!best || closed > Date.parse(best.closedAt)) best = issue;
  }
  return best;
}

/** The reopen comment. Starts with the recurrence line capsule-stall.mjs keys its proof cut on. */
function reopenBody(run, failure, issue, count, waiting) {
  return [
    `Failed again — run [${run.id}](${run.html_url}), job \`${failure.job}\`, step \`${failure.step ?? "unknown"}\`. Same signature as this capsule, closed \`${issue.closedAt}\`, so it is reopened rather than filed under a new number. It has now come back after a close ${count} ${count === 1 ? "time" : "times"}.`,
    "",
    waiting
      ? `This capsule carries \`${waiting}\`: its next step was already handed off when it closed, so no new repair session is dispatched to work it out again.`
      : "A repair session is dispatched from this issue, as for a new fault.",
    "",
    REOPEN_MARKER,
  ].join("\n");
}

/** The HTTP status each API error in this log ended on, in order. Only the quoted JSON key counts. */
const apiStatuses = (log) =>
  [...log.matchAll(/"api_error_status":\s*(\d+)/g)].map((m) => Number(m[1]));

/**
 * Does this leg's log SHOW that a usage limit ended its session? Two shapes, each measured on a real
 * log (study 2026-11-01; #6098 took 16 recurrence comments in 15 hours from one session limit):
 *   - the result envelope's `api_error_status` 429, whether on the first call or on turn 25;
 *   - the output file's `rate_limit_event` with `status` rejected — the window closed (a research
 *     leg beside #6098 ran 25 turns at $0.93 and then died on it).
 * The session's last API status outranks an event: one that names something else (a 401, a 500) is
 * what ended it, whatever the window did earlier.
 *
 * A first-call death at zero cost is NOT a limit on its own (#6579): `is_error` true, one turn and
 * $0 is also what an expired or revoked token prints (`oauth-token-gate` only checks the secret is
 * set), and reading that as a limit left every lane red with no capsule, no comment and no repair.
 * Anything this cannot read is a fault: unknown stays loud.
 *
 * WHICH LANES CAN SHOW IT: both shapes live in `claude-execution-output.json`, which reaches the log
 * only if a workflow step prints it. `build-events` does. `build-feedback` and `build-plan` print the
 * action's short result, so a limit death there files or comments like any failure until their step
 * lands (#6579; repair.spec.ts pins that no new lane joins them). A bare assistant-message
 * `"error": "rate_limit"` is not a signal either — a transient 429 the CLI retried leaves the same
 * line. The lane's own script text names these fields in prose; only the quoted JSON keys count.
 */
export function limitRejected(logTail) {
  const log = String(logTail ?? "");
  const last = apiStatuses(log).at(-1);
  if (last !== undefined) return last === 429;
  return /"type":\s*"rate_limit_event"[\s\S]{0,200}?"status":\s*"rejected"/.test(log);
}

/**
 * Did this failure die in a step that runs a Claude session? GitHub names the unnamed `uses:` step
 * `Run anthropics/claude-code-action@<pin>`. Only there can a log's limit or result fields be about
 * a session: any other job's log can quote them, and a failing repair.spec.ts prints them in its
 * code frame. An unknown step is not one, so it stays a fault.
 */
function ranClaude(failure) {
  return /claude-code-action/.test(failure.step ?? "");
}

/**
 * The action's short result with nothing behind it: the session errored and no API status says why.
 * Not a limit and not proof of one, so it stays a fault; this only tells the capsule's reader what
 * this print cannot rule out, since a dead token is the one thing a repair session cannot fix.
 */
function diedWithoutReason(failure) {
  const log = failure.logTail ?? "";
  return ranClaude(failure) && /"is_error":\s*true/.test(log) && !apiStatuses(log).length;
}

/**
 * Split a run's failures into the legs a usage limit refused and the real ones. A refused leg is
 * not a fault: it neither files, comments nor dispatches, whatever is open for its signature — a
 * repair session cannot fix a usage limit, and a recurrence comment per refused run is how #6098
 * filled up. Split BEFORE folding, so a real leg beside a refused one in the same matrix still
 * files on its own evidence and the refused leg is not listed as a sibling; a signature with only
 * refused legs gets one `skip` intent naming the open capsule, if any. Pure.
 */
export function splitRefused(run, failures = [], open = []) {
  const refused = new Set();
  const real = [];
  for (const failure of failures) {
    if (ranClaude(failure) && limitRejected(failure.logTail)) {
      refused.add(signature(run, failure.job));
    } else real.push(failure);
  }
  const skips = [];
  for (const title of refused) {
    if (real.some((f) => signature(run, f.job) === title)) continue;
    skips.push({
      type: "skip",
      issue: open.find((i) => i.title === title)?.number,
      title,
      reason: "the log shows a usage limit ended the session — not a fault a repair can fix",
    });
  }
  return { skips, real };
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
  const { skips, real } = splitRefused(run, ctx.failures ?? [], open);
  const intents = [...skips];
  for (const failure of foldFailures(run, real)) {
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
      const back = reopenable(run, deps.closedIssues, title);
      if (back) {
        const labels = (back.labels ?? []).map((l) => (typeof l === "string" ? l : l?.name));
        // Guard 4 carried across the close: a capsule whose next step is a session's, or Eric's,
        // reopens quiet — a repair session would only re-derive the hand-off it already made.
        const waiting = [LABELS.needsSession.name, LABELS.needsEric.name].find((l) =>
          labels.includes(l),
        );
        const count = recurrenceCount(back.body) + 1;
        intents.push({
          type: "reopen-issue",
          issue: back.number,
          title,
          body: reopenBody(run, failure, back, count, waiting),
          issueBody: back.body == null ? undefined : withRecurrence(back.body, count),
          removeLabels: STALE_ON_REOPEN.filter((l) => labels.includes(l)),
          dispatch: !waiting,
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
 * A failed job whose runner stopped answering mid-step (#6033). Measured 2026-10-26: run
 * 40304642365's `uk-gilt-auction-long` leg ran 50 minutes, then GitHub concluded the job `failure`
 * with its claude-code-action step frozen at `in_progress` — no step ever failed, the log blob was
 * gone (404), and the only evidence was the annotation "The hosted runner lost communication with
 * the server". The capsule read "Failing step: unknown" over an empty fold, and a repair session
 * had to reconstruct all of that by hand. A step left unfinished on a completed job is the shape.
 */
function unfinishedStep(job) {
  return (job?.steps ?? []).find((s) => s.status && s.status !== "completed")?.name;
}

/** Appended to the Failing step row when the runner went away. `capsule-stall.mjs` strips it
 *  before matching the step against a later run's — no real step carries it (#6274). */
export const LOST_RUNNER = " (never finished — the runner went away mid-step)";

/** What the fold says when the runner went away — read beside the log, never instead of it. */
function lostRunnerNote(run, job, step) {
  return [
    "",
    `Step "${step}" never finished: the job concluded failure while it was still running, so no`,
    "step failed and the runner never reported back. GitHub's annotation for this shape reads",
    '"The hosted runner lost communication with the server". On ubuntu-latest that is GitHub\'s',
    "runner, unless the step itself starved it of CPU or memory, which is ours. Confirm with:",
    `  gh api repos/{owner}/{repo}/check-runs/${job.id}/annotations`,
    `Recover the dropped work with a re-run: gh run rerun ${run.id} --failed`,
  ].join("\n");
}

/**
 * Did GitHub reject this workflow file? Only when its tell is present: zero jobs AND a run named
 * after the file path, because a file GitHub could not parse has no `name:` to read (LESSONS.md,
 * 2026-08-22). A run carrying its workflow's real name parsed — "no failing job" there is
 * something else, and calling it a syntax error sends a repair session hunting one (#6356).
 */
export function wasRejected(run, jobs = []) {
  if (jobs.length) return false;
  const name = String(run?.name ?? "");
  return name === run?.path || /\.ya?ml$/i.test(name);
}

/** `jobsUnread`'s label — `readFailures` re-reads while this is all it has. */
const UNREAD_JOB = "(the failed job could not be read)";

/**
 * A run that parsed and concluded failure, but whose jobs, as read, show no failed one (#6356).
 * Measured 2026-10-30: Pipeline run 41103012157 failed at `release · deploy bots`, the triage read
 * its jobs 48s after it completed, found no failed job, and filed "GitHub rejected the workflow
 * file" for a run named `Pipeline` with five jobs. The same jobs endpoint answered 502 minutes
 * later, so GitHub's read was lagging. Its own signature, loud and honest about what is unknown.
 */
export function jobsUnread(run, jobs = []) {
  const seen = jobs.map((j) => `\`${j.name}\` (${j.conclusion ?? j.status ?? "no status"})`);
  return {
    job: UNREAD_JOB,
    step: "the jobs API showed no failed job for a run that parsed and concluded failure",
    logTail: [
      `Run ${run.id} ("${run.name}") completed with conclusion "failure", but no job read as failed.`,
      `Jobs as read: ${seen.length ? seen.join(", ") : "none"}.`,
      "",
      "The run carries its workflow's real name, so the file parsed. This is a stale or failed",
      "read of the jobs, not a syntax error. Read them again and file the real job:",
      `  gh run view ${run.id} --json jobs --jq '.jobs[] | "\\(.name) \\(.conclusion)"'`,
    ].join("\n"),
  };
}

/**
 * Turn a run's jobs into the failures to report. Pure — `logOf` is the only impure part and is
 * injected. Jobs that failed are the normal case; a failed run with none of those is starved of
 * runners (`runnerStarved`), rejected outright (`parseFailure`), or read too early (`jobsUnread`)
 * — never "nothing to report".
 */
export function failuresFrom(run, jobs = [], logOf = () => "") {
  const failed = jobs
    .filter((j) => j.conclusion === "failure")
    .map((j) => {
      const step = (j.steps ?? []).find((s) => s.conclusion === "failure")?.name;
      const lost = step ? undefined : unfinishedStep(j);
      if (!lost) return { job: j.name, step, logTail: logOf(j.id) };
      return {
        job: j.name,
        step: `${lost}${LOST_RUNNER}`,
        logTail: `${logOf(j.id)}${lostRunnerNote(run, j, lost)}`,
      };
    });
  if (failed.length || run.conclusion !== "failure") return failed;
  const starved = jobs.filter(neverAcquired);
  if (starved.length) return [runnerStarved(run, starved)];
  return [wasRejected(run, jobs) ? parseFailure(run) : jobsUnread(run, jobs)];
}

/** How long to wait before each re-read of a run's jobs — about a minute in all. */
export const REREAD_WAITS_MS = [10_000, 20_000, 30_000];

/**
 * The further waits, earned only by a read that PROVES itself stale: a job still `in_progress` or
 * `queued` on a run that already concluded (#6406). Measured 2026-10-30: Pipeline run 41121443220's
 * `release · deploy bots` completed 20:17:56, the run concluded 20:20:21, and every read from
 * 20:20:27 to 20:21:38 still said `in_progress` — so the minute above ran out and the lane filed
 * "(the failed job could not be read)" beside the open capsule (#5955) the real job already had,
 * and dispatched a repair session to re-diagnose it. Three more minutes is cheap next to that.
 */
export const STALE_WAITS_MS = [60_000, 60_000, 60_000];

/** A job the API still reports as running. On a concluded run, that is a stale read by definition. */
function stillRunning(job) {
  return Boolean(job?.status) && job.status !== "completed";
}

/**
 * `failuresFrom` over a live read, re-reading while the read is the unread shape or throws (a 502
 * on the jobs endpoint, #6356). Once any read shows a job still running, the budget extends by
 * `staleWaits` (#6406). A read that still fails after the last wait throws, so the triage job goes
 * red instead of filing a guess. `fetchJobs` and `sleep` are injected so a spec drives it.
 */
export function readFailures(
  run,
  { fetchJobs, logOf, sleep, waits = REREAD_WAITS_MS, staleWaits = STALE_WAITS_MS },
) {
  const schedule = [...waits, ...staleWaits];
  let attempt = 0;
  let stale = false;
  const budget = () => (stale ? schedule.length : waits.length);
  for (;;) {
    try {
      const jobs = fetchJobs(run.id);
      const failures = failuresFrom(run, jobs, logOf);
      if (failures[0]?.job !== UNREAD_JOB) return failures;
      stale ||= jobs.some(stillRunning);
      if (attempt >= budget()) return failures;
    } catch (err) {
      if (attempt >= budget()) throw err;
    }
    sleep(schedule[attempt++]);
  }
}

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

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
      const on = intent.issue ? `#${intent.issue}` : `\`${intent.title}\``;
      console.log(`::notice::moneypenny-repair quiet on ${on} — ${intent.reason}`);
      continue;
    }
    if (intent.type === "comment") {
      sh("gh", ["issue", "comment", String(intent.issue), "--body", intent.body]);
      console.log(`::notice::commented recurrence on #${intent.issue}`);
      continue;
    }
    if (intent.type === "reopen-issue") {
      // The reopen and its comment are the act: one number, and the recurrence line the proof cut
      // reads. The count row and the label cleanup are soft — the comment already carries the count.
      sh("gh", ["issue", "reopen", String(intent.issue), "--comment", intent.body]);
      console.log(`::notice::reopened #${intent.issue} — ${intent.title} came back`);
      const soft = (what, args) => {
        try {
          sh("gh", args);
        } catch (err) {
          console.log(`::warning::#${intent.issue} ${what} — ${String(err.message).slice(0, 200)}`);
        }
      };
      if (intent.issueBody) {
        soft("kept its old count row", [
          "issue",
          "edit",
          String(intent.issue),
          "--body",
          intent.issueBody,
        ]);
      }
      for (const label of intent.removeLabels ?? []) {
        const path = `repos/{owner}/{repo}/issues/${intent.issue}/labels/${encodeURIComponent(label)}`;
        soft(`kept \`${label}\``, ["api", "-X", "DELETE", path]);
      }
      if (intent.dispatch) {
        dispatch.push(String(intent.issue));
        filed.push({
          number: intent.issue,
          title: intent.title,
          createdAt: new Date().toISOString(),
        });
      }
      continue;
    }
    if (intent.type === "say-on-pr") {
      sayOnPr(intent.number, intent.body);
      console.log(`::notice::said why not on #${intent.number}`);
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
      // Soft: the line must not cost the session the capsule just asked for. An open capsule is its
      // own memory (`routeRedSessionPr`), so a lost line cannot buy this PR a second session.
      if (intent.sayOnPr) {
        const { number: pr, body } = intent.sayOnPr;
        try {
          sayOnPr(pr, body.replaceAll(CAPSULE_SLOT, `#${number}`));
        } catch (err) {
          console.log(
            `::warning::#${pr} did not get its line — ${String(err.message).slice(0, 200)}`,
          );
        }
      }
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
  const live = !(raw.failures || raw.jobs || dry);

  const ctx = {
    run,
    defaultBranch: raw.repository?.default_branch ?? process.env.DEFAULT_BRANCH ?? "main",
    // A fixture supplies its own failures (or the raw jobs to classify); a live run reads the jobs
    // from the API. A failed run with no failing job is still a failure — `failuresFrom` says which.
    failures:
      raw.failures ??
      (live
        ? readFailures(run, { fetchJobs, logOf: jobLog, sleep: sleepSync })
        : failuresFrom(run, raw.jobs ?? [], dry ? undefined : jobLog)),
  };
  const deps = fixture ?? (dry ? {} : { openIssues: openIssues(), closedIssues: closedIssues() });
  // A pull_request run never reaches `routeFailure`'s body, and a fixture brings its own PR.
  const intents =
    run.event === "pull_request"
      ? routeRedSessionPr(ctx, {
          ...deps,
          ...(fixture || dry ? {} : gatherRedSessionPr(run, ctx.failures)),
        })
      : routeFailure(ctx, deps);

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
 * This lane's CLOSED capsules, for the staleness guard and the reopen. Same label-only scope as
 * `openIssues` — it never reads the wider backlog. `stateReason` is what tells a fix's close from a
 * proof close; `labels` and `body` are what a reopen carries over (its hand-off, its count).
 *
 * Over-fetching is harmless and under-fetching only costs loudness: the guard's own `closedAt >
 * run_started_at` test is exact, so every row that cannot satisfy it is discarded anyway, and a
 * capsule missed by the window simply gets reported as a fresh fault — the status quo. The staleness
 * guard only matches a close from the last few minutes; the reopen looks back `REOPEN_DAYS`, and the
 * 2026-11-06 read found 12 `ci-failure` capsules closed in the 5 days before it, so 50 covers it.
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
    "number,title,closedAt,stateReason,labels,body",
  ]).map((i) => ({ ...i, labels: (i.labels ?? []).map((l) => l.name) }));
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
