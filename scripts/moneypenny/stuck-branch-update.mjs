// THE ACT STAGE FOR A GREEN, ARMED PR HELD BY A CANCELLED SUITE. stuck-pr-scan.mjs senses it and
// names the fix (`FIX_REAL_IDENTITY`, stuck-pr-decide.mjs); this applies that fix, the same way
// stranded-pr.mjs applies the one for a failed arm job.
//
// WHY (2026-11-01). #6325 has sat green and armed since 10-27 while GitHub reads it `blocked`, and
// its issue stays off the queue behind it. The scan's one-line fix was read only by sessions that
// happened to run `ship`. A green PR emits no further event, so nothing else ever comes back to it.
//
// THIS IS A WORKAROUND. A new head clears the state, which cleared #5221 in 10 minutes, but nobody
// has explained why #6325's Pipeline started twice in one second with one run cancelled. If that
// cause is found and fixed, this pass should stop finding anything and can go.
//
// WHAT IT TOUCHES. A branch update is a merge commit from main, with no force and no merge to main;
// a new head runs the whole Pipeline, so the arm job's own checks still decide. Dependabot's PR gets
// `@dependabot rebase` instead, because a merge commit stops it maintaining the PR. It skips held PRs,
// protected diffs and platter-boarded branches (`exemptReason`), as the re-arm does.
//
// THREE LIMITS. At most hourly across runners, by a lease (`takeHourlyLease`), and a tick with no
// armed old PR never asks for it. Once per head, by a marker on the PR. And `UPDATE_CAP` heads per
// PR: dependabot's rebase is itself a known source of a cancelled suite (stuck-pr-decide.mjs), so a
// new head can land right back here, and once-per-head alone would repeat hourly forever. Past the
// cap the PR stays in `npm run pr:stuck`, which is the human's net.
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";
import {
  boardedBranches,
  DEFAULT_HOURS,
  exemptReason,
  hasCancelledSuite,
  judgePr,
} from "../stuck-pr-decide.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";

/** How many heads one PR gets before this stops updating it. */
export const UPDATE_CAP = 3;

/** The hidden memory on the PR, one per head tried. */
const TRIED_MARKER = /<!-- moneypenny:update-branch sha=(\S+) -->/;

const DEPENDABOT = "dependabot[bot]";

/** Pure: which candidates get a new head, and the comment each carries. */
export function updateIntents(candidates = []) {
  return candidates
    .filter((c) => !c.triedShas.includes(c.headSha) && c.triedShas.length < UPDATE_CAP)
    .map((c) => ({
      kind: "update-stuck-branch",
      prNumber: c.number,
      title: c.title,
      headSha: c.headSha,
      hours: c.hours,
      dependabot: c.dependabot,
      body: `🔁 **Asking for a new head on this PR** (try ${c.triedShas.length + 1} of ${UPDATE_CAP}): it has been green and armed for **${c.hours}h**, but GitHub still reads it as blocked, and its head carries a cancelled check suite. A new commit cleared the same state on #5221. This is a workaround: why that run was cancelled is not explained yet. If it stays stuck, it stays in \`npm run pr:stuck\`.\n\n<!-- moneypenny:update-branch sha=${c.headSha} -->\n\n${FOOTER}`,
    }));
}

/**
 * Audit-mode read, at most hourly: every green, armed, `blocked` PR with a cancelled suite on its
 * head. REST core only. The open list carries `auto_merge`, `draft`, labels and age, so a tick with
 * no armed old PR costs that one call and never touches the lease. Loud on failure.
 */
export function gatherStuckBranches(
  nowMs,
  { hours = DEFAULT_HOURS, rest = ghRest, takeHourlyLease = () => false } = {},
) {
  const read = (path) => withRetry(() => rest(path));
  const open = ghRestAll("pulls?state=open", { read: rest });
  const cutoff = nowMs - hours * 3.6e6;
  const armed = open.filter(
    (pr) =>
      pr.auto_merge &&
      !pr.draft &&
      Date.parse(pr.created_at) <= cutoff &&
      !(pr.labels ?? []).some((l) => l.name === LABELS.holdMerge.name),
  );
  if (armed.length === 0 || !takeHourlyLease(nowMs)) return [];
  const rules = JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];
  const isProtected = (path) => breachOf(path, rules) !== null;
  const isBoarded = boardedBranches(open);
  const out = [];
  for (const listed of armed) {
    const sha = listed.head.sha;
    const suites = read(`commits/${sha}/check-suites?per_page=100`).check_suites ?? [];
    if (!hasCancelledSuite(suites)) continue;
    const checks = read(`commits/${sha}/check-runs?per_page=100`);
    const pr = read(`pulls/${listed.number}`);
    const checkRuns = checks.check_runs ?? [];
    const verdict = judgePr({ pr, checkRuns, suites, now: nowMs, hours });
    if (verdict?.kind !== "blocked") continue;
    const files = ghRestAll(`pulls/${listed.number}/files`, { read: rest }).map((f) => f.filename);
    if (exemptReason({ pr, files, isProtected, isBoarded })) continue;
    const comments = ghRestAll(`issues/${listed.number}/comments`, { read: rest });
    out.push({
      number: listed.number,
      title: listed.title,
      hours: verdict.hours,
      headSha: sha,
      dependabot: listed.user?.login === DEPENDABOT,
      triedShas: comments.flatMap((c) => TRIED_MARKER.exec(c?.body ?? "")?.[1] ?? []),
    });
  }
  return out;
}

/**
 * `gatherStuckBranches` for the audit step, soft on failure: the stall, silent-feedback and conflict
 * checks ride the same run, and a read this one cannot make must not cost those eyes.
 */
export function stuckBranchesOrNone(nowMs, { log = console.log, ...opts } = {}) {
  try {
    return gatherStuckBranches(nowMs, opts);
  } catch (err) {
    log(`::warning::stuck-branch pass skipped — ${String(err.message).slice(0, 200)}`);
    return [];
  }
}

/**
 * The act. The marker goes first: if the update is then refused, this head is still marked and
 * nothing loops. A refusal is reported, not thrown. `expected_head_sha` makes GitHub refuse if the
 * head moved since the read, and a red audit run would file a repair capsule for what is only a
 * workaround that did not take; the PR stays in stuck-pr-scan's report.
 */
export function updateStuckBranch(i, { run = sh, log = console.log } = {}) {
  run("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  try {
    if (i.dependabot) {
      run("gh", ["pr", "comment", String(i.prNumber), "--body", "@dependabot rebase"]);
    } else {
      run("gh", [
        "api",
        "-X",
        "PUT",
        `repos/{owner}/{repo}/pulls/${i.prNumber}/update-branch`,
        "-f",
        `expected_head_sha=${i.headSha}`,
      ]);
    }
  } catch (err) {
    const why = String(err?.stderr || err?.message).slice(0, 200);
    log(`::warning::could not update #${i.prNumber} — ${why}`);
    return `⚠️ could not update #${i.prNumber} — \`${i.title}\`, green ${i.hours}h; still in pr:stuck`;
  }
  return `🔁 gave #${i.prNumber} a new head — \`${i.title}\`, green and armed ${i.hours}h`;
}
