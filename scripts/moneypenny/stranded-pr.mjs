// THE ACT STAGE FOR A STRANDED PR — stuck-pr-scan.mjs senses a green PR that never merged; this
// re-runs the one job that should have armed it.
//
// WHY (2026-10-26). The sense stage named the class and stopped: `scripts/ship.sh automerge` is
// manual and refused to agent sessions, so a stranded PR waited for someone to read a digest. #6093
// (the #6005 bots-storm fix) sat green and unarmed 9h; #6019 since 10:10Z; #5940 four days. Every
// one had the same head: a Pipeline run whose `arm auto-merge` job FAILED on a GitHub transient —
// "GraphQL: Base branch was modified" on `gh pr merge --auto` (3 of 4), a GraphQL 5xx (1 of 4).
// Nothing re-ran it, because a green PR emits no further event.
//
// THE ACT IS THE PIPELINE'S OWN PATH. `POST actions/runs/<id>/rerun-failed-jobs` re-runs only the
// failed arm job, which re-reads the LIVE `hold-merge` label and re-runs the envelope scan on the
// diff before it arms. So this can never land anything the pipeline would not have landed; it only
// retries a job that died on GitHub's side. It never arms directly, and it skips held PRs,
// envelope-protected diffs and platter-boarded branches before asking (stuck-pr-decide.mjs's
// `exemptReason`), so the pipeline's own refusal is a second net, not the first.
//
// ONCE PER HEAD SHA. The memory is a marker comment on the PR, the same way the conflict flag keeps
// `sha=`/`attempt=` (audit.mjs's CONFLICT_MARKER): a re-run that fails again for a real reason
// stays failed, and the PR stays in stuck-pr-scan's report for a human. A new push is a new head,
// and its own Pipeline run arms it in the ordinary way.
//
// TOKEN. The audit step runs with the App token (moneypenny-events.yml → route). Re-running a job
// needs `actions: write`, the same grant `commentAndFlagConflict`'s `gh workflow run` dispatch
// already uses on every conflict (skynet-envoy[bot] dispatched moneypenny-repair.yml three times on
// 2026-10-26), so no workflow change is needed.
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";
import { boardedBranches, DEFAULT_HOURS, exemptReason, judgePr } from "../stuck-pr-decide.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER } from "./labels.mjs";

/** The hidden memory every re-arm comment carries: the head it re-ran the arm job for. */
export const REARM_MARKER = /<!-- moneypenny:rearm sha=(\S+) run=(\d+) -->/;

/** The job pipeline.yml names `arm auto-merge`, in the workflow it names `Pipeline`. */
const ARM_JOB = "arm auto-merge";
const PIPELINE = "Pipeline";

/**
 * Pure: which stranded PRs get their arm job re-run. Each candidate arrives as
 * `{ number, title, hours, headSha, armRunId, rearmedSha }` — `armRunId` is the head's Pipeline run
 * whose `arm auto-merge` job failed (null when it did not fail, or never ran), `rearmedSha` the sha
 * the last re-arm marker on the PR names (null when none).
 */
export function rearmIntents(candidates = []) {
  const intents = [];
  for (const c of candidates) {
    if (!(c.armRunId && c.headSha)) continue;
    if (c.rearmedSha === c.headSha) continue; // once per head: a second failure is real
    intents.push({
      kind: "rearm-stranded",
      prNumber: c.number,
      title: c.title,
      runId: c.armRunId,
      headSha: c.headSha,
      hours: c.hours,
      body: `🔁 **Re-running the arm job** — this PR has been green for **${c.hours}h** without being armed, and its Pipeline run's \`${ARM_JOB}\` job failed (run ${c.armRunId}). That job re-reads \`hold-merge\` and the envelope itself before it arms, so this only retries it — once for this head. If it fails again, the failure is real and this PR stays in \`npm run pr:stuck\`.\n\n<!-- moneypenny:rearm sha=${c.headSha} run=${c.armRunId} -->\n\n${FOOTER}`,
    });
  }
  return intents;
}

