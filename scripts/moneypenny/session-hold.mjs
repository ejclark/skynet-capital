// THE SESSION HOLD (#6065) — a live session holds a plan through its own merges. #8314 extends it to
// a feedback issue the session ships in more than one PR (`--hold feedback-<n>`): on 2026-11-24 a
// surge child's first PR merged, `in-progress` came off, and the feedback lane built the child's
// second PR beside it, twice in one hour. The feedback claim reads the same rule for a ref hold;
// its activity is the issue's own `updated_at` (labels, comments). A CLOUD session cannot write the
// ref at all (its proxy answers 403, measured the same night), so `--hold` falls back to the
// `session-held` label, written over REST. That label is in the pull rule (`notPullable`), so every
// claim path refuses it; `pr-in-progress.mjs` keeps `in-progress` on beside it at a merge; and
// `--release` or the stall audit's 6h sweep takes it off.
//
// WHAT BROKE. On 2026-10-26 a `/work-issues` session took #5482 at 11:30 by labelling it
// `in-progress`, and nothing else. Its first slice PR merged at 11:57; `pr-in-progress.mjs` saw no
// other open PR and no lease, so the label came off; at 12:00 continuation found the plan pullable
// and claimed it; at 12:41 the lane opened #6055 and at 12:52 the session opened #6058 — the same
// contract piece, built twice, about an hour wasted. The session was still working; its claim was a
// label, and a merge removes the label.
//
// THE FIX IS THE LANE'S OWN LEASE, NOT A SECOND MARKER. The session takes `claim/plan-<n>` exactly
// as the plan lane does (`index.mjs --hold plan-<n>`), and the lease's tag message records that a
// session holds it. Two readers then treat that hold differently from a lane run's lease:
//
//   - `continueNext` (index.mjs) releases a lane lease that predates the merge, because a lane run
//     that merged has finished (its prompt ends the session). A SESSION does not end at its merge, so
//     its hold is left alone while it is live — and "live" is measured from its last ACTIVITY
//     (the lease itself, a merge on the plan, a state-block edit), not from the stamp, because a
//     session that merges several PRs over an afternoon outlives the 2h TTL from its first claim.
//   - `pr-in-progress.mjs` keeps `in-progress` on at a merge while a session holds the plan. The
//     merge it is handling IS activity, so the hold is live at that moment by the rule above.
//
// HOW A HOLD ENDS. The session's own `--release plan-<n>` (lease and label both, `releaseBuild`) —
// the next sweep then continues the plan. A crashed session never releases, so a hold with no
// activity for the TTL is treated as released by continuation (criterion 3); the `in-progress`
// label it kept comes off on the stall audit's existing 6h sweep, like any dead session's.
//
// Pure: no IO here. The lease read is `leaseOf` (claim-lease.mjs); the callers pass what they read.

/** The holder a lease carries when nothing says otherwise — every lease taken before #6065. */
export const LANE_HOLDER = "lane";

/** The holder a live session's lease carries. */
export const SESSION_HOLDER = "session";

/** The tag-message line that names a non-lane holder; empty for the lane, so its message is unchanged. */
export const holderLine = (holder) =>
  holder && holder !== LANE_HOLDER ? `\nholder: ${holder}` : "";

/** Read the holder back out of a lease tag's message. */
export function holderOf(message) {
  const m = /^holder:\s*(\S+)\s*$/m.exec(String(message ?? ""));
  return m ? m[1] : LANE_HOLDER;
}

/** The newest of the lease's own stamp and every activity time given; non-numbers are ignored. */
export function lastActivityMs(takenMs, activityMs = []) {
  return Math.max(takenMs, ...activityMs.filter((ms) => Number.isFinite(ms)));
}

/**
 * Is a session's hold live by the activity rule above? Live while its last activity (the stamp, or
 * any time in `activityMs`) is within the TTL. Shared by continuation (plans) and the feedback claim
 * (#8314), so the two lanes can never disagree about when a session has gone quiet.
 *
 * @returns {{ live: boolean, quietMin: number }}
 */
export function sessionHoldLive(lease, activityMs, nowMs, ttlMs) {
  const quietMs = nowMs - lastActivityMs(lease.takenMs, activityMs);
  return { live: quietMs < ttlMs, quietMin: Math.round(quietMs / 60000) };
}

/**
 * Should continuation release this plan's lease and claim the next slice, or leave it alone?
 *
 * @param lease `{ takenMs, holder }`, or null when no lease is held
 * @param pick the continuation pick: `mergedMs` (the slice merge that made it a candidate) and
 *   `blockEditedMs` (the state block's last edit)
 * @returns {{ action: "leave" | "release", reason: string }}
 */
export function continuationLeaseVerdict(lease, pick = {}, nowMs, ttlMs) {
  if (!(lease && Number.isFinite(lease.takenMs))) {
    return { action: "release", reason: "no lease held" };
  }
  if (lease.holder === SESSION_HOLDER) {
    const hold = sessionHoldLive(lease, [pick.mergedMs, pick.blockEditedMs], nowMs, ttlMs);
    return hold.live
      ? { action: "leave", reason: `held by a live session (last activity ${hold.quietMin}m ago)` }
      : {
          action: "release",
          reason: `the session hold went quiet ${hold.quietMin}m ago — released`,
        };
  }
  // A lane lease stamped AFTER the merge belongs to a claim taken since the gather's snapshot.
  if (pick.mergedMs && lease.takenMs > pick.mergedMs) {
    return { action: "leave", reason: "took a new lease after its slice merged" };
  }
  return { action: "release", reason: "the finished run's lease predates the merge" };
}
