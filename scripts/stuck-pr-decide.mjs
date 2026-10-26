// The deciding half of stuck-pr-scan.mjs — pure, so a fixture drives every branch with no network.
//
// WHAT IT WATCHES: a PR that has done everything asked of it and still is not merging. Every other
// net in this repo watches for RED; this failure is GREEN (docs/LESSONS.md, 2026-10-02 "a finished
// PR sat green for 29 hours", and 2026-10-16 — #5221 sat 5 days with both required checks green
// and auto-merge armed while `mergeable_state` read "blocked").
//
// THE CLASS, as measured on 2026-10-16 (150 merged PRs sampled + the live open list):
//
//   • a "ghost" check suite — an app-15368 (github-actions) suite on the PR's head that holds ZERO
//     check runs and a non-success conclusion (`action_required` while it waits for an approval
//     nobody can give, later `failure`/`startup_failure`; `cancelled` on a dependabot rebase). It is
//     the run a `pull_request` event SENT BY `github-actions[bot]` starts: the bare GITHUB_TOKEN
//     identity, which GitHub makes wait for manual approval (docs/LESSONS.md, 2026-08-17).
//   • 0 of 144 PRs that merged within hours carried one; every PR that sat for days with green
//     checks did (#5221, #4877; live today: #4855 and #5389).
//
// Three kinds, each with the one-line move that clears it:
//   blocked   required checks green · auto-merge armed · mergeable_state "blocked" · for > N hours
//   unarmed   required checks green · auto-merge NOT armed · not held · for > N hours (#4449's class)
//   headless  the head has a ghost suite and NO required check run at all (#4877: the head's only
//             run was the ghost, so `verify` never reported — nothing red, nothing running)

/** Branch protection on `main` requires exactly these (app 15368). Mirrors the live rule. */
export const REQUIRED_CHECKS = ["verify", "integration tests"];

/** A merge that is healthy takes minutes; 144 of 144 sampled fast PRs merged inside 3 hours. */
export const DEFAULT_HOURS = 3;

const NOT_A_GHOST = new Set(["success", "neutral", "skipped"]);

/**
 * Branch protection counts a skipped required check as passing, and every docs-only PR skips
 * `integration tests`. Requiring `success` made every research PR invisible here: #5940 and #6019
 * sat green and unarmed from 2026-10-22 while the scan named only code PRs.
 */
const PASSING = new Set(["success", "neutral", "skipped"]);

/**
 * A check suite that holds no check runs and did not succeed: a workflow run that never started a
 * job. Only the Actions app counts — the `claude` and `fly-io` suites sit `queued` with no runs on
 * every PR and mean nothing.
 */
export function isGhostSuite(suite) {
  return (
    suite?.app?.slug === "github-actions" &&
    suite.latest_check_runs_count === 0 &&
    suite.status === "completed" &&
    !NOT_A_GHOST.has(suite.conclusion ?? "")
  );
}

/** The latest check run of each required name (a re-run supersedes the run it replaced). */
function latestRequired(checkRuns, required) {
  const byName = new Map();
  for (const run of checkRuns) {
    if (!required.includes(run.name)) continue;
    const at = Date.parse(run.completed_at ?? run.started_at ?? 0) || 0;
    const seen = byName.get(run.name);
    if (!seen || at >= seen.at) byName.set(run.name, { at, run });
  }
  return byName;
}

const FIX_REAL_IDENTITY =
  "give the head a new commit from a real identity — `gh api -X PUT repos/{owner}/{repo}/pulls/<n>/update-branch` " +
  "(or `git merge origin/main` on the branch and a plain push; never a force push). That is what cleared #5221 in 10 minutes.";

/**
 * Judge one open PR. Returns `null` when it is fine (or not this class), else
 * `{ number, kind, hours, why, ghosts, fix }`.
 *
 * @param {{
 *   pr: { number: number, title?: string, html_url?: string, draft?: boolean, created_at?: string,
 *         labels?: {name: string}[], auto_merge?: unknown, mergeable_state?: string,
 *         user?: {login?: string} },
 *   checkRuns: {name: string, status?: string, conclusion?: string|null, completed_at?: string|null,
 *               started_at?: string|null}[],
 *   suites: {id?: number, app?: {slug?: string}, status?: string, conclusion?: string|null,
 *            latest_check_runs_count?: number, created_at?: string}[],
 *   now?: number,
 *   hours?: number,
 *   required?: string[],
 * }} input
 */
