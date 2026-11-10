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
//   headless  NO required check run on the head at all, and either a ghost suite on it (#4877: the
//             head's only run was the ghost, so `verify` never reported — nothing red, nothing
//             running) or NO Actions suite whatsoever for 30+ minutes (#7112: a PR the Actions job
//             token opens emits no event, so it gets no suite to be a ghost; #7089 sat 16h that way).
//             Moneypenny's audit acts on both (moneypenny/headless-pr.mjs): one App-identity commit
//             per head, which fires the `synchronize` event the job token never sent.

/** Branch protection on `main` requires exactly these (app 15368). Mirrors the live rule. */
export const REQUIRED_CHECKS = ["verify", "integration tests"];

/**
 * Not in branch protection, and pipeline.yml's arm job still waits on it, so red here holds a PR as
 * surely as a red required check: the arm job is skipped, not failed, and nothing re-runs it. So
 * whatever reads "red" or "green" reads these too. A head may carry none: a job added later has no
 * run on an older head, and that reads as passing, which is what the arm job's `needs` did for it.
 */
export const ARM_GATE_CHECKS = ["stability budget"];

/** What red means. A cancelled check says nothing about the code; #6325's sat beside a green one. */
export const RED = new Set(["failure", "timed_out"]);

/** A merge that is healthy takes minutes; 144 of 144 sampled fast PRs merged inside 3 hours. */
export const DEFAULT_HOURS = 3;

/**
 * A head with no Actions suite at all is named after this long. A PR's checks start within a
 * minute, so 30 minutes of nothing is not a slow runner (#7112; #7089 was detectable at ~02:49Z).
 */
export const HEADLESS_MINUTES = 30;

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
    isActionsSuite(suite) &&
    suite.latest_check_runs_count === 0 &&
    suite.status === "completed" &&
    !NOT_A_GHOST.has(suite.conclusion ?? "")
  );
}

/**
 * Does the head carry an Actions suite that was cancelled, or a no-job suite? The act stage asks this
 * (stuck-branch-update.mjs). It is wider than a ghost on purpose: the cancelled run behind #6325 is
 * unexplained, so this does not assume the next one will come with no jobs.
 */
export function hasCancelledSuite(suites = []) {
  return suites.some(
    (s) =>
      isGhostSuite(s) ||
      (s?.app?.slug === "github-actions" &&
        s.status === "completed" &&
        s.conclusion === "cancelled"),
  );
}

/**
 * Would `judgePr` time this head from its commit? Only a head with no required run and no Actions
 * suite is, so a reader spends the extra `commits/<sha>` call on that head and no other.
 */
export function needsHeadAt(checkRuns = [], suites = [], required = REQUIRED_CHECKS) {
  return latestRequired(checkRuns, required).size === 0 && !suites.some(isActionsSuite);
}

/** The latest check run of each required name (a re-run supersedes the run it replaced). */
export function latestRequired(checkRuns, required) {
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

const FIX_HEADLESS =
  "Moneypenny's audit gives the head one commit from the App identity on the next push to main, once per head " +
  "(moneypenny/headless-pr.mjs). Still listed after that? The commit did not take: " +
  FIX_REAL_IDENTITY;

/** Is this suite the Actions app's? Only its suites carry `verify`; `claude` and `fly-io` never do. */
const isActionsSuite = (suite) => suite?.app?.slug === "github-actions";

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
 *   headAt?: string|null,
 * }} input `headAt` is when the head commit was committed: a head pushed onto an old PR is only as
 *   old as the push, so a no-suite head is timed from the later of it and `pr.created_at`.
 */
