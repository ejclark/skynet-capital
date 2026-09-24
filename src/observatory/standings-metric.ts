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

/** Metrics the field can rank by. All are snapshot-derived; "month" reads the flow-adjusted
 *  1-month return the month-return sync writes onto each snapshot (#3689's league follow-up). */
export type LeaderMetric = "equity" | "pl" | "return" | "realized" | "month";

export const LEADER_METRICS: ReadonlyArray<{ key: LeaderMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "month", label: "1M return" },
  { key: "pl", label: "Unrealized P/L" },
  { key: "return", label: "Return %" },
  { key: "realized", label: "Realized P/L" },
];

/** Parse the `?by=` param, defaulting to equity for anything unrecognized. */
export function parseLeaderMetric(raw: string | null | undefined): LeaderMetric {
  return raw === "pl" || raw === "return" || raw === "realized" || raw === "month" ? raw : "equity";
}

/** Whether this participant has a value for the metric. Only "month" can be missing: the 1-month
 *  return arrives from the broker on the sync's slower cadence, and a brand-new account has none. */
export function metricKnown(snapshot: ParticipantSnapshot, metric: LeaderMetric): boolean {
  if (metric !== "month") return true;
  return typeof snapshot.monthReturnPct === "number" && Number.isFinite(snapshot.monthReturnPct);
}

/** Below every real value: an unknown ranks last, never as a false 0%. */
export const UNKNOWN_RANK = -1e9;

/** What the ladder sorts by: the metric's value, or last place when it's unknown. */
export function rankValue(snapshot: ParticipantSnapshot, metric: LeaderMetric): number {
  return metricKnown(snapshot, metric) ? metricValue(snapshot, metric) : UNKNOWN_RANK;
}

/** The row's label: the formatted value, or "—" when the metric is unknown for this participant. */
export function metricText(snapshot: ParticipantSnapshot, metric: LeaderMetric): string {
  return metricKnown(snapshot, metric) ? formatMetric(metricValue(snapshot, metric), metric) : "—";
}

export function metricValue(snapshot: ParticipantSnapshot, metric: LeaderMetric): number {
  const pl = participantUnrealized(snapshot);
  if (metric === "pl") return pl;
  if (metric === "realized") return snapshot.realizedPl ?? 0;
  if (metric === "month") return snapshot.monthReturnPct ?? 0;
  if (metric === "return") {
    const invested = participantInvested(snapshot);
    return invested > 0 ? (pl / invested) * 100 : 0;
  }
  return snapshot.equity;
}

export function formatMetric(value: number, metric: LeaderMetric): string {
  if (metric === "return" || metric === "month")
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  if (metric === "pl" || metric === "realized") return formatSigned(value);
  return formatCurrency(value);
}

/** The human label for the selected metric (the ladder footer's "ranked by …"). */
export function metricLabel(metric: LeaderMetric): string {
  return LEADER_METRICS.find((m) => m.key === metric)?.label ?? "Equity";
}
