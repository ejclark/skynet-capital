// The paging half of incident-scan.mjs, split out so it can be specced without a network.
//
// WHY THIS EXISTS (docs/LESSONS.md, 2026-10-01 — the `allowed_bots` retro, #4242): the scan read
// ONE page of 50 failed runs and called it the 14-day window. On 2026-10-01 GitHub reported 499
// failed runs on `main` in that window; the page reached back ~33 hours. The 76-run `build-events`
// outage of 2026-09-25 never appeared in any scan, so the learning Coach — whose whole job is
// detection lag — was blind to the largest incident of the fortnight. A window that silently
// truncates is the exact failure class this eye exists to catch.
//
// Each page is one REST *core* request (never GraphQL). MAX_PAGES bounds the cost; if the window
// holds more than that, `truncated` says so instead of pretending the list is whole.

export const PER_PAGE = 100;
export const MAX_PAGES = 10;

/**
 * Every failed run the API will list, newest first, up to `maxPages` pages.
 * `fetchPage(page)` resolves to the raw `/actions/runs` body ({ total_count, workflow_runs }).
 * Returns { runs, total, truncated } — `truncated` is true when `total` exceeds what was read.
 */
export async function readAllPages(fetchPage, { perPage = PER_PAGE, maxPages = MAX_PAGES } = {}) {
  const runs = [];
  let total = 0;
  for (let page = 1; page <= maxPages; page++) {
    const body = await fetchPage(page);
    total = body.total_count ?? 0;
    const batch = body.workflow_runs ?? [];
    runs.push(...batch);
    if (batch.length < perPage || runs.length >= total) break;
  }
  return { runs, total, truncated: total > runs.length };
}

// ── the aged-out band (#5728) ─────────────────────────────────────────────────
//
// WHY: the scan reads a 14-day window, so an incident nobody learned from used to leave the count
// the day it turned 15 — on 2026-10-18 the number fell 18 → 14 overnight with zero LESSONS commits,
// which reads as learning and is only expiry. The scan now also reads the band just past the window
// and names what aged out unlearned, so the drop is visible as expiry the day it happens.
//
// Why ONE more window and not all of history (measured 2026-10-18): the band just past 14d held 6
// unlearned shas behind 499 failed runs (5 pages); reaching back 90d held 69, each needing its own
// zero-job lookup — on the path every `ship.sh` run traverses. One band is the cheapest read that
// makes the expiry visible; it is report-only, never in the budget, so an old fault can never turn
// a gate red.

const DAY_MS = 86_400_000;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * The window's `since` day and the aged-out band just before it, as GitHub `created` qualifiers:
 * the window is `>=since`, the band is the `days` days before `since`, inclusive at both ends.
 */
export function windowRanges(days, now = Date.now()) {
  const since = isoDay(now - days * DAY_MS);
  return {
    since,
    window: `>=${since}`,
    agedOut: `${isoDay(now - 2 * days * DAY_MS)}..${isoDay(now - (days + 1) * DAY_MS)}`,
  };
}

/**
 * The aged-out band's incidents still worth naming: one per sha (newest run first, as listed),
 * minus any sha the window already reports, minus any the ledger names. The zero-job phantom check
 * runs on what is left, so its per-run cost is paid only for the handful that could be reported.
 *
 * @param runs runs from the band, as incident-scan.mjs maps them (`sha` already 7 chars)
 * @param p.windowShas shas the in-window scan already saw
 * @param p.isLearned the ledger test (`learnedIn`)
 */
export function agedOutCandidates(runs, { windowShas = new Set(), isLearned = () => false } = {}) {
  const bySha = new Map();
  for (const run of runs) if (run.sha && !bySha.has(run.sha)) bySha.set(run.sha, run);
  return [...bySha.values()].filter((r) => !(windowShas.has(r.sha) || isLearned(r.sha)));
}
