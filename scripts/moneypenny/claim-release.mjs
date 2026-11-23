// THE EARLY RELEASE (#7313) — a feedback build's lease goes back the moment its work is done, not
// two hours later.
//
// WHAT WAS SLOW. A build takes `claim/feedback-<n>` before it works. A build that fails, or ends
// waiting on a member, gave the lease back (`releaseClaim`). A build that ended with a PR did not, so
// the lease aged out only at `CLAIM_TTL_MS` (2 h, claim-lease.mjs). An issue whose first part merged
// with `next-slice` sat "held by a live claim" for the rest of those two hours: merge to next start
// measured 141 min median, 171 min p90 (n=5, 2026-11-10), while a fresh `ready` issue starts in
// under a minute. The plan lane already released early on a merge (`continueNext`); the feedback
// lane had no such path.
//
// THREE RELEASES, EACH ON A SCRIPT PATH THE WORKFLOW ALREADY RUNS (no `moneypenny-events.yml` edit):
//
//   1. AT THE MERGE — the push tick's `Run Moneypenny` step. The push names the PR it merged
//      (`(#123)` on the squash commit's subject); a merged `feedback/<n>` PR releases
//      `claim/feedback-<n>`, so the same tick's `--peek-next` already sees the issue as free.
//   2. AT THE BUILD'S END — `--guard-feedback-outcome`, the step right after the session. A build
//      that leaves no open `feedback/<n>` PR (handed to a session, nothing to merge, or a PR that
//      already merged) has nothing left to wait for.
//   3. EXPIRED TAGS ON CLOSED ISSUES — also the push tick, a bounded few per tick. Hygiene: 546
//      `refs/tags/claim/*` sat on origin when this landed, almost all for issues long closed.
//
// WHAT STAYS (the issue's constraints). The 2 h TTL is still the backstop for a build that dies
// silently; this only adds earlier exits. `releaseClaim` itself is untouched — its source text is
// pinned by tests/arch/lease-namespace.spec.ts — so the caller passes it in. And no release here
// may let two builds of one issue overlap (#4357), which is what the verdicts below guard:
//   - a lease stamped AFTER the merge belongs to a newer claim (the same rule as
//     `continuationLeaseVerdict`), so it stays;
//   - an issue still carrying `in-progress` has a build running (every ending takes the label off,
//     the session's own last write and the job's `--end-build` backstop), so its lease stays;
//   - a live session's hold (#6065) is the session's to end, so it stays.
//
// Pure decisions + injected reads, like session-hold.mjs: index.mjs passes its own `readLease`,
// `releaseClaim` and REST reads in, because it imports this file and the cycle can only run one way.

/** The feedback lane's own build branch — the one PR shape whose merge frees `claim/feedback-<n>`. */
const FEEDBACK_BRANCH = /^feedback\/(\d+)$/;

/** The lease slugs this file may clean up: the two lanes' own, never the hourly or ask leases. */
const LANE_SLUG = /^(feedback|plan)-(\d+)$/;

/** How many expired tags one push tick inspects — each costs one tag read before its delete. */
export const EXPIRED_SWEEP_CAP = 20;

/**
 * The PR numbers a push merged, read off its commit subjects. A squash merge's subject ends
 * `(#<pr>)` (GitHub's default, and `ship.sh`'s); a subject that also cites an issue, like
 * `fix(x): y (#6702) (#8050)`, names the PR LAST, so only the trailing one counts.
 *
 * @returns {number[]}
 */
