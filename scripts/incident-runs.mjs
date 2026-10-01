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
