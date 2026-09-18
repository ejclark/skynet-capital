// THE EVENT-RESEARCH DISPATCH LANE — opening one issue per never-assessed calendar event, plus the
// per-push dedupe that keeps back-to-back merges from double-researching one. Split out of
// moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FOOTER, LABELS } from "./labels.mjs";
import { routeShipped } from "./shipped.mjs";

/* THE DISPATCH CEILING (#2946). The research lane spent a full weekly token quota in ~24 hours:
 * moneypenny-events.yml's matrix buys ONE opus session per row this function returns, at
 * --max-turns 150, and nothing bounded the row COUNT. `max-parallel` bounds concurrency,
 * `--max-turns` bounds one session's depth, the dedupe below bounds repeats — none of them bound
 * how many events dispatch at once. On the day this landed, `event-scan --due` returned 108.
 *
 * WHY THE CAP LIVES HERE and not in event-scan's printDue, where it was first written: `--due` is
 * also the "is this event still outstanding?" oracle for .github/prompts/event-research.md:13 and
 * moneypenny-event-stall-repair.md:38, and its full list feeds routeSweep's receipt issues. A cap
 * upstream makes DEFERRED indistinguishable from HANDLED, so the stall lane would close events
 * that are merely waiting their turn. Capping after the dedupe also avoids a deadlock: cap first,
 * and six stuck `research/*` PRs on the top-priority events would refill the top six every tick,
 * all get filtered here, and the matrix would dispatch ZERO while a hundred events waited.
 *
 * It still sits UPSTREAM of event-material-scan's deterministic screen, which only ever removes
 * rows (for free) — so a tick can dispatch fewer than the cap but never more, and the ceiling
 * survives the fail-open hole at moneypenny-events.yml:229 where a missing App token skips that
 * screen and "every due pulse dispatches a session". */
const DISPATCH_BUDGET_FILE = join(process.cwd(), "research-dispatch-budget.json");

const IMPACT_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/** Close-outs first, then impact, then proximity, then id.
 *
 *  Close-outs (`event-passed-unscored`) outrank everything regardless of impact because they are
 *  the one class the cap could destroy rather than delay: assessment-cadence.json's
 *  `closeOutWithinDays: 6` ages a passed event out PERMANENTLY, so a low-impact close-out starved
 *  behind a hundred criticals loses its outcome record for good. Everything else is only ever
 *  deferred. Inside that group `daysUntil` is negative, so ascending order puts the most overdue
 *  — the closest to expiring — first.
 *
 *  Known limitation, accepted for now: there is no aging term, so while the due pool is deep the
 *  low-impact tail waits behind tiers that reassess every 1–3 days. That is a starvation of
 *  DEFERRAL, not of data (nothing but close-outs expires), and the horizon prune that drains the
 *  pool is the next slice of #2946. Revisit here if the tail is still starved after it lands. */
const sortKey = (e) => {
  const impact = IMPACT_RANK[e.impact] ?? 99;
  const days = e.daysUntil ?? 0;
  // Close-outs sort by SLACK, not impact: they all expire at the same closeOutWithinDays horizon,
  // so the most overdue (most negative) has the least time left — earliest-deadline-first. Ranking
  // them by impact instead would let a critical with five days of slack evict a low with one.
  // Upcoming events have no expiry, so there impact leads and proximity breaks the tie.
  return e.reason === "event-passed-unscored" ? [0, days, impact] : [1, impact, days];
};

const compareDispatchPriority = (a, b) => {
  const [ka, kb] = [sortKey(a), sortKey(b)];
  return (
    ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2] || String(a.id).localeCompare(String(b.id))
  );
};

/** Read the ceiling. A missing or malformed budget file is a LOUD FAILURE, never an uncapped run
 *  — a scheduled caller must not mistake "broken" for "no limit", which is exactly the shape of
 *  the fail-open bug this cap exists to survive. That inverts dead-scan.mjs's absent-budget-means-
 *  Infinity default on purpose: that file gates debt, this one gates spend. */
export function loadDispatchCap(file = DISPATCH_BUDGET_FILE) {
  if (!existsSync(file))
    throw new Error(
      `moneypenny: dispatch budget missing at ${file}. Refusing to dispatch an uncapped research ` +
        "batch — see issue #2946. Restore the file rather than removing the ceiling.",
    );
  const cap = JSON.parse(readFileSync(file, "utf8")).maxPerTick;
  if (!Number.isInteger(cap) || cap < 1)
    throw new Error(
      `moneypenny: ${file} maxPerTick must be a positive integer, got ${JSON.stringify(cap)}.`,
    );
  return cap;
}

