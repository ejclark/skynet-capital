/**
 * The Wire's client model (#738 phase 5a) — mirrors `WireView` on the server, plus the feed's own
 * subset of the Issues filter grammar: `is:buy`/`is:sell` split by side, `is:bot`/`is:human` by
 * desk kind, and a bare term matches the symbol or the trader's name. Chips and query text stay
 * ONE model, exactly like the blotter's bar.
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
  readonly icon: string;
  readonly title: string;
  readonly url: string;
  readonly status?: string;
  readonly statusKey?: string;
  readonly meta: string;
}

export interface WireFeed {
  readonly trades: readonly WireTrade[];
  readonly pnl: readonly WirePnl[];
  readonly feedbackEnabled: boolean;
  readonly feedback: readonly WireFeedbackItem[];
}

export async function fetchWire(): Promise<WireFeed> {
  const res = await fetch("/api/wire", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`wire ${res.status}`);
  const body = (await res.json()) as { wire: WireFeed };
  return body.wire;
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

const WIRE_QUALIFIERS = ["is:buy", "is:sell", "is:bot", "is:human"] as const;
type WireQualifier = (typeof WIRE_QUALIFIERS)[number];

/** One side and one kind at a time — picking the sibling replaces, never stacks a contradiction. */
const WIRE_EXCLUSIVE: readonly (readonly WireQualifier[])[] = [
  ["is:buy", "is:sell"],
  ["is:bot", "is:human"],
];

export interface WireFilter {
  readonly terms: readonly string[];
  readonly qualifiers: readonly WireQualifier[];
}

export function parseWireQuery(query: string): WireFilter {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return {
    terms: tokens.filter((t) => !(WIRE_QUALIFIERS as readonly string[]).includes(t)),
    qualifiers: tokens.filter((t): t is WireQualifier =>
      (WIRE_QUALIFIERS as readonly string[]).includes(t),
    ),
  };
}

export function matchesWire(trade: WireTrade, filter: WireFilter): boolean {
  for (const qualifier of filter.qualifiers) {
    if (qualifier === "is:buy" && trade.side !== "buy") return false;
    if (qualifier === "is:sell" && trade.side !== "sell") return false;
    if (qualifier === "is:bot" && trade.kind !== "bot") return false;
    if (qualifier === "is:human" && trade.kind !== "human") return false;
  }
  const haystack = `${trade.symbol} ${trade.who}`.toLowerCase();
  return filter.terms.every((term) => haystack.includes(term));
}

/** Chip toggle with the exclusive-group rule (the blotter's behavior, on the wire's groups). */
export function toggleWireQualifier(query: string, qualifier: WireQualifier): string {
  const tokens = query.split(/\s+/).filter(Boolean);
  const active = tokens.some((t) => t.toLowerCase() === qualifier);
  const siblings = WIRE_EXCLUSIVE.find((group) => group.includes(qualifier)) ?? [qualifier];
  const kept = tokens.filter((t) => !(siblings as readonly string[]).includes(t.toLowerCase()));
  return (active ? kept : [...kept, qualifier]).join(" ");
}
