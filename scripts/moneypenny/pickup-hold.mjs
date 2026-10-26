// A PLAN WITH NOTHING TO BUILD IS NOT A PICK (#5707). The pull rule (`notPullableReason`) reads
// labels and blocked-by links, never the state block — so a `ready` plan whose block says
// `**Next pickup:** none buildable until …` stayed at the top of the retry sweep and `/work-issues`,
// and every tick woke a session that found nothing to build: 7 empty sessions on #4450, #4808 and
// #4535 between 2026-10-18 and 2026-10-20, each stopped by a different hand act.
//
// THE RULE IS THE CONTINUATION LANE'S, NOT A NEW ONE. `continuationDecision` already refuses a plan
// whose block names no next pickup AND has no open, unblocked sub-issue (`!(sub || pickup)`); this
// asks the same question at the pick, with the same parser (`nextPickupOf`). No label is written —
// the hold lasts exactly as long as the block's line does, so editing that one line is the wake,
// and the sweep (level-based, it re-reads the pool every push) picks the plan on the next tick.
//
// WHY A SECOND PREDICATE, and not a branch inside `notPullableReason`: that one is pure over a REST
// row and every puller asks it; this one reads comments. Keeping the read beside it — lazy, and
// only for a pick that carries `plan` — costs one comments page per plan that survives the label
// checks, not one per ready row.
//
// EVERY UNKNOWN READS AS PULLABLE: no block, a block with no next-pickup line, a failed read, a
// block that names a slice, an open sub-issue whose blockers were not read. One empty session is
// the status quo; a plan stalled silently by a read error is worse.
import { ghRest, ghRestAll } from "./gh.mjs";
import { LABELS, labelNames } from "./labels.mjs";
import { nextPickupOf, stateBlockOf } from "./state-block.mjs";

/** How many open sub-issues' blocker lists one read asks for — the continuation gather's bound. */
export const BLOCKER_READS = 10;

/**
 * The next slice to take: the first open sub-issue whose every blocker is closed (#4056's
 * correction). Order is the sub-issue list's own, which GitHub returns in the order they were
 * attached — the plan's slicing order.
 *
 * AN UNREAD BLOCKER LIST IS UNKNOWN, NEVER "UNBLOCKED". The gather reads blockers for the first
 * `BLOCKER_READS` open slices only, so a sub-issue with no entry in `blockedBy` has not been asked
 * about — and treating that as "no blockers" would dispatch a slice whose dependency is still open,
 * which is precisely the check #4056 asked for. A plan deep enough to run past that bound falls
 * back to the block's next-pickup line instead, which a human wrote.
 *
 * @param blockedBy map of sub-issue number → its blocker issues (`[{ state }]`)
 */
export function nextSubIssue(subIssues = [], blockedBy = {}) {
  const known = (s) => Object.hasOwn(blockedBy ?? {}, s.number);
  return (
    (subIssues ?? [])
      .filter((s) => s && (s.state ?? "open") === "open")
      .find((s) => known(s) && blockedBy[s.number].every((b) => (b?.state ?? "open") !== "open")) ??
    null
  );
}

const isPlan = (issue) => labelNames(issue?.labels).includes(LABELS.plan.name);

/**
 * Does the block say, in so many words, that nothing is buildable? A next-pickup line the parser
 * reads as naming nothing (`none …`, `n/a`, `done`). A block with NO pickup line holds nothing: a
 * forgotten line is not a decision to wait, and a silent stall is the costlier error.
 */
const saysNothingBuildable = (body) =>
  /\*\*next pickup\b/i.test(String(body ?? "")) && !nextPickupOf(body);

/**
 * Why this plan has nothing a build session can take, or null when it may be picked. Pure.
 * `subIssues` / `blockedBy` are read only when the block names nothing, so either may be absent:
 * absent means "not read", which holds nothing.
 */
export function pickupHoldReason({ issue, comments, subIssues, blockedBy } = {}) {
  if (!isPlan(issue)) return null;
  const block = stateBlockOf(comments);
  if (!(block && saysNothingBuildable(block.body))) return null;
  if (!subIssues) return null;
  const open = subIssues.filter((s) => s && (s.state ?? "open") === "open");
  // A slice past the read bound might be buildable; unknown is pullable.
  if (open.some((s) => !Object.hasOwn(blockedBy ?? {}, s.number))) return null;
  if (nextSubIssue(open, blockedBy)) return null;
  return `its state block names no next pickup and no open, unblocked slice remains`;
}

/**
 * The live read behind `pickupHoldReason`, FAIL-OPEN: a non-plan costs nothing, a plan one
 * comments page, and a plan whose block names nothing also its sub-issues and their blockers.
 */
export function readPickupHold(
  issue,
  { readAll = ghRestAll, read = ghRest, log = console.log } = {},
) {
  if (!isPlan(issue)) return null;
  const n = issue.number;
  try {
    const comments = readAll(`issues/${n}/comments`);
    const block = stateBlockOf(comments);
    if (!(block && saysNothingBuildable(block.body))) return null;
    const subIssues = readAll(`issues/${n}/sub_issues`);
    const blockedBy = {};
    for (const s of subIssues
      .filter((x) => (x?.state ?? "open") === "open")
      .slice(0, BLOCKER_READS)) {
      blockedBy[s.number] = read(`issues/${s.number}/dependencies/blocked_by`) ?? [];
    }
    return pickupHoldReason({ issue, comments, subIssues, blockedBy });
  } catch (err) {
    log(
      `::warning::#${n}'s state block could not be read — treating it as pullable: ${String(err?.message ?? err).slice(0, 200)}`,
    );
    return null;
  }
}

/**
 * The first pick `pickOf` names that no hold refuses, stepping past held picks (each logged). The
 * pool shrinks every step, so this ends; the read is paid once per plan it lands on.
 *
 * @returns {{ pick: object | null, pool: object[] }} the pick, and the pool minus every held pick
 */
export function nextUnheld(pool, pickOf, holdOf, { who = "pick", log = console.log } = {}) {
  let rest = pool;
  for (;;) {
    const pick = pickOf(rest);
    if (!pick) return { pick: null, pool: rest };
    const hold = holdOf(pick);
    if (!hold) return { pick, pool: rest };
    log(`::notice::${who} — skipping #${pick.number}, ${hold}`);
    rest = rest.filter((i) => i.number !== pick.number);
  }
}