export function judgePr({
  pr,
  checkRuns,
  suites,
  now = Date.now(),
  hours = DEFAULT_HOURS,
  required = REQUIRED_CHECKS,
}) {
  if (pr.draft) return null;
  if ((pr.labels ?? []).some((l) => l.name === "hold-merge")) return null; // held on purpose
  const ghosts = (suites ?? []).filter(isGhostSuite);
  const latest = latestRequired(checkRuns ?? [], required);
  const runs = [...latest.values()];

  // Red is somebody else's signal and a running check is in flight; only two heads are ours: every
  // required check green, or none reported at all with a ghost sitting on the head.
  const allGreen =
    required.every((name) => latest.has(name)) &&
    runs.every(({ run }) => run.status === "completed" && PASSING.has(run.conclusion ?? ""));
  if (allGreen) {
    const greenAt = Math.max(...runs.map((v) => v.at));
    return judgeGreen({ pr, ghosts, age: (now - greenAt) / 3.6e6, hours });
  }
  if (ghosts.length && runs.length === 0) {
    const oldest = Math.min(...ghosts.map((g) => Date.parse(g.created_at ?? 0) || now));
    return judgeHeadless({ pr, ghosts, age: (now - oldest) / 3.6e6, hours });
  }
  return null;
}

/** Every required check is green: stuck if armed-and-blocked, or never armed. */
function judgeGreen({ pr, ghosts, age, hours }) {
  if (age < hours) return null;
  const armed = pr.auto_merge != null;
  const state = pr.mergeable_state ?? "unknown";
  const h = Math.round(age);
  if (armed && state === "blocked") {
    return {
      number: pr.number,
      kind: "blocked",
      hours: h,
      why: ghosts.length
        ? `green and armed for ${h}h but "blocked"; the head carries ${ghosts.length} ghost check suite(s) with no jobs`
        : `green and armed for ${h}h but "blocked", and no ghost suite explains it — look for an unresolved conversation or a rule change`,
      ghosts,
      fix: ghosts.length ? FIX_REAL_IDENTITY : "read the PR's Merge box: the blocker is not a run",
    };
  }
  if (!armed && state !== "dirty") {
    return {
      number: pr.number,
      kind: "unarmed",
      hours: h,
      why: `green for ${h}h and auto-merge was never armed — the arm job did not reach it`,
      ghosts,
      fix: "check the `arm auto-merge` job's conclusion on the head's Pipeline run; then `scripts/ship.sh automerge <n>`",
    };
  }
  return null;
}

/** No required check ever ran on the head; only a ghost did. */
function judgeHeadless({ pr, ghosts, age, hours }) {
  if (age < hours) return null;
  const h = Math.round(age);
  const kinds = [...new Set(ghosts.map((g) => g.conclusion))].join("/");
  return {
    number: pr.number,
    kind: "headless",
    hours: h,
    why: `no required check has ever run on the head, only ${ghosts.length} ghost suite(s) (${kinds}) from ${h}h ago`,
    ghosts,
    fix: FIX_REAL_IDENTITY,
  };
}

/** One human line per stuck PR. */
export function describe(stuck) {
  return `#${stuck.number} [${stuck.kind}] ${stuck.why}\n    fix: ${stuck.fix.replace("<n>", String(stuck.number))}`;
}

/** The digest's headline line, from the stuck list. Pure. `null` = the scan could not read GitHub. */
export function stuckLine(stuck) {
  if (stuck === null) return "- Stalled PRs: unknown (no GitHub read).";
  if (stuck.length === 0) return "- Stalled PRs: none — every green PR is merging.";
  const list = stuck.map((s) => `#${s.number} (${s.kind}, ${s.hours}h)`).join(", ");
  return `- Stalled PRs: ${stuck.length} green but not merging — ${list}. npm run pr:stuck names the one-line fix for each.`;
}