/** The sha the newest re-arm marker in these comments names, or null. Comments list oldest-first. */
export function lastRearmSha(comments = []) {
  for (let i = comments.length - 1; i >= 0; i -= 1) {
    const m = REARM_MARKER.exec(comments[i]?.body ?? "");
    if (m) return m[1];
  }
  return null;
}

/**
 * Pure: the head's newest Pipeline run, if its `arm auto-merge` job failed. `runs` are the
 * `actions/runs?head_sha=` rows; `jobsOf(id)` returns that run's jobs.
 */
export function failedArmRun(runs = [], jobsOf = () => []) {
  const pipeline = runs
    .filter((r) => r.name === PIPELINE && r.event === "pull_request" && r.status === "completed")
    .sort((a, b) => Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0))[0];
  if (!pipeline) return null;
  const arm = jobsOf(pipeline.id).find((j) => j.name === ARM_JOB);
  return arm?.conclusion === "failure" ? pipeline.id : null;
}

/**
 * Audit-mode read: every open PR stuck `unarmed`, with what `rearmIntents` needs. REST core only.
 * The open list already carries `auto_merge`, `draft`, labels and age, so only an unarmed, unheld,
 * old-enough PR costs its check reads. Loud on failure, like the rest of gatherAuditDeps.
 */
export function gatherStranded(nowMs, { hours = DEFAULT_HOURS, rest = ghRest } = {}) {
  const read = (path) => withRetry(() => rest(path));
  const open = ghRestAll("pulls?state=open", { read: rest });
  const rules = JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];
  const isProtected = (path) => breachOf(path, rules) !== null;
  const isBoarded = boardedBranches(open);
  const cutoff = nowMs - hours * 3.6e6;
  const out = [];
  for (const listed of open) {
    if (listed.draft || listed.auto_merge || Date.parse(listed.created_at) > cutoff) continue;
    if ((listed.labels ?? []).some((l) => l.name === "hold-merge")) continue;
    const sha = listed.head.sha;
    const checks = read(`commits/${sha}/check-runs?per_page=100`);
    const suites = read(`commits/${sha}/check-suites?per_page=100`);
    const pr = read(`pulls/${listed.number}`);
    const verdict = judgePr({
      pr,
      checkRuns: checks.check_runs ?? [],
      suites: suites.check_suites ?? [],
      now: nowMs,
      hours,
    });
    if (verdict?.kind !== "unarmed") continue;
    const files = ghRestAll(`pulls/${listed.number}/files`, { read: rest }).map((f) => f.filename);
    if (exemptReason({ pr, files, isProtected, isBoarded })) continue;
    const runs = read(`actions/runs?head_sha=${sha}&event=pull_request&per_page=30`);
    const armRunId = failedArmRun(
      runs.workflow_runs ?? [],
      (id) => read(`actions/runs/${id}/jobs?per_page=100`).jobs ?? [],
    );
    if (!armRunId) continue;
    const comments = ghRestAll(`issues/${listed.number}/comments`, { read: rest });
    out.push({
      number: listed.number,
      title: listed.title,
      hours: verdict.hours,
      headSha: sha,
      armRunId,
      rearmedSha: lastRearmSha(comments),
    });
  }
  return out;
}

/**
 * `gatherStranded` for the audit step, soft on failure: the stall, silent-feedback and conflict
 * checks ride the same run, and a read this one cannot make must cost one skipped re-arm — retried
 * on the next push — not those eyes. Said out loud, never silent.
 */
export function strandedOrNone(nowMs, opts) {
  try {
    return gatherStranded(nowMs, opts);
  } catch (err) {
    console.log(`::warning::stranded-PR re-arm skipped — ${String(err.message).slice(0, 200)}`);
    return [];
  }
}

/**
 * The act. The marker comment goes first: if the re-run request then fails, the head is still
 * marked and nothing loops — the PR stays in stuck-pr-scan's report, which is the human's net.
 */
export function rearmStranded(i, { run = sh } = {}) {
  run("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  const repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
  run("gh", ["api", "-X", "POST", `repos/${repo}/actions/runs/${i.runId}/rerun-failed-jobs`]);
  return `🔁 re-ran the arm job — \`${i.title}\` green ${i.hours}h, unarmed (#${i.prNumber}, run ${i.runId})`;
}
