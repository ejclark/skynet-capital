// A RED LANE PR WHOSE SESSION HAS ENDED HAS NO OWNER — this gives it one, in the audit path.
//
// WHY (2026-11-01). A lane session opens its PR and ends. If `verify` then fails, nothing comes back
// to it: the repair lane leaves a pull_request run alone (repair.mjs `routeFailure`, guard 2), and the
// sweep stays off any issue an open PR names with no age limit (`withoutOpenPr`, index.mjs). So one
// failing spec parks the whole issue for as long as nobody looks. #6440 went red on 10-30 over a
// one-line spec fix and held #5482, the convictions plan, for two days. stuck-pr-scan does not see it
// either: red is "somebody else's signal" there (stuck-pr-decide.mjs), and here there is no somebody.
//
// THE ACT IS TO CLOSE IT AND RELEASE THE ISSUE, not to fix it from here. The other door, the repair
// workflow's dispatch, only knows conflicts and event stalls; teaching it red PRs means a protected
// prompt edit. Closing is free, and the next build is an ordinary session the queue already knows how
// to start, with the failed check named on its issue. Nothing is merged or force-pushed.
//
// THE BRANCH GOES WITH IT. Both lane prompts branch `plan/<n>` or `feedback/<n>` off `origin/main`, so
// a stale remote branch of that name leaves the new session a rejected push, one step from a force
// push. The commits stay reachable through the closed PR (`pull/<n>/head`, and its Restore button).
//
// THE LOOP HAS AN END. A build that goes red every time would cost one session per age limit forever,
// so the issue's own comments count the closes, and past `RED_CLOSE_CAP` it takes `needs-session`,
// the existing label that keeps a remainder from the automated lanes and offers it to a live session.
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";
import {
  boardedBranches,
  exemptReason,
  latestRequired,
  REQUIRED_CHECKS,
} from "../stuck-pr-decide.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, LABELS, notPullableReason } from "./labels.mjs";

/**
 * How long a required check stays red before the PR counts as nobody's. A lane session runs for
 * hours at most, and #6440's failure was readable the minute it landed, so a day is well past any
 * session that could still be fixing it. The clock is the failed check's own, and a comment or push
 * inside the window also leaves the PR alone: that is someone on it.
 */
export const RED_PR_HOURS = 24;

/** How many red PRs one issue may go through before it goes to a live session instead. */
export const RED_CLOSE_CAP = 2;

/** The hidden memory on the issue: one per red PR closed there. */
const CLOSED_MARKER = /<!-- moneypenny:red-pr-closed pr=\d+ -->/;

/** Only a lane session's own PR: a person's is theirs, and a platter or dependabot has another path. */
const LANE_BOT = "skynet-envoy[bot]";
const LANE_BRANCH = /^(?:plan|feedback)\/(\d+)$/;

/** A cancelled check says nothing about the code; #6325's cancelled run sat beside a green one. */
const RED = new Set(["failure", "timed_out"]);

/** Pure: the head's newest failed required check, or null (a re-run in flight supersedes the red). */
function redCheck(checkRuns, nowMs) {
  const failed = [...latestRequired(checkRuns, REQUIRED_CHECKS).values()].filter(
    ({ run }) => run.status === "completed" && RED.has(run.conclusion ?? ""),
  );
  if (failed.length === 0) return null;
  const newest = failed.reduce((a, b) => (b.at > a.at ? b : a));
  return { run: newest.run, hours: (nowMs - newest.at) / 3.6e6 };
}

/**
 * Pure: the two comments and the act for each candidate. `handToSession` is the cap's answer.
 */
export function redLaneIntents(candidates = []) {
  return candidates.map((c) => {
    const handToSession = c.priorCloses >= RED_CLOSE_CAP;
    const keep = `\`git fetch origin pull/${c.number}/head\``;
    const next = handToSession
      ? `This is red PR number ${c.priorCloses + 1} on this issue, so it now carries \`${LABELS.needsSession.name}\`: the automated lanes stop here, and a live session can take it.`
      : "This issue is back in the queue, so a new build can start on it.";
    return {
      kind: "close-red-lane-pr",
      prNumber: c.number,
      issueNumber: c.issue,
      branch: c.branch,
      title: c.title,
      hours: Math.round(c.hours),
      handToSession,
      prBody: `🧹 **Closing this PR: \`${c.failed}\` has been failing for ${Math.round(c.hours)}h and nobody is working on it.** The session that opened it has ended, and an open PR keeps #${c.issue} out of the build queue.\n\nNothing was merged. The commits stay on this PR (${keep}), and the branch can be restored from here. The next step is on #${c.issue}.\n\n${FOOTER}`,
      issueBody: `**#${c.number} was closed with \`${c.failed}\` still failing after ${Math.round(c.hours)}h.** ([the failed check](${c.failedUrl}))\n\n- ${next}\n- **To keep that work:** ${keep}, then merge or cherry-pick it onto the new branch. Read the failed check first; the code may only need that fix.\n\n<!-- moneypenny:red-pr-closed pr=${c.number} -->\n\n${FOOTER}`,
    };
  });
}

