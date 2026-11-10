// THE BOARD'S PRIORITY, BOTH WAYS — #6871 slice B1. Eric, 2026-11-04: "our project kanban board
// should switch to swim lanes", and asked whether a drag between lanes should set priority:
// "Drag sets priority". So the Priority field is written from labels AND read back from the board.
//
// WHY LABELS STAY THE SOURCE (#4064). Every lane can read a label; none can read the board (the App
// token is blind to a personal-account project). So `npm run rank`, `/work-issues` and the pull rule
// all order by a hand-set `P0`–`P3` label, else `classOf()`'s derived class — and the board field
// is a COPY of that, never a second opinion. A drag is the one way the copy flows back: it becomes
// that lane's P label, and from there every lane sees it.
//
// HOW A DRAG IS TOLD FROM A SYNC WRITE. A hidden text field, "Synced priority", records each value
// the sync writes. Priority that differs from the record is a human's hand. The sync writes
// Priority FIRST and the record SECOND, so the one partial failure it can leave is "Priority moved,
// record did not" — and that card's Priority equals what the labels say, which `planPriority` reads
// as a lagging record, never a drag (criterion: a failed sync is not read as a drag). The opposite
// order would leave "record moved, Priority did not", indistinguishable from a drag back.
//
// WHAT IS LEFT, said plainly: a drag that lands on exactly the value the labels already derive is
// recorded, not turned into a label — the card stays where it was dropped, just without a hand
// label pinning it. And a sync whose second write failed, followed by a label change before any
// sync heals it, reads as a drag to the half-written value. Two faults in one window; the falsifier
// on #6871 (a drag lost, or a sync misread as a drag, more than once by 2026-11-30) watches for it.
//
// Pure: no network, no file reads. The IO lives in projects-sync.mjs (one issue) and
// projects-reconcile.mjs (the sweep), which both call `planPriority` so they cannot disagree.
import { blocksOf, classOf } from "../rank.mjs";
import { isBacklogCandidate, PRIORITY_OPTIONS, SYNCED_PRIORITY } from "./projects.mjs";

export { SYNCED_PRIORITY };

/** Label names from a REST issue (objects) or an already-flat list (strings). */
const namesOf = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));

/**
 * The priority an open issue's labels give it — the same answer `npm run rank` prints: a hand-set
 * P label wins, else `classOf()`'s class. `issue` is the REST shape. The board's Horizon does not
 * reach the class (#6871 §4): deferring work is a drag to P3.
 *
 * `blocks` comes from `issue_dependencies_summary.blocking` (`blocksOf`, rank.mjs): the REST issue
 * already carries it, so the sweep pays no per-issue dependency read.
 */
export function wantedPriorityOf(issue) {
  return classOf({ labels: namesOf(issue?.labels), blocks: blocksOf(issue) }).cls;
}

/**
 * THE ONE DECISION, shared by the per-issue sync and the sweep. Given a card's Priority (`current`),
 * its "Synced priority" record (`synced`), the issue's labels and the label-led value (`wanted`),
 * what should happen? Exactly one of:
 *
 *   none    — the card, the record and the labels agree.
 *   write   — set Priority to `value`, then the record. A label changed, or the card was never set
 *             (or was cleared, or predates the record: nothing wrote Priority before #6871, so a
 *             value with no record is not evidence of a drag).
 *   record  — Priority is already `value`; only the record lags. The sync's second write failed,
 *             or a drag landed where the labels already point. Either way: no label to write.
 *   drag    — a human moved the card to `lane`. Add that P label, remove `remove`, then record.
 *             Nothing may overwrite the card until this has been applied.
 *   foreign — Priority holds a value outside P0–P3 (a lane added by hand). Left alone.
 */
export function planPriority({ current = null, synced = null, wanted, labels = [] } = {}) {
  const cur = current || null;
  const rec = synced || null;
  if (cur && !PRIORITY_OPTIONS.includes(cur)) return { action: "foreign", value: cur };
  // Only a set value AND a record that disagree can be a hand; anything else is the sync's to write.
  const disagrees = Boolean(cur && rec && cur !== rec);
  if (!disagrees) {
    if (cur === wanted && rec === wanted) return { action: "none" };
    if (cur === wanted) return { action: "record", value: wanted };
    return { action: "write", value: wanted, from: cur };
  }
  if (cur === wanted) return { action: "record", value: cur };
  const have = namesOf(labels);
  return {
    action: "drag",
    lane: cur,
    from: rec,
    add: have.includes(cur) ? [] : [cur],
    remove: PRIORITY_OPTIONS.filter((p) => p !== cur && have.includes(p)),
  };
}

/** One line for a log, from a `planPriority` result and the issue number. */
export function describePriority(number, plan) {
  switch (plan?.action) {
    case "write":
      return `#${number}: Priority ${plan.from ?? "(none)"} → ${plan.value}`;
    case "record":
      return `#${number}: Priority already ${plan.value}, recording it`;
    case "drag":
      return (
        `#${number}: dragged ${plan.from} → ${plan.lane} — label ${plan.lane}` +
        (plan.remove.length ? `, removing ${plan.remove.join(", ")}` : "")
      );
    case "foreign":
      return `#${number}: Priority "${plan.value}" is not P0–P3 — left alone`;
    default:
      return `#${number}: Priority in step`;
  }
}

// A first fill writes two fields on every open card (~210 on 2026-11-05). The sweep runs on every
// push to main and is cancelled by the next one, so it fills in bites rather than in one long run
// a burst of merges keeps restarting. Drags and Status moves are never capped: a drag is Eric's
// hand, and a column is what the admission gate reads.
export const PRIORITY_WRITES_PER_SWEEP = 60;

/**
 * Which cards need their priority touched this sweep? `items` carry `priority` and
 * `syncedPriority` (projects-sync.mjs's board read); `openIssues` are REST issues. Closed issues
 * are skipped — a closed card has nothing left to pull, and "Flow by priority" hides Done.
 * Returns `[{number, plan}]` for every card whose plan is not `none` or `foreign`, drags first,
 * then writes, capped at `cap` writes. Pure.
 */
export function planPriorityDrift({
  items = [],
  openIssues = [],
  numberOf,
  cap = PRIORITY_WRITES_PER_SWEEP,
} = {}) {
  const open = new Map(openIssues.filter((i) => i && !i.pull_request).map((i) => [i.number, i]));
  const drags = [];
  const writes = [];
  for (const item of items) {
    const number = numberOf(item);
    const issue = number ? open.get(number) : undefined;
    // syncIssue skips a non-candidate (a ci-failure tracker), so planning one would spend a slot of
    // the cap on a no-op every sweep, forever.
    if (!(issue && isBacklogCandidate({ labels: namesOf(issue.labels) }))) continue;
    const plan = planPriority({
      current: item?.priority ?? null,
      synced: item?.syncedPriority ?? null,
      wanted: wantedPriorityOf(issue),
      labels: issue.labels,
    });
    if (plan.action === "drag") drags.push({ number, plan });
    else if (plan.action === "write" || plan.action === "record") writes.push({ number, plan });
  }
  const byNumber = (a, b) => a.number - b.number;
  return {
    drift: [...drags.sort(byNumber), ...writes.sort(byNumber).slice(0, Math.max(0, cap))],
    deferred: Math.max(0, writes.length - Math.max(0, cap)),
  };
}
