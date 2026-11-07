// THE CARD'S THREE EXTRA FIELDS, DECIDED — #6871 slice 3 (board design §5, 2026-11-05 on the plan
// issue). Kind, "Waiting on" and "In this column since" are written by the sync from what the
// issue already says; nobody sets them by hand, and none of them is read by a build lane (lanes read
// labels, never the board — #4064). They exist so a person reading the board can tell, per card:
// what sort of work it is (the order inside a priority lane), who acts next when it cannot be
// pulled, and how long it has sat in its column.
//
//   Kind                 — `kindOf` (scripts/rank.mjs), from the card's own labels.
//   Waiting on           — actor plus act ("Eric to decide"), from the labels, the column and the
//                          pull rule's coded reason (`notPullable`, labels.mjs). Blank when nothing
//                          stops a build: Ready, Next part queued, and Building now with no person's
//                          label on it.
//   In this column since — the UTC day Status last changed. Written ONLY on a real change, and
//                          BEFORE the Status write: if the Status write then fails, the next sync
//                          still sees the old Status, writes the day again, and heals. The other
//                          order would leave a moved card with a stale day and nothing to notice.
//
// WHAT IS NOT HERE, said plainly: a clock-based hold ("Held until 2026-11-10") lives in a plan's
// state block, a comment the sweep does not read per card, so `Waiting on` does not name it yet.
//
// Pure: no network, no file reads. The IO is projects-sync.mjs (`syncCardFields`, one issue) and
// projects-reconcile.mjs (the sweep), which both call these so they cannot disagree.
import { kindOf } from "../rank.mjs";
import { LABELS, labelNames, notPullable } from "./labels.mjs";
import {
  IN_COLUMN_SINCE,
  isBacklogCandidate,
  KIND,
  NEXT_NEEDS_APPROVAL,
  WAITING_ON,
} from "./projects.mjs";

/** The Kind an open issue's labels give it. `horizons` is the hand triage in projects-horizons.json. */
export function wantedKindOf(issue, { horizons = {} } = {}) {
  const blocking = Number(issue?.issue_dependencies_summary?.blocking) || 0;
  return kindOf({
    labels: labelNames(issue?.labels),
    blocks: Array.from({ length: blocking }, () => 0),
    horizon: horizons[String(issue?.number)] ?? null,
  });
}

// The person-waiting labels, each with the act it asks for. Order = which one the card names when
// several are on it: a question to Eric outranks a request to the filer.
const PERSON_LABELS = [
  [LABELS.needsEric.name, "Eric to decide"],
  [LABELS.needsInfo.name, "The filer to answer"],
  [LABELS.needsDesign.name, "Eric to open a design session"],
  [LABELS.needsSession.name, "Someone to run it live"],
  [LABELS.holdMerge.name, "Eric to release the merge hold"],
];

/**
 * Who acts next on this card, as actor plus act, or "" when nothing stops a build. `card` is
 * `wantedCard`'s answer for the issue (its `status`, and the open-PR reads it made). Pure.
 *
 *   1. A person's label names that person — checked first, in EVERY column, because Building now
 *      is checked before the needs-* labels (a card being built that also waits on someone still
 *      shows the seat it takes, and its labels still name the person).
 *   2. A needs-eric with no written ask is a session's job, not Eric's (#3913).
 *   3. In Next part needs approval, the part to be approved.
 *   4. In Backlog, the pull rule's first failing check: no `ready` → approval to build; a held
 *      platter → Eric's merge; an open blocker → the issue(s) to close; an open PR → its merge.
 *   5. Any other column: blank.
 */
export function waitingOnFor(issue, card = {}) {
  const labels = labelNames(issue?.labels);
  if (labels.includes(LABELS.needsEric.name) && card.decisionCalloutMissing) {
    return "A session to write Eric's question";
  }
  const person = PERSON_LABELS.find(([name]) => labels.includes(name));
  if (person) return person[1];
  if (card.status === NEXT_NEEDS_APPROVAL) return "Next part to be approved";
  if (card.status !== "Backlog") return "";
  const why = notPullable({ ...issue, labels }, { boardedOn: card.boardedOn });
  switch (why?.code) {
    case "no-ready":
      return "Approval to build";
    case "platter":
      return "Eric to merge the held platter";
    case "blocked": {
      const n = Number(issue?.issue_dependencies_summary?.blocked_by) || 0;
      return n === 1 ? "An open blocking issue to close" : `${n} open blocking issues to close`;
    }
    default:
      return card.namedByOpenPr ? "Its open PR to merge" : "";
  }
}

