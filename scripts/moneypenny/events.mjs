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
    intents.push({
      kind: "open-issue",
      label: LABELS.event,
      title,
      body: eventIssueBody(e),
    });
  }
  return [...intents, ...routeReceipts(deps), ...routeShipped(deps)];
}

/** How many receipts one push may close. Not a spend gate like the dispatch cap — a rate one: each
 *  close is two `gh` mutations, and a 343-issue backlog in a single tick is the shape of the
 *  2026-08-26 bucket exhaustion. Hard-coded rather than a budget file because nothing about it is
 *  a policy choice Eric would ever want to tune. */
const CLOSES_PER_TICK = 40;

/** The event id a receipt issue tracks — `[event-research] <id>` is the title the sweep writes
 *  above, and the only contract between an issue and the ledger file it is a receipt for. */
export const receiptEventId = (title) => {
  const hit = /^\[event-research\]\s+(\S+)\s*$/.exec(String(title ?? ""));
  return hit ? hit[1] : undefined;
};

/**
 * RECONCILE THE RECEIPTS against ground truth on disk — the close half the dispatch lane never had.
 *
 * A receipt issue is opened when an event is `never-assessed` and due, and the ONLY thing that
 * ever closed one was `close-shipped`: a merged PR carrying `Closes #N`. Two holes followed from
 * that, and by 2026-09-18 they had left 343 open `event-research` issues covering 234 distinct
 * events (#2970):
 *
 *   1. SHIPPED BUT NEVER CLOSED. 199 of those 234 ids already had `docs/research/events/<id>.md`
 *      on main. `close-shipped` reads `closedByPullRequestsReferences` through the scarce GraphQL
 *      bucket, capped at 100 issues, so it could not see the older two thirds at all — and the
 *      research PR only ever carries the link if the session happened to know the issue number.
 *      The LEDGER FILE is the better oracle: it is the deliverable the issue asks for, it is on
 *      disk in the very checkout this runs from, and reading it costs nothing.
 *
 *   2. OBSOLETE, AND NOTHING COULD EVER CLAIM IT. The research horizon (#2946/#2971, landed
 *      2026-09-15) made `--due` skip anything past `horizon.maxDaysOut`. Every receipt already
 *      open for an event that fell outside it was orphaned the same day — no ledger, never due
 *      again, so no matrix leg will ever pick it up and no merged PR will ever close it. #2970's
 *      own event, `jobs-2027-11-05`, is D-413: it does not re-enter the horizon until 2027-09-06.
 *      Closing is SAFE rather than lossy precisely because the pipeline is level-based: when the
 *      event comes back inside the horizon it is `never-assessed` and due again, and the loop
 *      above files a fresh receipt. The same branch covers an event dropped or re-dated out of
 *      the calendar, and a close-out that aged past `closeOutWithinDays`.
 *
 * Pure, and deliberately conservative: an id that is still in `--due` is left ALONE whatever else
 * is true of it — deferral behind the dispatch cap must never read as obsolescence, which is why
 * events.mjs caps AFTER `--due` rather than inside it. An unparseable title is left alone too.
 *
 * THROTTLED, OLDEST FIRST. Each close costs two `gh` mutations (comment, then close) on the same
 * scarce bucket the 2026-08-26 outage exhausted, and the backlog this lands against is 343 issues
 * — 686 mutations on one push. `CLOSES_PER_TICK` drains it over a handful of pushes instead, which
 * costs nothing because the sweep is level-based: whatever it does not close this tick is still
 * open, still reconcilable, and first in line next time. Ascending issue number so the drain order
 * is deterministic and starts with the oldest receipts, the ones that have been lying the longest.
 *
 * @param deps.openEventReceipts  `[{ number, title, hasLedger }]` — every open `event-research`
 *                                issue, with the disk check joined in by `gatherDeps` so this
 *                                stays fixture-drivable.
 * @param deps.dueEventIds        ids `event-scan --due` currently returns.
 * @param deps.closesPerTick      the throttle, injectable so specs can pin it.
 */
export function routeReceipts(deps = {}) {
  const { openEventReceipts = [], dueEventIds = [], closesPerTick = CLOSES_PER_TICK } = deps;
  const due = new Set(dueEventIds);
  const intents = [];
  const oldestFirst = [...openEventReceipts].sort((a, b) => (a?.number ?? 0) - (b?.number ?? 0));
  for (const receipt of oldestFirst) {
    const id = receiptEventId(receipt?.title);
    if (!id) continue;
    const researched = Boolean(receipt.hasLedger);
    if (!researched && due.has(id)) continue;
    intents.push({
      kind: researched ? "close-researched" : "close-obsolete",
      issueNumber: receipt.number,
      title: receipt.title,
      eventId: id,
      body: researched ? researchedBody(id) : obsoleteBody(id),
    });
  }
  if (intents.length <= closesPerTick) return intents;
  console.error(
    `::notice::receipt reconciliation — closing ${closesPerTick} of ${intents.length} resolvable ` +
      `event-research receipts this tick (two gh mutations each); the rest ride the next push.`,
  );
  return intents.slice(0, closesPerTick);
}

function researchedBody(id) {
  return [
    `✅ **Researched** — \`docs/research/events/${id}.md\` is on \`main\`, which is the deliverable this receipt asked for.`,
    "",
    "Closing on the ledger rather than on a `Closes #` link: that link only fires when the research",
    "session happened to know this issue's number, and the sweep that checked for it could only see",
    "the newest 100 open issues. The file on disk is the thing that actually proves the work landed.",
    "",
    "Pulse checks from here are the push-driven sweep's job — they need no open receipt.",
    "",
    "— Moneypenny",
    "",
    FOOTER,
  ].join("\n");
}

function obsoleteBody(id) {
  return [
    `🌅 **Out of scope, not dropped** — \`${id}\` is no longer due for research, and no ledger was ever produced.`,
    "",
    "The usual cause is the research horizon (#2946/#2971): `event-scan --due` skips anything further",
    "out than `assessment-cadence.json`'s `horizon.maxDaysOut`, so this receipt was left with nothing",
    "able to claim it — no matrix leg will dispatch it and no PR will ever close it. An event dropped",
    "or re-dated off the calendar, or a close-out aged past `closeOutWithinDays`, lands here too.",
    "",
    "Nothing is lost by closing: the pipeline is level-based. The day this event comes back inside the",
    "horizon it reads as `never-assessed` and due again, and the sweep files a fresh receipt for it.",
    "",
    "— Moneypenny",
    "",
    FOOTER,
  ].join("\n");
}

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