export function judgePr({
  pr,
  checkRuns,
  suites,
  now = Date.now(),
  hours = DEFAULT_HOURS,
  required = REQUIRED_CHECKS,
  headAt = null,
}) {
  if (pr.draft) return null;
  if ((pr.labels ?? []).some((l) => l.name === "hold-merge")) return null; // held on purpose
  const ghosts = (suites ?? []).filter(isGhostSuite);
  const latest = latestRequired(checkRuns ?? [], required);
  const runs = [...latest.values()];
  const gates = [...latestRequired(checkRuns ?? [], ARM_GATE_CHECKS).values()];

  // Red is somebody else's signal and a running check is in flight; only two heads are ours: every
  // required check green, or none reported at all with a ghost sitting on the head. A cancelled
  // gate stays ours: the arm job did not run and nothing has said the code is bad, so the report is
  // the one place left to say so (stuck-branch-update reads armed PRs, stranded-pr a failed arm job).
  const allGreen =
    required.every((name) => latest.has(name)) &&
    runs.every(({ run }) => run.status === "completed" && PASSING.has(run.conclusion ?? "")) &&
    gates.every(({ run }) => run.status === "completed" && !RED.has(run.conclusion ?? ""));
  if (allGreen) {
    const greenAt = Math.max(...[...runs, ...gates].map((v) => v.at));
    const unfinished = gates
      .filter(({ run }) => !PASSING.has(run.conclusion ?? ""))
      .map(({ run }) => run.name);
    return judgeGreen({ pr, ghosts, age: (now - greenAt) / 3.6e6, hours, unfinished });
  }
  if (ghosts.length && runs.length === 0) {
    const oldest = Math.min(...ghosts.map((g) => Date.parse(g.created_at ?? 0) || now));
    return judgeHeadless({ pr, ghosts, age: (now - oldest) / 3.6e6, hours });
  }
  // A conflicted PR gets no `pull_request` run either, for its own reason, and the conflict flag
  // (audit.mjs) already owns it, so "dirty" is not this class.
  if (runs.length === 0 && !(suites ?? []).some(isActionsSuite) && pr.mergeable_state !== "dirty") {
    const since = Math.max(Date.parse(pr.created_at ?? "") || 0, Date.parse(headAt ?? "") || 0);
    return since ? judgeNoSuite({ pr, age: (now - since) / 3.6e6 }) : null;
  }
  return null;
}

/** No Actions suite on the head at all: the event that starts one was never sent (#7112). */
function judgeNoSuite({ pr, age }) {
  if (age * 60 < HEADLESS_MINUTES) return null;
  const h = Math.round(age);
  const since = age < 1 ? `${Math.round(age * 60)} minutes` : `${h}h`;
  return {
    number: pr.number,
    kind: "headless",
    hours: h,
    why: `no check suite and no required check run on the head for ${since}: the PR or its last push sent no event (likely the Actions job token, #5936)`,
    ghosts: [],
    fix: FIX_HEADLESS,
  };
}

/** Every required check is green: stuck if armed-and-blocked, or never armed. `unfinished` names the
 *  arm job's other checks that were cancelled, which is why it never ran. */
function judgeGreen({ pr, ghosts, age, hours, unfinished = [] }) {
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
  if (!armed && state !== "dirty" && unfinished.length) {
    const names = unfinished.map((name) => `\`${name}\``).join(", ");
    return {
      number: pr.number,
      kind: "unarmed",
      hours: h,
      why: `green for ${h}h, but ${names} was cancelled, so the arm job never ran`,
      ghosts,
      fix: "re-run the cancelled job from the PR's Checks tab; the arm job follows it. Nothing re-runs it on its own, and an arm by hand refuses a cancelled run",
    };
  }
  if (!armed && state !== "dirty") {
    return {
      number: pr.number,
      kind: "unarmed",
      hours: h,
      why: `green for ${h}h and auto-merge was never armed — the arm job did not reach it`,
      ghosts,
      fix: "a failed `arm auto-merge` job is re-run once per head by Moneypenny's audit (stranded-pr.mjs) on the next push to main; if it failed again, read that job's log, then `scripts/ship.sh automerge <n>`",
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
    fix: FIX_HEADLESS,
  };
}

/**
 * Branches an open platter PR has boarded. A platter's body is its ledger, one row per item naming
 * the item's branch (`Platter-Item`, scripts/platter-refs.mjs), so an item branch named in an open
 * `platter/` PR's body is already on its way to Eric's merge: its own PR must never arm. Pure.
 */
export function boardedBranches(openPrs = []) {
  const bodies = openPrs
    .filter((p) => /^platter\//.test(p.head?.ref ?? ""))
    .map((p) => p.body ?? "");
  return (ref) => {
    if (!ref || bodies.length === 0) return false;
    const escaped = ref.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const named = new RegExp(`(^|[^\\w/.-])${escaped}($|[^\\w/.-])`);
    return bodies.some((b) => named.test(b));
  };
}

/**
 * Why a stuck PR is not ours to clear, or null. Two kinds never auto-arm (2026-10-26: #5381–#5383,
 * dependabot bumps to `.github/workflows/**`, were named "unarmed" beside research PRs): a diff that
 * touches envelope.json's protected class waits for Eric's merge by design, and a branch already
 * boarded on a platter lands with it. Neither is stuck; both were left alone on purpose.
 *
 * @param {{ pr: {head?: {ref?: string}}, files: string[], isProtected: (path: string) => boolean,
 *           isBoarded: (ref: string) => boolean }} input
 */
export function exemptReason({ pr, files = [], isProtected, isBoarded }) {
  const hits = files.filter((f) => isProtected(f));
  if (hits.length) return `envelope-protected (${hits.slice(0, 3).join(", ")})`;
  if (isBoarded(pr.head?.ref ?? "")) return "boarded on an open platter";
  return null;
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