/** Something landed on main (or the `scan` command re-ran the sweep by hand — same path, never a
 *  second one that can drift). One issue per never-assessed event, deduped by exact open-issue
 *  title; plus the close-the-loop pass below. */
export function routeSweep(deps) {
  const { dueEvents = [], openIssueTitles = [] } = deps;
  const intents = [];
  const queued = new Set(openIssueTitles);
  for (const e of dueEvents.filter((x) => x.reason === "never-assessed")) {
    const title = `[event-research] ${e.id}`;
    if (queued.has(title)) continue;
    queued.add(title);
    intents.push({ kind: "open-issue", label: LABELS.event, title, body: eventIssueBody(e) });
  }
  const shipped = routeShipped(deps);
  const closing = new Set(shipped.map((s) => s.issueNumber));
  return [...intents, ...shipped, ...reconcileReceipts({ ...deps, alreadyClosing: closing })];
}

/** How many receipts one tick may close. See `reconcileReceipts` — the backlog this drains was
 *  298 issues deep when it was written, and closing all of them in one route job is ~600 REST
 *  calls and minutes of wall clock for a job that also has to dispatch research. The pass is
 *  level-based, so a cap defers work it can never drop: the next push takes the next batch. */
export const RECONCILE_CAP = 40;

/**
 * RECEIPTS ARE LEVEL-BASED TOO — the half of the loop nobody wrote.
 *
 * `routeSweep` opens one receipt per never-assessed event. Exactly two things ever closed one: a
 * merged PR that GitHub linked (`routeShipped`), and a human. Neither fires for the three ways a
 * receipt goes stale on its own, and by 2026-09-18 all three had, at once — 343 of the repo's 403
 * open issues were `[event-research]` receipts, of which **236 named an event whose ledger was
 * already on `main`**, 62 named an event the research horizon had put out of scope, and 108 were
 * duplicate receipts for an event that already had one:
 *
 *  1. **Researched.** The ledger merged but `closedByPullRequestsReferences` carried no link —
 *     the exact fragility `shipped.mjs` documents, and for duplicates it is not even fragility:
 *     a PR's `Closes #` names ONE issue, so the other receipts for that id can never close.
 *  2. **Not due.** #2971's research horizon (`assessment-cadence.json`) put events past
 *     `maxDaysOut` out of scope AFTER their receipts were open. Nothing reconciled — the receipt
 *     asks for research the lane is now deliberately not buying, and since it has no ledger the
 *     stall audit flags it and dispatches a repair session that can do nothing but say so. #2969
 *     is that case exactly: opened 2026-09-15 13:56, horizon merged 14:16, D-259 ever since.
 *  3. **Duplicate.** `gatherDeps` read the dedupe set from ONE unpaginated REST page, so once the
 *     repo passed 100 open issues the sweep stopped seeing most of its own receipts and reopened
 *     them — which raised the open count, which shrank the visible fraction further. A runaway.
 *     (Paginating that read is the other half of this fix; this pass cleans up what it produced.)
 *
 * The rule is one line: **one open receipt per event the sweep would open one for today, and none
 * for anything else.** `--due` is the oracle, uncapped and read fresh, so an event merely deferred
 * by the dispatch ceiling still counts as outstanding and keeps its receipt (the distinction
 * `dueForResearch`'s header insists on). `hasLedger` only picks the closing WORDING — it never
 * decides, so a ledger file that exists without a parseable `Last assessed:` header leaves the
 * event never-assessed, keeps its receipt, and cannot flap.
 *
 * Pure, so the specs drive every branch; the oldest receipt for an id is the survivor.
 */
export function reconcileReceipts(deps = {}) {
  const {
    openEventReceipts = [],
    dueEvents = [],
    hasLedger = () => false,
    alreadyClosing = new Set(),
    cap = RECONCILE_CAP,
  } = deps;
  const outstanding = new Set(
    dueEvents.filter((e) => e.reason === "never-assessed").map((e) => e.id),
  );
  const intents = [];
  const kept = new Set();
  for (const r of [...openEventReceipts].sort((a, b) => a.number - b.number)) {
    const id = String(r.title ?? "").match(/^\[event-research\] (.+)$/)?.[1];
    if (!id) continue;
    if (outstanding.has(id) && !kept.has(id)) {
      kept.add(id);
      continue;
    }
    if (alreadyClosing.has(r.number)) continue;
    const reason = outstanding.has(id) ? "duplicate" : hasLedger(id) ? "researched" : "not-due";
    intents.push({
      kind: "close-receipt",
      issueNumber: r.number,
      title: r.title,
      id,
      reason,
      body: `${RECEIPT_CLOSE_BODY[reason](id)}\n\n${FOOTER}`,
    });
  }
  if (intents.length > cap) {
    console.error(
      `::notice::receipt reconcile — ${cap} of ${intents.length} stale event receipt(s) closed ` +
        `this tick (cap ${cap}); the rest ride the next push, same order.`,
    );
  }
  return intents.slice(0, cap);
}

