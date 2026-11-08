// THE ACT STAGE FOR A HEADLESS PR — stuck-pr-decide.mjs names a PR whose head never got a required
// check run (no suite at all, or only a ghost); this gives that head one commit from the App identity,
// so GitHub sends the `synchronize` event that starts `verify`.
//
// WHY (#7112, 2026-11-08). #7089 was opened at 02:19Z by the Actions job token: a build that outlives
// its 1-hour App token falls back to it (#5936), and an event that token sends starts no workflow. So
// the PR had no check suite and no check run, and nothing named it: the watcher looked only for a
// ghost suite, and even a named headless PR got only a line of advice in the digest. It sat 16h, and
// #7077's next parts waited behind it, until Eric asked what was in flight. A close and reopen from
// a real account ran `verify` green in minutes.
//
// THE ACT. `PUT pulls/<n>/update-branch` from the App token: a merge commit from main, no force, no
// merge to main, and it fires only `synchronize`. When GitHub answers that the branch is already
// current, a commit with the head's own tree goes on top instead (stuck-branch-update.mjs's
// `emptyCommitOnHead`). Never a close: a close fires board-sync's `in-progress` re-derive and every
// lane's closed handler. The new head runs the whole Pipeline, so the arm job's own checks still
// decide whether it lands. Held PRs, drafts, protected diffs and platter-boarded branches are skipped
// (`judgePr`, `exemptReason`), as the re-arm and the stuck-branch update skip them.
//
// ONCE PER HEAD SHA, and at most NUDGE_CAP heads per PR. The memory is a marker comment naming the
// head it acted on, posted before the act, so a refused act still burns that head and nothing loops.
// The cap is the second net: if the App's own commit somehow also starts nothing, its new head would
// be unmarked and come back here every 30 minutes; past the cap the PR stays in `npm run pr:stuck`,
// which is the human's net.
//
// TOKEN. The audit step runs with the App token (moneypenny-events.yml), which already moves branches
// for stuck-branch-update.mjs, so no workflow change is needed.
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";
import {
  boardedBranches,
  exemptReason,
  HEADLESS_MINUTES,
  judgePr,
  latestRequired,
  needsHeadAt,
  REQUIRED_CHECKS,
} from "../stuck-pr-decide.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";
import { emptyCommitOnHead } from "./stuck-branch-update.mjs";

/** How many heads one PR gets before this stops acting on it. */
export const NUDGE_CAP = 3;

/** The hidden memory on the PR, one per head acted on. */
export const NUDGE_MARKER = /<!-- moneypenny:headless sha=(\S+) -->/;

/** The empty commit's message, when update-branch has nothing to merge. Lowercase-led for commitlint. */
const NUDGE_MESSAGE = "chore: a new head so this pr's checks start (#7112)";

/** GitHub's answer to update-branch on a branch that already holds main's tip. Any other refusal is
 *  reported, never answered with a commit. */
const ALREADY_CURRENT = /There are no new commits on the base branch/i;

/** Pure: which headless PRs get a commit, and the comment each carries. */
export function nudgeIntents(candidates = []) {
  return candidates
    .filter((c) => !c.triedShas.includes(c.headSha) && c.triedShas.length < NUDGE_CAP)
    .map((c) => ({
      kind: "nudge-headless",
      prNumber: c.number,
      title: c.title,
      headSha: c.headSha,
      headRef: c.headRef,
      hours: c.hours,
      body: `🔁 **Asking for a new head on this PR so its checks start** (try ${c.triedShas.length + 1} of ${NUDGE_CAP}): ${c.why}. One commit from Moneypenny's App sends the event that starts \`verify\`; the Pipeline then decides as it always does. This is asked once per head. If GitHub refuses it, or the checks still do not start, this PR stays in \`npm run pr:stuck\`.\n\n<!-- moneypenny:headless sha=${c.headSha} -->\n\n${FOOTER}`,
    }));
}

/** Every head sha a marker on this PR names. */
export function triedHeads(comments = []) {
  return comments.flatMap((c) => NUDGE_MARKER.exec(c?.body ?? "")?.[1] ?? []);
}

