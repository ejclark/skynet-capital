/**
 * PLAYBOOK TRADE METRICS' client model (#3665) — mirrors `PlaybookPerformanceView` in
 * `src/server/playbook-performance.ts` and the slice of `PlaybookStats` (`src/trading/trade-
 * stats.ts`) the cards render. The server computes every number and owns the scope: `?accounts=`
 * can only narrow the viewer's own accounts, so the client never decides whose trips count.
 */

export interface PlaybookMetricsView {
  readonly playbookId: string;
  readonly trades: number;
  readonly wins: number;
  readonly losses: number;
  /** Null with no decided trades — never a 0% win rate. */
  readonly winRate: number | null;
  readonly netRealized: number;
  /** Capital-weighted: netRealized ÷ capitalCommitted. Null with nothing committed. */
  readonly returnPct: number | null;
  readonly capitalCommitted: number;
  readonly avgHoldMs: number | null;
  readonly longestHold: { readonly holdMs: number } | null;
  readonly shortestHold: { readonly holdMs: number } | null;
  readonly byDirection: { readonly long: number; readonly short: number };
  readonly byInstrument: { readonly stock: number; readonly call: number; readonly put: number };
  /** Option trips only, by the cycle they expired on (#3665 slice 5). These never sum to `trades`
   *  on a playbook that also trades stock — shares have no expiration cycle. */
  readonly byCycle: {
    readonly weekly: number;
    readonly monthly: number;
    readonly quarterly: number;
  };
}

/** Who started a bot's trade (#4450 slice 4) — mirrors `src/trading/initiator.ts`. */
export type Initiator = "playbook" | "forced" | "persona";

/** The slice of `InitiatorStats` (`src/trading/trade-stats.ts`) the split renders. */
export interface InitiatorRowView {
  readonly initiator: Initiator;
  readonly trades: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number | null;
  readonly netRealized: number;
}

export interface InitiatorSplitView {
  /** Always all three initiators — a zero is a row reading 0, never a missing row. */
  readonly rows: readonly InitiatorRowView[];
  /** Bot trips no recorded decision accounts for — counted, never folded into a row. */
  readonly untraced: number;
}

/** One stage count per step of a playbook's funnel (#4450 slice 5a) — mirrors
 *  `PlaybookFunnelCounts` in `src/autonomous/playbook-funnel.ts`. */
export interface PlaybookFunnelCountsView {
  readonly checks: number;
  readonly asked: number;
  readonly refused: number;
  readonly placed: number;
  readonly filled: number;
}

/** One house playbook's funnel over the window — mirrors `PlaybookFunnelJsonRow` in
 *  `src/server/playbook-performance.ts`. */
export interface PlaybookFunnelRowView {
  readonly playbookId: string;
  readonly totals: PlaybookFunnelCountsView;
  readonly days: readonly (PlaybookFunnelCountsView & { readonly date: string })[];
  /** Sessions on which it asked to trade at least once. */
  readonly askedOn: number;
  /** Guard refusals in words, the most frequent first. */
  readonly refusals: readonly { readonly label: string; readonly count: number }[];
}

export interface PlaybookFunnelJsonView {
  /** The window's sessions, oldest first. */
  readonly sessions: readonly string[];
  /** Only house playbooks a bot checked or asked for in the window. */
  readonly playbooks: readonly PlaybookFunnelRowView[];
}

export interface PlaybookPerformanceView {
  readonly house: readonly PlaybookMetricsView[];
  /** Null when none of the requested accounts is readable — an absence, not zero trades. */
  readonly mine: readonly PlaybookMetricsView[] | null;
  readonly accounts: readonly string[];
  /** Bot accounts only, the same two groupings kept apart; `mine` is null with no bot account in
   *  scope. Null as a whole where the server cannot trace trips to decisions — then nothing draws. */
  readonly byInitiator?: {
    readonly house: InitiatorSplitView;
    readonly mine: InitiatorSplitView | null;
  } | null;
  /** Every bot pooled per house playbook, last ten sessions (#4450 slice 5a). Null where the
   *  server has no decision store wired — then no card draws a funnel. */
  readonly funnel?: PlaybookFunnelJsonView | null;
}

/** With no account (catalog-only), `mine` covers every owned account — callers render only `house`. */
export async function fetchPlaybookPerformance(account?: string): Promise<PlaybookPerformanceView> {
  const query = account ? `?accounts=${encodeURIComponent(account)}` : "";
  const res = await fetch(`/api/outpost/performance${query}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`playbook-performance ${res.status}`);
  return (await res.json()) as PlaybookPerformanceView;
}