export function mergedPrNumbers(payload = {}) {
  const commits = Array.isArray(payload?.commits) ? payload.commits : [];
  const messages = commits.length
    ? commits.map((c) => c?.message)
    : [payload?.head_commit?.message];
  const numbers = new Set();
  for (const message of messages) {
    const subject = String(message ?? "").split("\n")[0];
    const m = /\(#(\d+)\)\s*$/.exec(subject);
    if (m) numbers.add(Number(m[1]));
  }
  return [...numbers];
}

/** The issue a feedback build branch names (`feedback/12` → 12), or null for any other branch. */
export function feedbackIssueOf(headRef) {
  const m = FEEDBACK_BRANCH.exec(String(headRef ?? ""));
  return m ? Number(m[1]) : null;
}

/**
 * Should the merge of a `feedback/<n>` PR release `claim/feedback-<n>` right now?
 *
 * @param input.mergedMs when the PR merged
 * @param input.lease `{ takenMs, holder }`, or null when nothing holds the issue
 * @param input.inProgress the issue still carries `in-progress`
 * @returns {{ action: "release" | "leave", reason: string }}
 */
export function mergeReleaseVerdict({ mergedMs, lease, inProgress } = {}) {
  if (!(lease && Number.isFinite(lease.takenMs)))
    return { action: "leave", reason: "no lease held" };
  if (lease.holder && lease.holder !== "lane") {
    return { action: "leave", reason: `held by a ${lease.holder}, which ends its own hold` };
  }
  if (Number.isFinite(mergedMs) && lease.takenMs > mergedMs) {
    return { action: "leave", reason: "a newer claim was taken after the merge" };
  }
  if (inProgress) return { action: "leave", reason: "its build is still running (in-progress)" };
  return { action: "release", reason: "its build's PR merged" };
}

/**
 * Should a build that just ended give its lease back? Yes when nothing is left to wait for:
 *   - it ended on a member's question (the #3959 release, unchanged);
 *   - the PR it opened has already merged or closed;
 *   - it opened no PR and the issue is no longer the lane's to pull (closed, parked, handed to a
 *     session with `needs-session`).
 * Two cases KEEP the lease:
 *   - its PR is still open: the push tick of that PR's merge releases it;
 *   - it opened no PR and the issue is still `ready` to pull (a build that found nothing to ship and
 *     said so in a comment). Releasing that would let the sweep re-run it on every tick, so the
 *     timeout still paces the retry, as before #7313.
 * Only PRs opened since the lease was taken count: a `next-slice` issue's earlier slice merged on
 * the same branch, and must not read as this build's PR.
 *
 * @param input.lanePrs `[{ state, createdMs }]` on `feedback/<n>`, or null when the read failed
 * @param input.leaseTakenMs when this build's lease was taken (NaN when unknown: then every PR counts)
 * @param input.stillPullable the lane could pull the issue again (ignoring the `in-progress` label
 *   this build itself may still carry)
 * @returns {{ release: boolean, reason: string }}
 */
export function buildEndVerdict({ waitingOnMember, lanePrs, leaseTakenMs, stillPullable } = {}) {
  if (waitingOnMember) return { release: true, reason: "the build ended waiting on the member" };
  if (!Array.isArray(lanePrs)) return { release: false, reason: "the lane PR read failed" };
  const mine = Number.isFinite(leaseTakenMs)
    ? lanePrs.filter((p) => !(p.createdMs < leaseTakenMs))
    : lanePrs;
  if (mine.some((p) => p.state === "open")) {
    return { release: false, reason: "its PR is open; the merge releases it" };
  }
  if (mine.length) return { release: true, reason: "its PR already merged or closed" };
  if (stillPullable) {
    return {
      release: false,
      reason: "no PR, and the issue is still ready: the timeout paces a retry",
    };
  }
  return {
    release: true,
    reason: "the build ended with no PR, and the issue is not the lane's to pull",
  };
}

/**
 * The lane lease slugs whose issue is not open — the expired-tag sweep's candidates, before any age
 * is read. `refs` is `git/matching-refs/tags/claim/`'s list; `openNumbers` the open issue numbers.
 * Capped, so one tick spends at most `cap` tag reads.
 */
export function closedIssueClaims(refs = [], openNumbers = new Set(), cap = EXPIRED_SWEEP_CAP) {
  const slugs = [];
  for (const r of refs) {
    const slug = String(r?.ref ?? "").replace(/^refs\/tags\/claim\//, "");
    const m = LANE_SLUG.exec(slug);
    if (!m || openNumbers.has(Number(m[2]))) continue;
    slugs.push(slug);
    if (slugs.length >= cap) break;
  }
  return slugs;
}

/**
 * The merge releases a push owes — impure, every read injected.
 *
 * @param deps.readPr `(n) => pull` (REST `pulls/<n>`)
 * @param deps.readLease `(slug) => { takenMs, holder } | null`
 * @param deps.readIssueLabels `(n) => string[]`
 * @returns {{ slug: string, reason: string }[]}
 */
export function gatherMergeReleases(
  payload,
  { readPr, readLease, readIssueLabels, log = () => undefined },
) {
  const out = [];
  for (const prNumber of mergedPrNumbers(payload)) {
    // One unreadable number (a direct push citing an issue, a transient 5xx) costs only itself.
    let pr;
    try {
      pr = readPr(prNumber);
    } catch (err) {
      log(`::warning::merge release — #${prNumber} unreadable: ${String(err).slice(0, 160)}`);
      continue;
    }
    const issue = feedbackIssueOf(pr?.head?.ref);
    if (!(issue && pr?.merged_at)) continue;
    const slug = `feedback-${issue}`;
    const lease = readLease(slug);
    // No lease is the common case (a build that ended with no PR already gave it back): no label read.
    const verdict = lease
      ? mergeReleaseVerdict({
          mergedMs: Date.parse(pr.merged_at),
          lease,
          inProgress: readIssueLabels(issue).includes("in-progress"),
        })
      : mergeReleaseVerdict({ lease });
    log(`::notice::merge release — #${prNumber} → ${slug}: ${verdict.reason}`);
    if (verdict.action === "release") out.push({ slug, reason: `PR #${prNumber} merged` });
  }
  return out;
}

/**
 * The expired lane leases on closed issues — impure, every read injected. A lease younger than the
 * TTL is left alone even on a closed issue: a build can still be running on an issue closed under it.
 *
 * @returns {{ slug: string, reason: string }[]}
 */
export function gatherExpiredClaims({ readRefs, openNumbers, readLease, nowMs, ttlMs, cap }) {
  const out = [];
  for (const slug of closedIssueClaims(readRefs(), openNumbers, cap)) {
    const lease = readLease(slug);
    const ageMs = lease ? nowMs - lease.takenMs : Number.POSITIVE_INFINITY;
    if (ageMs >= ttlMs) {
      out.push({ slug, reason: "past the timeout, and its issue is closed" });
    }
  }
  return out;
}