/** Kind and "Waiting on" for one open issue — what its card should show. Pure. */
export function wantedCardFields(issue, card, { horizons = {} } = {}) {
  return { kind: wantedKindOf(issue, { horizons }), waitingOn: waitingOnFor(issue, card) };
}

/**
 * What to write to ONE card, and in what order. `have` is the card as the board shows it
 * (`{kind, waitingOn, status}`); `wanted` is `wantedCardFields`'s answer plus the new `status`;
 * `present` names the fields the board carries (a field setup has not made yet is skipped, never an
 * error — the sweep runs before the setup dispatch does); `today` is the UTC day.
 *
 * Returns the writes in order — the day first, per the header — as
 * `{field, kind: "select" | "text" | "clear" | "date", value}`; empty when the card agrees.
 */
export function planCardFields({ have = {}, wanted, status, today, present = {} } = {}) {
  const writes = [];
  if (present[IN_COLUMN_SINCE] && status && (have.status ?? null) !== status) {
    writes.push({ field: IN_COLUMN_SINCE, kind: "date", value: today });
  }
  if (present[KIND] && wanted.kind !== (have.kind ?? null)) {
    writes.push({ field: KIND, kind: "select", value: wanted.kind });
  }
  if (present[WAITING_ON] && wanted.waitingOn !== (have.waitingOn ?? "")) {
    writes.push(
      wanted.waitingOn
        ? { field: WAITING_ON, kind: "text", value: wanted.waitingOn }
        : { field: WAITING_ON, kind: "clear", value: "" },
    );
  }
  return writes;
}

/** One log line for a card's field writes. */
export function describeCardFields(number, writes = []) {
  if (!writes.length) return `#${number}: card fields in step`;
  const parts = writes.map((w) =>
    w.kind === "clear" ? `${w.field} cleared` : `${w.field} → "${w.value}"`,
  );
  return `#${number}: ${parts.join("; ")}`;
}

// A first fill writes up to two fields on every open card (~210 on 2026-11-05) through a mutation
// each. The sweep runs on every push to main and is cancelled by the next, so it fills in bites, as
// priority does (PRIORITY_WRITES_PER_SWEEP). "In this column since" is never in this count: it is
// written only beside a Status move, which is never capped.
export const CARD_FIELD_WRITES_PER_SWEEP = 40;

/**
 * Which open cards need Kind or "Waiting on" touched this sweep? `items` are the board's cards
 * (with `kind` / `waitingOn` from the read); `wantedFor(issue)` returns that issue's
 * `{kind, waitingOn}` (the sweep's `wantedCardFields` over its shared context), or null for a card
 * the board never carries. `present` is `planCardFields`'s field map: with neither field on the
 * board there is nothing to plan. Returns `[{number, writes}]` ascending, capped, plus how many
 * more are left for the next sweep. Pure.
 */
export function planCardFieldDrift({
  items = [],
  openIssues = [],
  numberOf,
  wantedFor,
  present = {},
  cap = CARD_FIELD_WRITES_PER_SWEEP,
} = {}) {
  if (!(present[KIND] || present[WAITING_ON])) return { drift: [], deferred: 0 };
  const open = new Map(openIssues.filter((i) => i && !i.pull_request).map((i) => [i.number, i]));
  const due = [];
  for (const item of items) {
    const number = numberOf(item);
    const issue = number ? open.get(number) : undefined;
    if (!(issue && isBacklogCandidate({ labels: labelNames(issue.labels) }))) continue;
    const wanted = wantedFor(issue);
    if (!wanted) continue;
    // The day is Status's business, so it is left out here (`status` unset plans no date).
    const writes = planCardFields({ have: item, wanted, present, today: "" });
    if (writes.length) due.push({ number, writes });
  }
  due.sort((a, b) => a.number - b.number);
  const limit = Math.max(0, cap);
  return { drift: due.slice(0, limit), deferred: Math.max(0, due.length - limit) };
}
