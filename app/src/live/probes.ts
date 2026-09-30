/**
 * COND-SCOUT's shadow probes on the bot's Heartbeat (#3651 slice 7b) — mirrors the payload of
 * `GET /api/desk/:id/probes` (`src/server/desk-json-routes.ts`) and the plain words the section
 * says. Every probe is SIMULATED: fills are priced from live quotes and no order is ever sent
 * (Eric, 2026-09-30 — the results stay in the health dashboard). Each verdict is a glyph and a
 * word, never hue alone (`docs/BRAND.md` → Accessibility).
 */

export type ProbeHypothesis = "oversold-rebound" | "trend-continuation";
export type VerdictCall = "unproven" | "edge" | "no edge shown" | "losing";

export interface OpenProbe {
  readonly id: string;
  readonly symbol: string;
  readonly hypothesis: ProbeHypothesis;
  readonly openedAt: number;
  readonly expiresAt: number;
  readonly entryPrice: number;
  readonly stopPrice: number;
  readonly notional: number;
  readonly markRoi?: number;
}

export interface ProbeCheckpoint {
  readonly label: string;
  readonly roi?: number;
  readonly roiPerDay?: number;
}

export interface ProbeRetro {
  readonly probeId: string;
  readonly symbol: string;
  readonly hypothesis: ProbeHypothesis;
  readonly reason: "invalidated" | "horizon";
  readonly closedAt: number;
  readonly daysHeld: number;
  readonly roi: number;
  readonly roiPerDay: number;
  readonly directionRight: boolean;
  readonly soonerWasBetter: boolean;
  readonly earlierExits: readonly ProbeCheckpoint[];
  readonly laterExits: readonly ProbeCheckpoint[];
  readonly market?: { readonly symbol: string; readonly roi: number; readonly excess: number };
}

export interface HypothesisVerdict {
  readonly hypothesis: ProbeHypothesis;
  readonly closes: number;
  readonly winRate: number;
  readonly meanRoi: number;
  readonly band: { readonly ci: { readonly low: number; readonly high: number } | null };
  readonly meanExcessVsMarket?: number;
  readonly outliers: readonly string[];
  readonly call: VerdictCall;
  readonly callWithoutOutliers: VerdictCall;
}

export type DeskProbes =
  | {
      readonly available: true;
      readonly simulated: true;
      readonly at: number;
      readonly open: readonly OpenProbe[];
      readonly retros: readonly ProbeRetro[];
      readonly verdicts: readonly HypothesisVerdict[];
    }
  | { readonly available: false };

export async function fetchDeskProbes(id: string): Promise<DeskProbes> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}/probes`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/desk/${id}/probes → ${res.status}`);
  return (await res.json()) as DeskProbes;
}

export const HYPOTHESIS_WORDS: Record<ProbeHypothesis, string> = {
  "oversold-rebound": "Oversold rebound",
  "trend-continuation": "Trend continuation",
};

/** The call as a glyph and a word — the glyph carries it for a reader who can't tell the hues. */
export const CALL_WORDS: Record<VerdictCall, { readonly glyph: string; readonly word: string }> = {
  unproven: { glyph: "?", word: "Unproven — not enough closes yet" },
  edge: { glyph: "✓", word: "Edge — the whole band is above zero" },
  "no edge shown": { glyph: "○", word: "No edge shown — the band spans zero" },
  losing: { glyph: "✕", word: "Losing — the whole band is below zero" },
};

/** A signed percent with one decimal: +3.2% / −1.0%. Uses a true minus sign. */
export function pct(fraction: number): string {
  const value = (fraction * 100).toFixed(1);
  return fraction < 0 ? `−${value.slice(1)}%` : `+${value}%`;
}

export function daysText(days: number): string {
  if (days < 1) return `${Math.max(1, Math.round(days * 24))}h`;
  return `${days.toFixed(days < 10 ? 1 : 0)}d`;
}

/** The verdict's one-line evidence: closes, win rate, average return and its band. */
export function verdictLine(v: HypothesisVerdict): string {
  const parts = [
    `${v.closes} close${v.closes === 1 ? "" : "s"}`,
    `${Math.round(v.winRate * 100)}% won`,
    `avg ${pct(v.meanRoi)}`,
  ];
  // The band module works in percent (returnPct units), not fractions.
  if (v.band.ci) parts.push(`band ${pct(v.band.ci.low / 100)} to ${pct(v.band.ci.high / 100)}`);
  if (v.meanExcessVsMarket !== undefined) parts.push(`${pct(v.meanExcessVsMarket)} vs SPY`);
  return parts.join(" · ");
}

/** What a close taught, in words: the call, the exit, and what timing would have done. */
export function retroLine(r: ProbeRetro): string {
  const parts = [
    r.directionRight ? "right call" : "wrong call",
    r.reason === "invalidated" ? "stopped out" : "held to horizon",
    `${pct(r.roiPerDay)}/day`,
  ];
  if (r.soonerWasBetter) parts.push("closing sooner paid faster");
  const later = r.laterExits.filter((e) => e.roi !== undefined).at(-1);
  if (later?.roi !== undefined) parts.push(`held ${later.label}: ${pct(later.roi)}`);
  if (r.market) parts.push(`${pct(r.market.excess)} vs SPY`);
  return parts.join(" · ");
}
