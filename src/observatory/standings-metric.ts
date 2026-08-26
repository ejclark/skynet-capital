import { participantInvested, participantUnrealized } from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { formatCurrency, formatSigned } from "./render-atoms.js";

/**
 * The ranked metric behind Standings' field ladder — parsing, valuing and formatting, in one place.
 *
 * Split out of `standings-view.ts` so the LIVE PATCH producer (`standings-patch.ts`) computes a
 * row's value and label with the identical code the server-rendered page used. A second copy in the
 * patch path would drift, and the drift would show up as a number that changes meaning the moment
 * the page starts updating itself — the exact class of dishonesty the board must not have.
 */

/** Metrics the field can rank by — all snapshot-derived (no history needed). */
export type LeaderMetric = "equity" | "pl" | "return" | "realized";

export const LEADER_METRICS: ReadonlyArray<{ key: LeaderMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "pl", label: "Unrealized P/L" },
  { key: "return", label: "Return %" },
  { key: "realized", label: "Realized P/L" },
];

/** Parse the `?by=` param, defaulting to equity for anything unrecognized. */
export function parseLeaderMetric(raw: string | null | undefined): LeaderMetric {
  return raw === "pl" || raw === "return" || raw === "realized" ? raw : "equity";
}

export function metricValue(snapshot: ParticipantSnapshot, metric: LeaderMetric): number {
  const pl = participantUnrealized(snapshot);
  if (metric === "pl") return pl;
  if (metric === "realized") return snapshot.realizedPl ?? 0;
  if (metric === "return") {
    const invested = participantInvested(snapshot);
    return invested > 0 ? (pl / invested) * 100 : 0;
  }
  return snapshot.equity;
}

export function formatMetric(value: number, metric: LeaderMetric): string {
  if (metric === "return") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  if (metric === "pl" || metric === "realized") return formatSigned(value);
  return formatCurrency(value);
}

/** The human label for the selected metric (the ladder footer's "ranked by …"). */
export function metricLabel(metric: LeaderMetric): string {
  return LEADER_METRICS.find((m) => m.key === metric)?.label ?? "Equity";
}
