// THE EVENT-RESEARCH DISPATCH LANE — opening one issue per never-assessed calendar event, plus the
// per-push dedupe that keeps back-to-back merges from double-researching one. Split out of
// moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { execFileSync } from "node:child_process";
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
const DAILY_BUDGET_FILE = join(process.cwd(), "research-daily-budget.json");

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

/** THE DAILY BUDGET (#2946, second incident). The per-tick ceiling bounds one push's burst, but
 *  "every merge to main is a tick" (moneypenny-events.yml's own header) means merges CHAIN: a
 *  dispatched research PR merging is itself the next tick's trigger. Measured 2026-09-15/16: 116
 *  `docs(research):` commits landed in a rolling 24h window — 14-22/hour for six straight hours —
 *  even with the per-tick cap live, because nothing bounded how many TICKS a day could produce.
 *  The per-tick cap turned one burst into many small ones; it never capped the day.
 *
 *  Counts real merged commits rather than tracking state some other way (a file, a label) because
 *  the merge history IS the ground truth of what was actually dispatched — nothing to get out of
 *  sync. Requires full git history (`fetch-depth: 0`, already set on every checkout in
 *  moneypenny-events.yml) or throws rather than silently reading zero. */
function countRecentResearchCommits({ hours = 24, exec = execFileSync } = {}) {
  const out = exec(
    "git",
    ["log", `--since=${hours} hours ago`, "--pretty=%s", "--", "docs/research/events/"],
    { encoding: "utf8" },
  );
  return out.split("\n").filter((line) => line.startsWith("docs(research):")).length;
}

/** Same fail-closed doctrine as loadDispatchCap: a missing or malformed budget file must never
 *  read as "no daily limit" — that is precisely the shape of the fail-open bug this cap exists to
 *  survive a second time. */
export function loadDailyBudget(file = DAILY_BUDGET_FILE) {
  if (!existsSync(file))
    throw new Error(
      `moneypenny: daily research budget missing at ${file}. Refusing to dispatch with no daily ` +
        "ceiling — see issue #2946. Restore the file rather than removing the ceiling.",
    );
  const cap = JSON.parse(readFileSync(file, "utf8")).maxPerDay;
  if (!Number.isInteger(cap) || cap < 1)
    throw new Error(
      `moneypenny: ${file} maxPerDay must be a positive integer, got ${JSON.stringify(cap)}.`,
    );
  return cap;
}

/** The cap dueForResearch actually spends: never more than the per-tick ceiling, and never more
 *  than what's left of today's budget. Floored at 0 — a day already over budget dispatches
 *  nothing until the rolling window clears, rather than going negative and wrapping around. */
export function effectiveDispatchCap({
  tickCap = loadDispatchCap(),
  dailyCap = loadDailyBudget(),
  dispatchedToday = countRecentResearchCommits(),
} = {}) {
  return Math.max(0, Math.min(tickCap, dailyCap - dispatchedToday));
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
        `dispatched this tick (cap ${cap}, research-dispatch-budget.json + research-daily-budget.json); ` +
        `${deferred} deferred to later ticks, close-outs then highest impact then soonest. Next in ` +
        `line: ${next.id} (${next.impact}).`,
    );
  }
  if (cap === 0 && eligible.length > 0)
    console.error(
      "::notice::daily research budget exhausted (research-daily-budget.json maxPerDay) — " +
        "dispatching nothing this tick; the rolling 24h window will clear on its own.",
    );
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