const RECEIPT_CLOSE_BODY = {
  researched: (id) =>
    `✅ **Already researched** — \`docs/research/events/${id}.md\` is on \`main\`, which is the ` +
    "whole of what this receipt asked for. Closing it here rather than waiting on GitHub's own " +
    "`Closes #` link, which does not fire reliably for PRs a bot both opens and merges and cannot " +
    "fire at all for a second receipt naming the same event.\n\nPulse checks continue on the " +
    "cadence in `assessment-cadence.json` — they do not need an issue.",
  "not-due": (id) =>
    `📅 **Not currently due** — \`${id}\` is on the calendar but outside the research horizon ` +
    "(`assessment-cadence.json` → `horizon`, issue #2946/#2971), so no session is being bought " +
    "for it and none will be until it comes inside. Nothing is lost: the sweep opens a **fresh " +
    "receipt** the moment it is due again.\n\nLeaving this open would be a standing request for " +
    "work the lane is deliberately not doing — and, with no ledger on disk, it reads to the stall " +
    "audit as a dead build forever.",
  duplicate: (id) =>
    `🧹 **Duplicate receipt** — another open issue already tracks \`${id}\`, and that one is the ` +
    "live request. This copy exists because the sweep's dedupe read only the first page of open " +
    "issues and stopped seeing its own receipts once the repo passed 100 of them.\n\nNo work is " +
    "dropped: the surviving receipt carries it.",
};

/**
 * Which due events actually get researched this run. The reason the event lane can ride EVERY push
 * without double-working: the research session's branch name is mandated as `research/<event-id>`,
 * so an event whose research PR is still open (merged PRs leave the list) is filtered out here.
 * Concurrency serializes Moneypenny's runs, so each run sees the last one's open PRs — the pair is
 * the dedupe.
 *
 * Then the dispatch ceiling (#2946): rank what survived the dedupe and hand the matrix at most
 * `cap` of them. Deferral is not dropping — the remainder stays due and rides the next tick in the
 * same order — and the deferred count goes to stderr as a `::notice::` so it is never silent.
 * `cap` is injectable so specs can pin it; production reads research-dispatch-budget.json.
 */
export function dueForResearch(dueEvents = [], openPrHeads = [], cap = loadDispatchCap()) {
  const inFlight = new Set(openPrHeads);
  const eligible = dueEvents
    .filter((e) => !inFlight.has(`research/${e.id}`))
    .sort(compareDispatchPriority);

  const dispatched = eligible.slice(0, cap);
  const deferred = eligible.length - dispatched.length;
  if (deferred > 0) {
    // stderr only: the workflow captures this function's result as JSON on stdout and feeds it to
    // fromJSON(), so a human-readable line there would corrupt the matrix.
    const next = eligible[dispatched.length];
    console.error(
      `::notice::dispatch ceiling — ${dispatched.length} of ${eligible.length} eligible event(s) ` +
        `dispatched this tick (cap ${cap}, research-dispatch-budget.json); ${deferred} deferred to ` +
        `later ticks, close-outs then highest impact then soonest. Next in line: ${next.id} ` +
        `(${next.impact}).`,
    );
  }
  return dispatched;
}

function eventIssueBody(e) {
  return [
    `@claude — a calendar event is awaiting initial research: **${e.title}** (${e.date}, ${e.status}, impact: ${e.impact})`,
    "",
    "Run the `never-assessed` mode of [`docs/process/EVENT-RESEARCH.md`](../blob/main/docs/process/EVENT-RESEARCH.md):",
    `produce \`${e.ledger}\` from its TEMPLATE (initial research + stance + kill switches + first`,
    "ledger row), and ship it via `/ship`. Moneypenny's push-driven sweep takes the pulse",
    "checks from there.",
    "",
    FOOTER,
  ].join("\n");
}