/**
 * Audit-mode read: every open PR against main that `judgePr` names headless and nothing exempts. REST
 * core only. The open list carries draft, auto-merge, labels and age, so only an unarmed, unheld PR
 * older than 30 minutes costs a read, and a healthy one costs exactly one (its check runs carry
 * `verify`). Loud on failure.
 */
export function gatherHeadless(nowMs, { rest = ghRest } = {}) {
  const read = (path) => withRetry(() => rest(path));
  const open = ghRestAll("pulls?state=open", { read: rest });
  const cutoff = nowMs - HEADLESS_MINUTES * 6e4;
  const rules = JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];
  const isProtected = (path) => breachOf(path, rules) !== null;
  const isBoarded = boardedBranches(open);
  const out = [];
  for (const listed of open) {
    if (listed.draft || listed.auto_merge || Date.parse(listed.created_at) > cutoff) continue;
    if (listed.base?.ref !== "main") continue; // Pipeline runs only on PRs into main
    // A fork's branch is not ours to move, and its runs wait on an approval for their own reason.
    if (listed.head?.repo?.full_name !== listed.base?.repo?.full_name) continue;
    if ((listed.labels ?? []).some((l) => l.name === LABELS.holdMerge.name)) continue;
    const sha = listed.head.sha;
    const checkRuns = read(`commits/${sha}/check-runs?per_page=100`).check_runs ?? [];
    if (latestRequired(checkRuns, REQUIRED_CHECKS).size) continue; // verify reported: not headless
    const suites = read(`commits/${sha}/check-suites?per_page=100`).check_suites ?? [];
    const headAt = needsHeadAt(checkRuns, suites)
      ? read(`commits/${sha}`).commit?.committer?.date
      : null;
    const pr = read(`pulls/${listed.number}`);
    const verdict = judgePr({ pr, checkRuns, suites, now: nowMs, headAt });
    if (verdict?.kind !== "headless") continue;
    const files = ghRestAll(`pulls/${listed.number}/files`, { read: rest }).map((f) => f.filename);
    if (exemptReason({ pr, files, isProtected, isBoarded })) continue;
    const comments = ghRestAll(`issues/${listed.number}/comments`, { read: rest });
    out.push({
      number: listed.number,
      title: listed.title,
      hours: verdict.hours,
      why: verdict.why,
      headSha: sha,
      headRef: listed.head.ref,
      triedShas: triedHeads(comments),
    });
  }
  return out;
}

/**
 * `gatherHeadless` for the audit step, soft on failure: the stall, silent-feedback and conflict
 * checks ride the same run, and a read this one cannot make must not cost those eyes.
 */
export function headlessOrNone(nowMs, { log = console.log, ...opts } = {}) {
  try {
    return gatherHeadless(nowMs, opts);
  } catch (err) {
    log(`::warning::headless-PR pass skipped — ${String(err.message).slice(0, 200)}`);
    return [];
  }
}

/** The text of a failed `gh` call, for matching and for the warning line. */
const failureText = (err) => String(err?.stderr || err?.message).slice(0, 200);

/**
 * The act. The marker goes first: if the commit is then refused, this head is still marked and
 * nothing loops. A refusal is reported, not thrown — a red audit run would file a repair capsule for
 * a nudge that did not take, and the PR stays in stuck-pr-scan's report either way.
 */
export function nudgeHeadless(i, { run = sh, log = console.log } = {}) {
  run("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  const refused = (err) => {
    log(`::warning::could not give #${i.prNumber} a new head — ${failureText(err)}`);
    return `⚠️ could not give #${i.prNumber} a new head — \`${i.title}\`, no checks ${i.hours}h; still in pr:stuck`;
  };
  try {
    run("gh", [
      "api",
      "-X",
      "PUT",
      `repos/{owner}/{repo}/pulls/${i.prNumber}/update-branch`,
      "-f",
      `expected_head_sha=${i.headSha}`,
    ]);
  } catch (err) {
    if (!ALREADY_CURRENT.test(failureText(err))) return refused(err);
    try {
      emptyCommitOnHead(i, run, NUDGE_MESSAGE);
    } catch (again) {
      return refused(again);
    }
  }
  return `🔁 gave #${i.prNumber} a new head so its checks start — \`${i.title}\`, no checks ${i.hours}h`;
}
