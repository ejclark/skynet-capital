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
  //
  // `forward-test-due` (#2884) deliberately stays in the SECOND group with everything else: the
  // row it wants scored has already settled, so waiting a tick costs nothing and it must never be
  // able to evict a close-out, which is the one class the cap destroys rather than delays. Its
  // `daysUntil` is negative (the event has passed), so inside its impact tier the longest-orphaned
  // row is served first — the same earliest-first instinct, for free.
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
  return [...intents, ...routeReceipts(deps), ...routeShipped(deps)];
}

/** `[event-research] <event-id>` — the receipt title this lane writes and reads back. */
export const RECEIPT_TITLE_RE = /^\[event-research\] (.+)$/;

/* HOW MANY RECEIPTS ONE TICK MAY CLOSE. A different axis from the dispatch ceiling next door:
 * that one bounds SPEND (opus sessions), this one bounds WRITE RATE. The reconcile below found 199
 * open receipts on its first real run, 55 dormant and 144 already researched — closing them in one
 * push is ~199 mutating `gh` calls in a few seconds, which is what GitHub's secondary rate limits
 * exist to refuse. Draining 20 a tick clears that backlog over a normal day of pushes and then
 * costs nothing, because the steady state is a handful. Deliberately a constant and not a budget
 * file: this is a rate GitHub sets, not a policy Eric tunes. */
const RECONCILE_CAP = 20;

/**
 * THE OTHER HALF OF THE LOOP — closing a receipt whose work will never arrive.
 *
 * `routeSweep` opens one receipt issue per never-assessed event. Until now the ONLY thing that
 * could close one was `close-shipped`, which needs a merged PR linked to the issue. That leaves two
 * whole classes permanently open, and on 2026-09-18 both were: 199 open `[event-research]` issues,
 * 0 of them actually live.
 *
 * (1) DORMANT — 55 issues. #2971 bounded the calendar with a research horizon on 2026-09-15 at
 * 14:16Z; #2968's receipt for `ism-services-2027-05-05` (D-229) had been filed at 13:56Z, twenty
 * minutes earlier. From the next push on, the event was `beyond-horizon`, so `--due` stopped
 * listing it, so `moneypenny-events.yml`'s matrix never dispatched a leg, so no ledger was ever
 * written, so nothing could close it — a stall the stall audit correctly flagged and no lane could
 * resolve, because there was no failure to repair. The horizon is not the only door out of `--due`
 * (an event dropped from the calendar, or one that passed unresearched and aged out of
 * `closeOutWithinDays`, leave the same way) — they all land here.
 *
 * (2) RESEARCHED — 144 issues whose ledger is on `main` but whose PR carried no `Closes #` link, so
 * the reference oracle had nothing to read. THE LEDGER IS THE RIGHT ORACLE FOR THIS LABEL and
 * always was: `docs/research/events/<id>.md` existing IS the definition of done here, it is what
 * `gatherAuditDeps` already reads to decide a receipt is unclaimed, and unlike a PR link it cannot
 * be forgotten by a session. Reading it also costs nothing, where the reference sweep costs the
 * scarce GraphQL bucket.
 *
 * WHAT IT DELIBERATELY WILL NOT CLOSE: a receipt with no ledger whose event is still in `--due`.
 * That one is genuinely outstanding — including when it is merely DEFERRED behind the dispatch
 * ceiling, which is exactly why that cap lives in `dueForResearch` and not in `--due` (see this
 * file's header). The stall audit owns that case; this pass must never race it.
 *
 * Pure: the caller resolves `hasLedger` per receipt in `gatherDeps`, so every branch is
 * fixture-drivable with no disk.
 *
 * @param deps { openEventReceipts: [{ number, title, hasLedger }], dueEvents, reconcileCap? }
 */
export function routeReceipts(deps = {}) {
  const { openEventReceipts = [], dueEvents = [], reconcileCap = RECONCILE_CAP } = deps;
  const due = new Set(dueEvents.map((e) => e.id));
  const stale = [];
  for (const r of openEventReceipts) {
    const id = String(r.title ?? "").match(RECEIPT_TITLE_RE)?.[1];
    if (!id) continue;
    if (!r.hasLedger && due.has(id)) continue;
    stale.push({ ...r, id, why: r.hasLedger ? "researched" : "dormant" });
  }
  // Oldest first: a receipt that has been open longest is the one whose silence has cost the most,
  // and REST hands these back newest-first, which would drain in exactly the wrong order.
  stale.sort((a, b) => a.number - b.number);
  const batch = stale.slice(0, reconcileCap);
  if (stale.length > batch.length) {
    // stderr only — stdout is the matrix JSON, same rule as the dispatch ceiling's notice.
    console.error(
      `::notice::receipt reconcile — closing ${batch.length} of ${stale.length} terminal ` +
        `[event-research] receipt(s) this tick (cap ${reconcileCap}); the rest drain on later ` +
        "pushes, oldest first.",
    );
  }
  return batch.map((r) => ({
    kind: "close-receipt",
    issueNumber: r.number,
    title: r.title,
    why: r.why,
    closeReason: r.why === "researched" ? "completed" : "not planned",
    body: receiptCloseBody(r),
  }));
}

function receiptCloseBody(r) {
  const preamble =
    r.why === "researched"
      ? [
          `📄 **Researched** — \`docs/research/events/${r.id}.md\` is on \`main\`, so this receipt is done.`,
          "",
          "Closed against the LEDGER rather than a `Closes #` link: a research PR does not always",
          "carry one, and the reference oracle that used to be the only way out left 144 finished",
          "receipts open. The ledger cannot be forgotten by a session; the link can.",
        ]
      : [
          `🌙 **Dormant** — \`${r.id}\` is no longer in \`node scripts/event-scan.mjs --due\` and has no`,
          "ledger, so no lane will ever pick this receipt up. Usually that means the event is now",
          "beyond the research horizon (`assessment-cadence.json`, #2946/#2971) — it is still on the",
          "calendar and still tracked, it just stops buying sessions until it comes inside. It can",
          "also mean the event left the calendar, or passed unresearched and aged out of its",
          "close-out window.",
          "",
          `Nothing is lost: **a fresh receipt opens automatically** the next push after \`${r.id}\``,
          "is due again. Run `node scripts/event-scan.mjs | grep " +
            r.id +
            "` for its current verdict.",
        ];
  return [...preamble, "", FOOTER].join("\n");
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
