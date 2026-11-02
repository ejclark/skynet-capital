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
//
// A SLICE A HELD PLATTER CLOSES IS NOT OPEN WORK (#6530). Its sub-issue stays open until Eric merges
// the platter, so `nextSubIssue` read it as the next slice and both this hold and continuation
// started a build with nothing in it. `withoutBoarded` is the one place that rule lives; the map is
// `platterClosesByIssue`'s, the same one `boardedReason` reads for the issue itself.
//
// A WAIT WITH A DAY ON IT LIFTS ITSELF (#5482). `none until 2026-11-10 — …` holds the plan before
// that UTC day and not from it, so the sweep starts the session the day names. Before, editing the
// line was the only wake, and nobody edits a block on a date: #5482's last step (adopt a claim the
// 11-09 pass fails) had no session coming. Only an ISO day straight after `until` counts, so
// `none until #4808 merges` still holds until someone edits it. The session that wakes either
// builds or re-dates the line, and either edit moves the block.
import { ghRest, ghRestAll } from "./gh.mjs";
import { LABELS, labelNames } from "./labels.mjs";
import { platterClosesByIssue } from "./pr-issues.mjs";
import { nextPickupOf, pickupLineOf, stateBlockOf } from "./state-block.mjs";

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

/**
 * The sub-issues with every one a held platter closes read as closed, carrying `boardedOn` (the
 * platter's number) so a caller can say why. Its blockers are untouched: a slice that waits on a
 * boarded one still waits, because that work has not merged. Pure; no map means no change.
 *
 * @param boardedOn issue → the open platter PR whose body closes it (`platterClosesByIssue`)
 */
export function withoutBoarded(subIssues = [], boardedOn) {
  if (!boardedOn?.size) return subIssues ?? [];
  return (subIssues ?? []).map((s) => {
    const platter = s && (s.state ?? "open") === "open" ? boardedOn.get(s.number) : undefined;
    return platter ? { ...s, state: "closed", boardedOn: platter } : s;
  });
}

const isPlan = (issue) => labelNames(issue?.labels).includes(LABELS.plan.name);

/**
 * Does the block say, in so many words, that nothing is buildable? A next-pickup line the parser
 * reads as naming nothing (`none …`, `n/a`, `done`). A block with NO pickup line holds nothing: a
 * forgotten line is not a decision to wait, and a silent stall is the costlier error.
 */
const saysNothingBuildable = (body) =>
  /\*\*next pickup\b/i.test(String(body ?? "")) && !nextPickupOf(body);

/** The UTC day a `none until <YYYY-MM-DD>` pickup line's wait ends, or null for an undated wait. */
export function waitEndsOn(body) {
  return /\buntil\s+(\d{4}-\d{2}-\d{2})\b/i.exec(pickupLineOf(body) ?? "")?.[1] ?? null;
}

/** Nothing buildable and the wait's day (if it names one) not yet come. ISO days compare as text. */
const waiting = (body, now) => {
  if (!saysNothingBuildable(body)) return false;
  const day = waitEndsOn(body);
  return !day || new Date(now).toISOString().slice(0, 10) < day;
};

/**
 * Why this plan has nothing a build session can take, or null when it may be picked. Pure.
 * `subIssues` / `blockedBy` are read only when the block names nothing, so either may be absent:
 * absent means "not read", which holds nothing. `boardedOn` likewise: absent screens nothing.
 * `now` decides a dated wait (`none until <day>`) and nothing else.
 */
export function pickupHoldReason({
  issue,
  comments,
  subIssues,
  blockedBy,
  boardedOn,
  now = Date.now(),
} = {}) {
  if (!isPlan(issue)) return null;
  const block = stateBlockOf(comments);
  if (!(block && waiting(block.body, now))) return null;
  if (!subIssues) return null;
  const subs = withoutBoarded(subIssues, boardedOn);
  const open = subs.filter((s) => s && (s.state ?? "open") === "open");
  // A slice past the read bound might be buildable; unknown is pullable.
  if (open.some((s) => !Object.hasOwn(blockedBy ?? {}, s.number))) return null;
  if (nextSubIssue(open, blockedBy)) return null;
  const boarded = subs.filter((s) => s?.boardedOn).map((s) => `#${s.number} on #${s.boardedOn}`);
  const day = waitEndsOn(block.body);
  return (
    `its state block names no next pickup and no open, unblocked slice remains` +
    (boarded.length ? ` (boarded on a held platter: ${boarded.join(", ")})` : "") +
    (day ? `; the wait lifts on ${day}` : "")
  );
}

/**
 * The live read behind `pickupHoldReason`, FAIL-OPEN: a non-plan costs nothing, a plan one
 * comments page, and a plan whose block names nothing also its sub-issues and their blockers. The
 * open PR list is read last, and only when an open slice is all that keeps the plan pullable — the
 * one case a platter can change the answer.
 */
export function readPickupHold(
  issue,
  { readAll = ghRestAll, read = ghRest, log = console.log, now = Date.now() } = {},
) {
  if (!isPlan(issue)) return null;
  const n = issue.number;
  try {
    const comments = readAll(`issues/${n}/comments`);
    const block = stateBlockOf(comments);
    if (!(block && waiting(block.body, now))) return null;
    const subIssues = readAll(`issues/${n}/sub_issues`);
    const blockedBy = {};
    for (const s of subIssues
      .filter((x) => (x?.state ?? "open") === "open")
      .slice(0, BLOCKER_READS)) {
      blockedBy[s.number] = read(`issues/${s.number}/dependencies/blocked_by`) ?? [];
    }
    const hold = pickupHoldReason({ issue, comments, subIssues, blockedBy, now });
    if (hold || !subIssues.some((s) => (s?.state ?? "open") === "open")) return hold;
    const boardedOn = platterClosesByIssue(readAll("pulls?state=open"));
    return pickupHoldReason({ issue, comments, subIssues, blockedBy, boardedOn, now });
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
    const hold = holdOf(pick, rest);
    if (!hold) return { pick, pool: rest };
    log(`::notice::${who} — skipping #${pick.number}, ${hold}`);
    rest = rest.filter((i) => i.number !== pick.number);
  }
}
