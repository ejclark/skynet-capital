/**
 * Activity's client model (#738 phase 5a) — mirrors `WireView` on the server: the two kinds of the
 * page's one feed, plus the standing P&L snapshot, plus the two fetches that get them.
 *
 * The filter grammar that used to live here moved to `activity-feed.ts` with the one-feed model
 * (#784 slice 3), because it now narrows a list of two kinds rather than a list of trades. This
 * file stays the transport and the types — it is also what the options ticket's who-else-traded row
 * imports, and that row wants trades alone, no grammar.
 */

/** "Why did that trade fire?" — absent for a human trade, or a bot trade whose decision wasn't
 *  found (predates the audit trail, or the store is unwired). Never a fabricated placeholder. */
export interface WireTradeReasoning {
  readonly reason: string;
  readonly strategy?: string;
  readonly expectation?: string;
  /** Set only when the risk guards resized the persona's raw ask before it reached the broker. */
  readonly guardDelta?: string;
}

/** One system-vitals budget-bar gauge (`docs/plans/where-are-we-documenting-*.md` PR 6) — a word,
 *  a number, and (only when `measured`) a bar fraction. Hue never carries meaning alone
 *  (`docs/BRAND.md` → Accessibility): the word/number ride with every bar. */
export interface VitalGauge {
  readonly label: string;
  readonly measured: boolean;
  readonly fraction?: number;
  readonly valueText: string;
  readonly detailText?: string;
}

export interface WireTradeVitals {
  readonly lossHeadroom: VitalGauge;
  readonly edgeVsHold: VitalGauge;
  readonly proof: VitalGauge;
  readonly breadth: VitalGauge;
}

export interface WireTrade {
  readonly key: string;
  readonly side: "buy" | "sell";
  readonly symbol: string;
  readonly quantity: number;
  readonly price: string;
  readonly who: string;
  readonly whoId: string;
  readonly kind: "human" | "bot";
  readonly reconstructed: boolean;
  readonly when: string;
  /** The raw ISO instant behind `when` — what the one feed sorts both kinds on. */
  readonly at: string;
  readonly reasoning?: WireTradeReasoning;
  readonly vitals?: WireTradeVitals;
}

export interface WirePnl {
  readonly who: string;
  readonly whoId: string;
  readonly kind: "human" | "bot";
  readonly realized: string;
  readonly tone: "pos" | "neg" | "flat";
}

export interface WireFeedbackItem {
  /** Keys the filing's in-app comments (`/api/feedback/comments`, issue #2224 shape 3). */
  readonly issueNumber: number;
  readonly icon: string;
  /** The icon's word ("Bug", "Feature", "Idea", else "Filing") — the row's leading token. */
  readonly kindLabel: string;
  readonly title: string;
  readonly url: string;
  readonly status?: string;
  readonly statusKey?: string;
  readonly meta: string;
  /** The filing instant, raw — the trade row's `at` twin. */
  readonly at: string;
}

export interface WireFeed {
  readonly trades: readonly WireTrade[];
  readonly pnl: readonly WirePnl[];
  readonly feedbackEnabled: boolean;
  readonly feedback: readonly WireFeedbackItem[];
  /** Present only when the trade page was full — the `before` cursor for the next `/api/wire`
   *  request, read off the server's `Link: rel="next"` header (GitHub's own pagination
   *  convention, `src/server/pagination.ts`). Absent means there are no older trades to fetch. */
  readonly nextCursor?: string;
}

/** `Link: <path?before=X>; rel="next"` → `X` — the one place this app parses that header, so a
 *  caller never has to know its shape. Absent header, or no `rel="next"` entry, means the page
 *  was short (no older rows exist). */
function parseNextCursor(res: Response): string | undefined {
  const link = res.headers.get("link");
  if (!link) return undefined;
  const match = /<[^>]*[?&]before=([^&>]+)[^>]*>\s*;\s*rel="next"/.exec(link);
  const cursor = match?.[1];
  return cursor ? decodeURIComponent(cursor) : undefined;
}

/** `before`, when given, asks for the page of trades strictly older than that cursor — the
 *  Activity feed's "load older trades" control (#3187) uses this to walk back past the default
 *  30-row page instead of stopping at whatever fit on the first fetch. */
export async function fetchWire(before?: string): Promise<WireFeed> {
  const qs = before ? `?before=${encodeURIComponent(before)}` : "";
  const res = await fetch(`/api/wire${qs}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`wire ${res.status}`);
  const body = (await res.json()) as { wire: WireFeed };
  const nextCursor = parseNextCursor(res);
  return { ...body.wire, ...(nextCursor ? { nextCursor } : {}) };
}

/** The options ticket's "who else traded this" row (#2017 Phase 1 slice 12) — the SAME feed,
 *  scoped server-side to one underlying before the 60-row cap (`wire-routes.ts`'s `serveWireJson`).
 *  A thin sibling to `fetchWire`, not a variant of it: this never touches the query-filter grammar
 *  above, which is client-side filtering over the full feed for the Activity page. */
export async function fetchWireForSymbol(symbol: string): Promise<WireFeed> {
  const res = await fetch(`/api/wire?symbol=${encodeURIComponent(symbol)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`wire ${res.status}`);
  const body = (await res.json()) as { wire: WireFeed };
  return body.wire;
}
