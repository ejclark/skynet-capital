/**
 * The Accounts page's client model — the JSON twin of `/api/accounts/networth` (the Summary
 * section). Types mirror `src/observatory/networth-json-view.ts` by hand (same contract note as
 * desk.ts: the server formats every value; the browser renders and never re-derives a figure).
 * The payload always carries EVERY account the session owns, plus the "all accounts" aggregate —
 * one fetch serves both the single-account view (pick the row) and the all-accounts view (use the
 * total), so the switcher never triggers a re-fetch.
 */

export type Tone = "pos" | "neg" | "flat";

export interface NetWorthWindowView {
  readonly label: string;
  readonly note: string;
  readonly value: string;
  readonly tone: Tone;
  readonly known: boolean;
  readonly partial?: boolean;
  /** "+2.3 pts vs S&P" (#3689) — absent when either side of the comparison is unknown. */
  readonly vsBenchmark?: string;
  readonly vsBenchmarkTone?: Tone;
}

/** The account's all-time high (#3689). Absent for the aggregate and for an unknown history. */
export interface AllTimeHighView {
  readonly value: string;
  readonly at: string;
  /** The high as a fraction above today's value — 0 at a new high. Places the chart's line. */
  readonly aboveNow: number;
}

export interface NetWorthStatsView {
  readonly value: string;
  readonly valueKnown: boolean;
  readonly dayChange: string;
  readonly dayTone: Tone;
  readonly dayKnown: boolean;
  readonly cash: string;
  readonly cashKnown: boolean;
  readonly positionCount: number;
  /** Cumulative realized P/L — gains/losses actually booked by a sell, distinct from the day move
   *  or any window's return (both mix in the mark on what's still held). "—" when not yet known. */
  readonly bookedPl: string;
  readonly bookedTone: Tone;
  readonly bookedKnown: boolean;
  /** Unrealized P/L — "on paper" in the UI. "—" when unknown. */
  readonly onPaper: string;
  readonly onPaperTone: Tone;
  readonly onPaperKnown: boolean;
  readonly windows: readonly NetWorthWindowView[];
  readonly allTimeHigh?: AllTimeHighView;
  /** "$3,368" — the gain to a new high; absent at a high. */
  readonly toNewHigh?: string;
}

export interface AccountNetWorthView extends NetWorthStatsView {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly error?: string;
}

export interface AccountsNetWorthView {
  readonly generatedAt: string;
  readonly accounts: readonly AccountNetWorthView[];
  readonly total: NetWorthStatsView | null;
}

export async function fetchNetWorth(): Promise<AccountsNetWorthView> {
  const res = await fetch("/api/accounts/networth", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET /api/accounts/networth → ${res.status}`);
  return (await res.json()) as AccountsNetWorthView;
}
