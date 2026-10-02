import type { WireDevelopmentItem, WireFeedbackItem, WireTrade } from "./wire";

/**
 * ONE FEED, SEVERAL KINDS (#784 slice 3) — the Activity page's own model, and the reason the page
 * stopped being three widgets.
 *
 * Slices 1 and 2 put trade fills and feedback filings on #1211's single `ActivityEvent` envelope,
 * so they are no longer two unrelated data models sharing a screen (Eric, 2026-09-06: trades and
 * feedback "have no fundamental overlap" — true, while they were a ledger join beside a GitHub
 * status poll). This file is what that unification bought: ONE chronological list where each row's
 * shape is chosen by its kind, and the controls narrow the list instead of paging between widgets.
 * `frame.tsx`'s three-word rule names exactly this — a KIND is a filter over one list, a SECTION is
 * a different shape of data — so trades and feedback are kinds here, and Booked P&L (a standing
 * snapshot, never an event) left the section switch for a summary strip.
 *
 * THE THIRD KIND COST A BRANCH (#784 slice 4). A merged pull request joined the list as `is:development`
 * — one entry in `QUALIFIER_KIND`, one branch in `buildActivityFeed`, one row component — and the page's
 * shape did not move. That is the test slices 1–3 were built to pass: the next kind is a filter, never a
 * widget.
 *
 * THE GRAMMAR IS ONE MODEL (the Issues-list template, unchanged since #738): every control on the
 * page writes a token into the same query string the filter box accepts as text. Three groups, and
 * one include-flag:
 *   - `is:trade` · `is:feedback` · `is:development` — the kind facets.
 *   - `is:buy`/`is:sell` and `is:bot`/`is:human` — facets only a TRADE can satisfy, so either one
 *     narrows the feed to trades. A filing has no side and no desk; leaving filings in the list
 *     while "Buys" is pressed would be noise, not honesty, and the kind chip would then disagree
 *     with what is on screen.
 *   - `show:shipped` — the one additive token, carrying the pulse's old Active/All toggle (#1308's
 *     rule, which the league-wide pulse inherited in slice 2). `show:`, not `is:`, because it
 *     WIDENS the list where every `is:` token narrows it; a token that reads as a restriction but
 *     acts as an inclusion is a grammar that lies.
 *
 * Interleaving needs the raw instant, which is why `wire-json-view.ts` now ships `at` beside the
 * formatted `when`: a localized phrase ("3m ago") cannot be sorted against a filing's date.
 *
 * PAGING, DECIDED HERE (the question #784's state block carried into this slice): the feed pages on
 * the TRADE cursor alone (`/api/wire`'s `Link: rel="next"`, walked by "load older trades"), and
 * filings arrive bounded by the same `per_page` with no cursor of their own. Two reasons it is not
 * one unified cursor: the two kinds have wildly different arrival rates (a trading day outruns a
 * month of filings, so a shared cursor would spend a whole page on trades and strand filings), and
 * a filing is a row that MUTATES — its status changes after it is filed — so a keyset page of
 * filings would be a snapshot that disagrees with the next page's statuses. A trade fill is
 * immutable, which is exactly what a keyset cursor wants. The store-level bounded read this leaves
 * on the table (`docs/IDEAS.md`: three full ledgers per request) is measured and routed as its own
 * issue — it is a storage change, not a layout one.
 */

/** One row of the feed. Discriminated on `kind` — the row component is chosen by it, and so is the
 *  haystack a bare search term matches against. */
export type ActivityFeedItem =
  | { readonly key: string; readonly at: string; readonly kind: "trade"; readonly trade: WireTrade }
  | {
      readonly key: string;
      readonly at: string;
      readonly kind: "feedback";
      readonly filing: WireFeedbackItem;
    }
  | {
      readonly key: string;
      readonly at: string;
      readonly kind: "development";
      readonly merge: WireDevelopmentItem;
    };

/** The kinds one list can hold. Named so the qualifier table and the scope checks below can't drift
 *  from the row union above — adding a fourth kind should fail to compile until both are updated. */
export type ActivityKind = ActivityFeedItem["kind"];

