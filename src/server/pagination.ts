/**
 * The house's `per_page`/cursor contract for JSON feeds that keep growing without bound
 * (`docs/plans/where-are-we-documenting-*.md` PR 5 / issue #2287) — GitHub's own pagination
 * defaults, per Eric's call ("use github defaults/limits... default 30, option to increase to 50
 * and 100"), not invented from scratch. Replaces four hardcoded caps that each guessed a different
 * answer to the same "how much of a growing feed to show" question: `decision-json-view.ts`'s
 * `CYCLE_CAP = 50`, `desk-json-view.ts`'s `ACTIVITY_CAP = 80`, `wire-routes.ts`'s bare `60`, and
 * its feedback-status fetch's `.slice(0, 40)`.
 *
 * `paginateDesc`'s exclusive-boundary keyset semantics mirror the two paginated reads already in
 * this codebase — `activity-backfill.ts`'s broker-paging loop (`until` is exclusive; the next
 * page's cursor is the last row's own field value) and `decision-db.ts`'s `listByPersona`
 * (`beforeAt`, strictly less than) — rather than inventing a third convention.
 */

export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;
/** The two step-ups a caller may explicitly ask for beyond the default, for anyone wiring a
 *  "load more" control. The clamp in `resolvePageSize` accepts any positive integer regardless —
 *  this is documentation of the sanctioned values, not an enforced enum. */
export const PAGE_SIZE_OPTIONS = [DEFAULT_PAGE_SIZE, 50, MAX_PAGE_SIZE] as const;

/**
 * Parses a `per_page` query value. Absent, non-numeric, or non-positive falls back to the
 * default; anything above the ceiling clamps to it — never a 400, matching `/wire`'s existing
 * `?symbol=` posture of silently normalizing a bad param rather than rejecting the whole page.
 */
export function resolvePageSize(raw: string | null | undefined): number {
  const n = raw == null ? Number.NaN : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

export interface Page<T, K extends string | number> {
  readonly items: readonly T[];
  /** The value to send back as the next page's `before` — present only when this page was FULL
   *  (a short page means nothing more exists, so a cursor here would be a lie a caller could poll
   *  forever against). */
  readonly nextCursor?: K;
}

/**
 * Keyset-paginates an array that is ALREADY sorted newest-first by `sortKey`, with an exclusive
 * `before` boundary (strictly older than, never `<=` — so the boundary row is never repeated on
 * the next page). The cast below is the one generic-comparison escape hatch: `K` is a single
 * concrete type per call site (always `number` for epoch millis, always `string` for an ISO
 * timestamp), so the comparison is sound even though TS can't see that through the generic.
 */
export function paginateDesc<T, K extends string | number>(
  sortedDesc: readonly T[],
  sortKey: (item: T) => K,
  opts: { readonly limit: number; readonly before?: K },
): Page<T, K> {
  const source =
    opts.before === undefined
      ? sortedDesc
      : sortedDesc.filter(
          (item) => (sortKey(item) as string | number) < (opts.before as string | number),
        );
  const items = source.slice(0, opts.limit);
  const last = items.at(-1);
  return {
    items,
    ...(items.length === opts.limit && last !== undefined ? { nextCursor: sortKey(last) } : {}),
  };
}

/**
 * `Link: <url>; rel="next"` — GitHub's own pagination convention, borrowed verbatim since Eric's
 * call was to follow GitHub's defaults/limits rather than invent a bespoke cursor format. No prior
 * `Link`-header helper exists in this codebase; every route otherwise inlines its own
 * `res.writeHead` header object, so this is deliberately the one new header-shaping seam.
 *
 * `requestUrl` may be relative (a bare `req.url`, e.g. `/api/wire?symbol=NVDA`) — resolved against
 * a fixed local origin purely to get a `URLSearchParams` to mutate; the origin is stripped back
 * off before returning, since the header must name a path, never this process's own internal
 * placeholder host.
 */
export function nextLinkHeader(
  requestUrl: string,
  params: Readonly<Record<string, string>>,
): string {
  const url = new URL(requestUrl, "http://localhost");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return `<${url.pathname}${url.search}>; rel="next"`;
}