/**
 * Audit-mode read: every lane PR red past the age limit, with what `redLaneIntents` needs. REST core
 * only. The open list carries the author, branch, labels and last-touched time, so a tick where no
 * lane PR is that old costs that one call. Loud on failure, like `gatherStranded`.
 */
export function gatherRedLanePrs(nowMs, { hours = RED_PR_HOURS, rest = ghRest } = {}) {
  const read = (path) => withRetry(() => rest(path));
  const open = ghRestAll("pulls?state=open", { read: rest });
  const cutoff = nowMs - hours * 3.6e6;
  let exempt;
  const out = [];
  for (const pr of open) {
    const lane = LANE_BRANCH.exec(pr.head?.ref ?? "");
    if (!lane || pr.user?.login !== LANE_BOT || pr.draft) continue;
    if (Date.parse(pr.updated_at) > cutoff) continue;
    if ((pr.labels ?? []).some((l) => l.name === LABELS.holdMerge.name)) continue;
    const checks = read(`commits/${pr.head.sha}/check-runs?per_page=100`);
    const red = redCheck(checks.check_runs ?? [], nowMs);
    if (!red || red.hours < hours) continue;
    const issue = Number(lane[1]);
    // The pull rule, so this only ever closes a PR that is all that keeps its issue off the queue. A
    // session building it, or an issue parked on someone's decision, gains nothing from the close.
    if (notPullableReason(read(`issues/${issue}`))) continue;
    exempt ??= exemptionsOver(open);
    const files = ghRestAll(`pulls/${pr.number}/files`, { read: rest }).map((f) => f.filename);
    if (exemptReason({ pr, files, ...exempt })) continue;
    const comments = ghRestAll(`issues/${issue}/comments`, { read: rest });
    out.push({
      number: pr.number,
      title: pr.title,
      issue,
      branch: pr.head.ref,
      hours: red.hours,
      failed: red.run.name,
      failedUrl: red.run.html_url,
      priorCloses: comments.filter((c) => CLOSED_MARKER.test(c?.body ?? "")).length,
    });
  }
  return out;
}

/** The two exemptions `exemptReason` asks about, built only once a PR gets that far. */
function exemptionsOver(open) {
  const rules = JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];
  return {
    isProtected: (path) => breachOf(path, rules) !== null,
    isBoarded: boardedBranches(open),
  };
}

/**
 * `gatherRedLanePrs` for the audit step, soft on failure: the stall, silent-feedback and conflict
 * checks ride the same run, and a read this one cannot make must cost one skipped pass, retried on
 * the next push, not those eyes.
 */
export function redLaneOrNone(nowMs, { log = console.log, ...opts } = {}) {
  try {
    return gatherRedLanePrs(nowMs, opts);
  } catch (err) {
    log(`::warning::red lane PR pass skipped — ${String(err.message).slice(0, 200)}`);
    return [];
  }
}

/**
 * The act. The close goes first, so the issue's marker only ever counts a close that happened: if
 * the close fails, nothing changed and the next push tries again. The branch goes last, so a failed
 * delete cannot cost the issue its handoff.
 */
export function closeRedLanePr(i, { run = sh } = {}) {
  run("gh", ["pr", "close", String(i.prNumber), "--comment", i.prBody]);
  run("gh", ["issue", "comment", String(i.issueNumber), "--body", i.issueBody]);
  if (i.handToSession) {
    const label = LABELS.needsSession.name;
    run("gh", ["issue", "edit", String(i.issueNumber), "--add-label", label]);
  }
  run("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/heads/${i.branch}`]);
  return `🧹 closed red PR #${i.prNumber} — \`${i.title}\`, ${i.hours}h red; #${i.issueNumber} ${i.handToSession ? "goes to a live session" : "is back in the queue"}`;
}
