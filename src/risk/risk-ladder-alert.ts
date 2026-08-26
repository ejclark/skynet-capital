import type { Alert, AlertPriority } from "../alerts/alert.js";
import type { RiskReading, RiskTier } from "./risk-ladder.js";

/**
 * The risk ladder's WARN, made visible.
 *
 * The soft rung's whole job is to be seen without blocking anything, and a tier field that only
 * ever gets read by another risk check is not "visible" in any sense a member would recognise. So
 * the ladder publishes on the shared alert substrate (`src/alerts/`) like every other signal
 * producer: one line, already human-readable, with the structured numbers alongside it in `data`
 * so a panel renders the rung rather than parsing the prose.
 *
 * Pure: the caller stamps `at` from its own injected clock, which is what keeps specs deterministic.
 */

/** The producer id — a consumer filters the bus on this to get the ladder and nothing else. */
export const RISK_ALERT_SOURCE = "risk-ladder";

/**
 * Loudness per rung. `watch` is a `warning` because that is exactly what it is; both action rungs
 * are `critical` because at each one the system has stopped doing what the member asked.
 */
const PRIORITY: Record<RiskTier, AlertPriority> = {
  clear: "info",
  watch: "warning",
  restricted: "critical",
  liquidate: "critical",
};

/**
 * One line each, stating what the SYSTEM will now do — not an adjective about the account. Losses
 * render honestly but without punishing spectacle (house rule); the fanfare budget goes elsewhere.
 */
const TITLE: Record<RiskTier, string> = {
  clear: "Risk clear — back inside every ladder threshold",
  watch: "Risk watch — drawdown past the soft threshold",
  restricted: "Risk restricted — new risk-increasing orders blocked, exits stay open",
  liquidate: "Risk liquidate — the force-flatten threshold is reached",
};

const asPercent = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

/** Say which way the day went, in words, rather than printing a negative "drawdown". */
function movement(drawdownPct: number): string {
  return drawdownPct >= 0
    ? `Down ${asPercent(drawdownPct)} from the day's opening equity`
    : `Up ${asPercent(-drawdownPct)} on the day`;
}

/**
 * Turn one ladder reading into a publishable alert. Total — every rung has something worth saying,
 * `clear` included, because "the block just lifted" is news the desk needs as much as the block was.
 *
 * Emitting it on every equity tick would be spam; the producer (`SafetyController`) fires this only
 * on a tier CHANGE. `dedupeKey` is the tier for the same reason: a member who waves away the watch
 * rung has dismissed the watch rung, not the restriction that may follow it.
 */
export function riskLadderAlert(reading: RiskReading, at: number): Alert {
  const parts = [movement(reading.drawdownPct)];
  if (reading.crossedAt !== undefined) {
    parts.push(`rung threshold ${asPercent(reading.crossedAt)}`);
  }
  if (reading.nextRung) {
    const headroom = Math.max(0, reading.nextRung.at - reading.drawdownPct);
    parts.push(`${asPercent(headroom)} of headroom before ${reading.nextRung.tier}`);
  }
  return {
    id: `${RISK_ALERT_SOURCE}-${reading.tier}-${at}`,
    at,
    source: RISK_ALERT_SOURCE,
    priority: PRIORITY[reading.tier],
    title: TITLE[reading.tier],
    body: `${parts.join(". ")}.`,
    data: { tier: reading.tier, drawdownPct: reading.drawdownPct },
    dedupeKey: `risk-tier-${reading.tier}`,
  };
}
