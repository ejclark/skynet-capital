// MONEYPENNY — THE BURST ALARM (#4292, #3818 slice 6, criterion 7). The repair lane's own smoke
// detector: when CI failures pile up on one workflow AND the job meant to repair them is dead,
// open ONE issue that says so, assigned to Eric — instead of letting capsules stack up unread.
//
// WHY A BURST, NOT AGE (#3818 call 7, backtested): #3719–#3724 were filed in 9s, 78 min after the
// break in #2292, and the lane that should have repaired them was dead for 37h before anyone looked.
// A burst rule fires ~1.3h after the break; an age rule would have taken ~20h. The burst alone is
// not the alarm, though — three capsules with a healthy repair job are just a bad hour. The alarm is
// the PAIR: a burst, and no repair session that actually ran since it began.
//
// WHERE IT RUNS: inside `repair.mjs`'s triage step, right after it files capsules. That step already
// fires on every failed run of every watched workflow, so the alarm needs no workflow edit — and it
// evaluates exactly when a new capsule lands, which is the only moment the burst can grow.
//
// SHAPE — the same decide/do split as repair.mjs: `decideAlarm()` is pure (capsules, repair-job
// evidence and open alarms in, one intent or a reason out) and `raiseAlarmIfBurst()` is the only
// part that touches GitHub. Every branch is specced from data in burst-alarm.spec.ts.
//
// FAIL-QUIET ON PURPOSE, unlike the lane it guards: this is a second net over the first. Any read
// that fails logs a warning and raises nothing — a broken alarm must never break the triage step
// that files the capsules themselves.
import { execFileSync } from "node:child_process";
import { LABELS } from "./labels.mjs";

/** How many capsules from one workflow make a burst (criterion 7). */
export const BURST_SIZE = 3;
/** The window they must land in. */
export const WINDOW_MS = 60 * 60 * 1000;
/**
 * With no repair evidence at all, how long the oldest capsule must wait before silence counts as
 * dead. Without it, one run that fails three jobs at once would alarm before its own repair job had
 * even been scheduled. A repair job that FAILED needs no grace — that is direct evidence.
 */
export const GRACE_MS = 15 * 60 * 1000;
export const ALARM_LABEL = LABELS.ciAlarm;
export const ASSIGNEE = "ejclark";
/** The repair workflow's file and its dispatching job's `name:` (moneypenny-repair.yml). */
export const REPAIR_WORKFLOW_FILE = "moneypenny-repair.yml";
export const REPAIR_JOB = "repair the failure or a flagged conflict";

/** `[ci] Pipeline — release · deploy` → `Pipeline`. `null` for anything that is not a capsule. */
export function workflowOf(title) {
  const m = /^\[ci\] (.+?) — /.exec(String(title ?? ""));
  return m ? m[1] : null;
}

/** One alarm per workflow: the title IS the idempotency key, like a capsule's signature. */
export function alarmTitle(workflow) {
  return `[ci-alarm] ${workflow} — failures piling up, repair job not running`;
}

/**
 * A repair job's verdict, from the Actions API's job shape. The JOB's own conclusion is not enough:
 * with the OAuth gate unarmed the session step is skipped and the job still reads `success`. So a
 * repair counts as having run only when a `claude-code-action` step itself succeeded.
 *
 * @returns `{startedAt, ok}` — `ok: null` while the job is still queued or running.
 */
export function repairVerdict(job) {
  const startedAt = job.started_at ?? job.created_at ?? null;
  if (job.status !== "completed") return { startedAt, ok: null };
  const session = (job.steps ?? []).filter((s) => /claude-code-action/.test(s.name ?? ""));
  return { startedAt, ok: session.some((s) => s.conclusion === "success") };
}

