import type { WireFeedbackItem, WireTrade } from "./wire";

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
 * THE GRAMMAR IS ONE MODEL (the Issues-list template, unchanged since #738): every control on the
 * page writes a token into the same query string the filter box accepts as text. Three groups, and
 * one include-flag:
 *   - `is:trade` · `is:feedback` — the kind facets this slice adds.
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
    };

/**
 * Both kinds into one list, newest first. The tie-break on `key` is not decoration: two fills can
 * share a millisecond, and a list whose order flips between renders makes a member re-read it.
 */
export function buildActivityFeed(
  trades: readonly WireTrade[],
  filings: readonly WireFeedbackItem[],
): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [
    ...trades.map(
      (trade): ActivityFeedItem => ({ key: trade.key, at: trade.at, kind: "trade", trade }),
    ),
    ...filings.map(
      (filing): ActivityFeedItem => ({
        key: `filing:${filing.issueNumber}`,
        at: filing.at,
        kind: "feedback",
        filing,
      }),
    ),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at) || a.key.localeCompare(b.key));
}

/** Facets only a trade row can satisfy — see the header for why each one narrows the feed to
 *  trades rather than letting filings ride along beside them. */
const TRADE_ONLY_QUALIFIERS = ["is:buy", "is:sell", "is:bot", "is:human"] as const;
const KIND_QUALIFIERS = ["is:trade", "is:feedback"] as const;

export const ACTIVITY_QUALIFIERS = [
  ...KIND_QUALIFIERS,
  ...TRADE_ONLY_QUALIFIERS,
  "show:shipped",
] as const;
export type ActivityQualifier = (typeof ACTIVITY_QUALIFIERS)[number];

/** One per group at a time — picking a sibling replaces it, never stacks a contradiction.
 *  `show:shipped` is in no group: it is a flag, on or off. */
const EXCLUSIVE_GROUPS: readonly (readonly ActivityQualifier[])[] = [
  ["is:trade", "is:feedback"],
  ["is:buy", "is:sell"],
  ["is:bot", "is:human"],
];

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

/** Which kind the qualifiers alone allow — "both" when nothing narrows it. Pulled out so the one
 *  rule "a trade-only facet implies the trade kind" lives in a single place. */
function allowedKind(qualifiers: readonly ActivityQualifier[]): "trade" | "feedback" | "both" {
  if (qualifiers.includes("is:feedback")) return "feedback";
  if (qualifiers.includes("is:trade")) return "trade";
  return qualifiers.some((q) => (TRADE_ONLY_QUALIFIERS as readonly string[]).includes(q))
    ? "trade"
    : "both";
}

/** True while filings can appear at all — what the Filings status toggle renders on, so a control
 *  is never shown for a kind the current filter has already excluded. */
export function filingsInScope(filter: ActivityFilter): boolean {
  return allowedKind(filter.qualifiers) !== "trade";
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
 *  title or its issue number (so pasting "#4271" finds the row the way pasting "NVDA" does). */
function haystack(item: ActivityFeedItem): string {
  return item.kind === "trade"
    ? `${item.trade.symbol} ${item.trade.who}`.toLowerCase()
    : `${item.filing.title} #${item.filing.issueNumber}`.toLowerCase();
}

export function matchesActivity(item: ActivityFeedItem, filter: ActivityFilter): boolean {
  const kind = allowedKind(filter.qualifiers);
  if (kind !== "both" && item.kind !== kind) return false;
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

/** Chip toggle with the exclusive-group rule (the blotter's behavior, on this page's groups). */
export function toggleActivityQualifier(query: string, qualifier: ActivityQualifier): string {
  const tokens = query.split(/\s+/).filter(Boolean);
  const active = tokens.some((t) => t.toLowerCase() === qualifier);
  const siblings = EXCLUSIVE_GROUPS.find((group) => group.includes(qualifier)) ?? [qualifier];
  const kept = tokens.filter((t) => !(siblings as readonly string[]).includes(t.toLowerCase()));
  return (active ? kept : [...kept, qualifier]).join(" ");
}