/**
 * Both kinds into one list, newest first. The tie-break on `key` is not decoration: two fills can
 * share a millisecond, and a list whose order flips between renders makes a member re-read it.
 *
 * `instant()` is a deploy guard, not paranoia: `at` is a field `/api/wire` GAINED in this slice, so
 * a browser holding the new bundle can reach a server still on the old one for the length of a
 * rolling deploy. Sorting `undefined` would throw inside render and white-screen the whole page; an
 * event with no instant sorts last instead, which is a feed slightly out of order for a minute.
 */
const instant = (at: string | undefined): string => at ?? "";

export function buildActivityFeed(
  trades: readonly WireTrade[],
  filings: readonly WireFeedbackItem[],
  merges: readonly WireDevelopmentItem[] = [],
): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [
    ...trades.map(
      (trade): ActivityFeedItem => ({
        key: trade.key,
        at: instant(trade.at),
        kind: "trade",
        trade,
      }),
    ),
    ...filings.map(
      (filing): ActivityFeedItem => ({
        key: `filing:${filing.issueNumber}`,
        at: instant(filing.at),
        kind: "feedback",
        filing,
      }),
    ),
    // A filing and a merge can share a number (issue #4272 and PR #4272 are different things), so the
    // key is namespaced per kind — one list keyed on the bare number would collide in React's
    // reconciler and drop a real row.
    ...merges.map(
      (merge): ActivityFeedItem => ({
        key: `merge:${merge.pullRequest}`,
        at: instant(merge.at),
        kind: "development",
        merge,
      }),
    ),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at) || a.key.localeCompare(b.key));
}

/** Facets only a trade row can satisfy — see the header for why each one narrows the feed to
 *  trades rather than letting filings ride along beside them. */
const TRADE_ONLY_QUALIFIERS = ["is:buy", "is:sell", "is:bot", "is:human"] as const;
const KIND_QUALIFIERS = ["is:trade", "is:feedback", "is:development"] as const;

export const ACTIVITY_QUALIFIERS = [
  ...KIND_QUALIFIERS,
  ...TRADE_ONLY_QUALIFIERS,
  "show:shipped",
] as const;
export type ActivityQualifier = (typeof ACTIVITY_QUALIFIERS)[number];

/** One per group at a time — picking a sibling replaces it, never stacks a contradiction.
 *  `show:shipped` is in no group: it is a flag, on or off. */
const EXCLUSIVE_GROUPS: readonly (readonly ActivityQualifier[])[] = [
  [...KIND_QUALIFIERS],
  ["is:buy", "is:sell"],
  ["is:bot", "is:human"],
];

/** Which kind each qualifier belongs to. This is what stops a chip STRANDING another one: the
 *  controls row only renders a group whose kind is still in scope, so pressing "Ideas" while "Buys"
 *  is on would otherwise leave `is:buy` in the query with no chip left to clear it — inert, and
 *  removable only by hand-editing the filter box. Turning any chip on drops the other kind's tokens
 *  (see `toggleActivityQualifier`), so what is in the query is always what is on screen. */
const QUALIFIER_KIND: Record<ActivityQualifier, ActivityKind> = {
  "is:trade": "trade",
  "is:buy": "trade",
  "is:sell": "trade",
  "is:bot": "trade",
  "is:human": "trade",
  "is:feedback": "feedback",
  "show:shipped": "feedback",
  // A merge has no facets of its own yet — the kind chip is the whole control. The state block's
  // settled rule for slice 4 holds for whatever one is added next: anything only a merge can satisfy
  // belongs in this table, so turning a chip on can never strand it in the query with no chip to clear it.
  "is:development": "development",
};

export interface ActivityFilter {
  readonly terms: readonly string[];
  readonly qualifiers: readonly ActivityQualifier[];
}

export function parseActivityQuery(query: string): ActivityFilter {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const known = ACTIVITY_QUALIFIERS as readonly string[];
  return {
    terms: tokens.filter((t) => !known.includes(t)),
    qualifiers: tokens.filter((t): t is ActivityQualifier => known.includes(t)),
  };
}

/** Which kind the qualifiers alone allow — "all" when nothing narrows it. Pulled out so the one rule
 *  "a trade-only facet implies the trade kind" lives in a single place. The explicit kind chip wins
 *  over an inferred one, which is what lets a stale `is:buy` lose to a freshly pressed `is:feedback`. */