/** This workflow's capsules created in the last hour, oldest first. Pure. */
export function burstOf(workflow, capsules = [], now = Date.now()) {
  return capsules
    .filter((c) => workflowOf(c.title) === workflow)
    .filter((c) => {
      const t = Date.parse(c.createdAt ?? "");
      return Number.isFinite(t) && t <= now && now - t <= WINDOW_MS;
    })
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/**
 * Decide whether to raise the alarm for one workflow. Pure.
 *
 * @param input.workflow  the workflow the newest capsule came from
 * @param input.capsules  open capsules `{number, title, createdAt}`, including any just filed
 * @param input.repairs   repair-job verdicts `{startedAt, ok}` (see `repairVerdict`), NOT including
 *                        this run's own repair job, which cannot have started yet
 * @param input.openAlarms open `ci-alarm` issues `{number, title}`
 * @param input.now       epoch ms; defaults to the clock
 * @returns `{type: "open-alarm", ...}` or `{type: "quiet", reason}`
 */
export function decideAlarm({ workflow, capsules = [], repairs = [], openAlarms = [], now }) {
  const at = now ?? Date.now();
  const title = alarmTitle(workflow);
  const burst = burstOf(workflow, capsules, at);
  if (burst.length < BURST_SIZE)
    return { type: "quiet", reason: `${burst.length} capsule(s) in the hour, under ${BURST_SIZE}` };

  const existing = openAlarms.find((a) => a.title === title);
  if (existing) return { type: "quiet", reason: `alarm #${existing.number} already open` };

  const since = Date.parse(burst[0].createdAt);
  const evidence = repairs.filter((r) => {
    const t = Date.parse(r.startedAt ?? "");
    return Number.isFinite(t) && t >= since;
  });
  if (evidence.some((r) => r.ok === true)) return { type: "quiet", reason: "a repair session ran" };
  if (evidence.some((r) => r.ok === null))
    return { type: "quiet", reason: "a repair is in flight" };
  if (!evidence.length && at - since < GRACE_MS)
    return { type: "quiet", reason: "too early to call the repair job dead" };

  const failed = evidence.length;
  return {
    type: "open-alarm",
    title,
    labels: [ALARM_LABEL.name],
    assignee: ASSIGNEE,
    capsules: burst.map((c) => c.number),
    body: alarmBody(workflow, burst, failed, at - since),
  };
}

/** The capsule (docs/ISSUES.md): ask, table and talking points above the fold; the list below it. */
function alarmBody(workflow, burst, failed, spanMs) {
  const minutes = Math.max(1, Math.round(spanMs / 60000));
  return [
    `**${burst.length} \`${workflow}\` failures in ${minutes} min, and no repair session has run.**`,
    "",
    "| | |",
    "|---|---|",
    `| **Workflow** | ${workflow} |`,
    `| **Capsules** | ${burst.map((c) => `#${c.number}`).join(", ")} |`,
    `| **Repair jobs since** | ${failed ? `${failed}, none ran a session` : "none started"} |`,
    "",
    "- The repair lane (`moneypenny-repair.yml`) is dead or blocked, so these capsules are piling up.",
    "- Look at the newest repair run first: an `allowed_bots` refusal or a missing token is the usual cause.",
    "- Close this once a repair session runs again; a new burst after that opens a fresh alarm.",
    "",
    "<details>",
    "<summary><strong>Why this fired</strong></summary>",
    "",
    `${BURST_SIZE} or more capsules from one workflow within an hour, and no repair job since the first`,
    `one ran a Claude session (failed, skipped, or never started ${GRACE_MS / 60000}+ min later).`,
    "Rule: #3818 criterion 7, built in #4292. One alarm per workflow while it stays open.",
    "",
    ...burst.map((c) => `- #${c.number} · ${c.createdAt} · ${c.title}`),
    "",
    "</details>",
  ].join("\n");
}

// ── the impure half ───────────────────────────────────────────────────────────

const gh = (args) =>
  execFileSync("gh", args, { encoding: "utf8", stdio: "pipe", maxBuffer: 16 << 20 }).trim();
const ghJson = (args) => JSON.parse(gh(args) || "[]");

/** Repair-job verdicts for repair runs created since `sinceIso`, minus this run. */
function recentRepairs(sinceIso, selfRunId) {
  const runs = ghJson([
    "api",
    `repos/{owner}/{repo}/actions/workflows/${REPAIR_WORKFLOW_FILE}/runs?created=>=${sinceIso}&per_page=50`,
    "--jq",
    ".workflow_runs",
  ]).filter((r) => String(r.id) !== String(selfRunId ?? ""));
  return runs.flatMap((r) =>
    ghJson(["api", `repos/{owner}/{repo}/actions/runs/${r.id}/jobs`, "--jq", ".jobs"])
      .filter((j) => j.name === REPAIR_JOB && j.conclusion !== "skipped")
      .map(repairVerdict),
  );
}

function ensureLabel() {
  try {
    gh([
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/labels",
      "-f",
      `name=${ALARM_LABEL.name}`,
      "-f",
      `color=${ALARM_LABEL.color}`,
      "-f",
      `description=${ALARM_LABEL.description}`,
    ]);
  } catch {
    /* 422 — the label already exists */
  }
}

/**
 * Called by repair.mjs after it files capsules. `capsules` are the lane's open capsules, the just-
 * filed ones included. Cheap when quiet: the repair-run reads happen only once a burst exists.
 */
export function raiseAlarmIfBurst(workflow, capsules, { now = Date.now(), selfRunId } = {}) {
  try {
    if (burstOf(workflow, capsules, now).length < BURST_SIZE)
      return { type: "quiet", reason: "no burst" };
    const openAlarms = ghJson([
      "issue",
      "list",
      "--state",
      "open",
      "--label",
      ALARM_LABEL.name,
      "--json",
      "number,title",
    ]);
    const sinceIso = new Date(now - WINDOW_MS).toISOString();
    const repairs = recentRepairs(sinceIso, selfRunId);
    const decision = decideAlarm({ workflow, capsules, repairs, openAlarms, now });
    if (decision.type !== "open-alarm") {
      console.log(`::notice::burst alarm quiet for ${workflow} — ${decision.reason}`);
      return decision;
    }
    ensureLabel();
    const url = gh([
      "issue",
      "create",
      "--title",
      decision.title,
      "--body",
      decision.body,
      "--label",
      decision.labels.join(","),
      "--assignee",
      decision.assignee,
    ]);
    console.log(`::warning::burst alarm raised for ${workflow}: ${url}`);
    return decision;
  } catch (err) {
    console.log(`::warning::burst alarm check failed, raising nothing: ${err.message ?? err}`);
    return { type: "quiet", reason: "check failed" };
  }
}
