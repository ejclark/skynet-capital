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
  return [...intents, ...routeShipped(deps)];
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