function allowedKind(qualifiers: readonly ActivityQualifier[]): ActivityKind | "all" {
  const asked = qualifiers.find((q): q is (typeof KIND_QUALIFIERS)[number] =>
    (KIND_QUALIFIERS as readonly string[]).includes(q),
  );
  if (asked) return QUALIFIER_KIND[asked];
  return qualifiers.some((q) => (TRADE_ONLY_QUALIFIERS as readonly string[]).includes(q))
    ? "trade"
    : "all";
}

/** True while rows of `kind` can appear at all — what every control group renders on, so a chip is
 *  never shown for a kind the current filter has already excluded (a "Buys" chip beside a list
 *  narrowed to merges would be a control with nothing to do). */
export function kindInScope(filter: ActivityFilter, kind: ActivityKind): boolean {
  const allowed = allowedKind(filter.qualifiers);
  return allowed === "all" || allowed === kind;
}

/** True while filings can appear at all — what the Filings status toggle renders on. */
export function filingsInScope(filter: ActivityFilter): boolean {
  return kindInScope(filter, "feedback");
}

function matchesTradeFacets(trade: WireTrade, qualifiers: readonly ActivityQualifier[]): boolean {
  for (const qualifier of qualifiers) {
    if (qualifier === "is:buy" && trade.side !== "buy") return false;
    if (qualifier === "is:sell" && trade.side !== "sell") return false;
    if (qualifier === "is:bot" && trade.kind !== "bot") return false;
    if (qualifier === "is:human" && trade.kind !== "human") return false;
  }
  return true;
}

/** What a bare search term matches, per kind: a trade by its symbol or its trader, a filing by its
 *  title or its issue number (so pasting "#4271" finds the row the way pasting "NVDA" does), a merge
 *  by its title, its PR number or the author GitHub named. */
function haystack(item: ActivityFeedItem): string {
  if (item.kind === "trade") return `${item.trade.symbol} ${item.trade.who}`.toLowerCase();
  if (item.kind === "feedback") {
    return `${item.filing.title} #${item.filing.issueNumber}`.toLowerCase();
  }
  return `${item.merge.title} #${item.merge.pullRequest} ${item.merge.author ?? ""}`.toLowerCase();
}

export function matchesActivity(item: ActivityFeedItem, filter: ActivityFilter): boolean {
  const kind = allowedKind(filter.qualifiers);
  if (kind !== "all" && item.kind !== kind) return false;
  if (item.kind === "trade" && !matchesTradeFacets(item.trade, filter.qualifiers)) return false;
  // A shipped filing is a record, not something still moving, so it stays out of the default view —
  // the separation `/app/feedback` has had since #1308, now a token instead of a bespoke toggle
  // beside one widget. A trade is never hidden by this: there is no shipped trade.
  if (
    item.kind === "feedback" &&
    item.filing.statusKey === "shipped" &&
    !filter.qualifiers.includes("show:shipped")
  ) {
    return false;
  }
  const text = haystack(item);
  return filter.terms.every((term) => text.includes(term));
}

/**
 * Chip toggle, two rules. The blotter's exclusive-group rule (picking a sibling replaces it, never
 * stacks a contradiction), plus: turning a chip ON clears every active qualifier belonging to the
 * OTHER kind. Bare search terms are never touched — "NVDA" still means NVDA whichever kind is up.
 */
export function toggleActivityQualifier(query: string, qualifier: ActivityQualifier): string {
  const tokens = query.split(/\s+/).filter(Boolean);
  const active = tokens.some((t) => t.toLowerCase() === qualifier);
  const siblings = EXCLUSIVE_GROUPS.find((group) => group.includes(qualifier)) ?? [qualifier];
  const kept = tokens.filter((t) => !(siblings as readonly string[]).includes(t.toLowerCase()));
  if (active) return kept.join(" ");
  const wanted = QUALIFIER_KIND[qualifier];
  const compatible = kept.filter((t) => {
    const kind = QUALIFIER_KIND[t.toLowerCase() as ActivityQualifier];
    return kind === undefined || kind === wanted;
  });
  return [...compatible, qualifier].join(" ");
}
