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
  readonly windows: readonly NetWorthWindowView[];
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
