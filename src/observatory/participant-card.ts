import { costBasis, type ParticipantSnapshot, unrealizedPl } from "./participant-snapshot.js";

/**
 * A participant's open-position metrics — unrealized P/L, invested value, cost basis and return —
 * read by the standings, the desk JSON and the net-worth API. The card these once fed went with the
 * classic surface (#827) and was deleted in #4201; only the numbers stayed live.
 */

export function participantUnrealized(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + unrealizedPl(p), 0);
}

export function participantInvested(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + p.marketValue, 0);
}

/** What the open positions cost to open — each position's basis taken unsigned, so a written
 *  option (whose basis is the premium collected, signed negative) adds to the base instead of
 *  cancelling a long against it. */
export function participantCostBasis(snapshot: ParticipantSnapshot): number {
  return snapshot.positions.reduce((sum, p) => sum + Math.abs(costBasis(p)), 0);
}

/**
 * The open positions' return (#5212): unrealized P/L as a percent of what those positions cost —
 * 0 when nothing is open. It is NOT the account's return: cash, closed trades and deposits are all
 * outside it, so every place that shows it labels it "Open-position return". Measured on cost, the
 * way the desk prints a position's return, not on today's market value (which read a position down
 * 50% as down 100%).
 */
export function participantReturnPct(snapshot: ParticipantSnapshot): number {
  const basis = participantCostBasis(snapshot);
  return basis > 0 ? (participantUnrealized(snapshot) / basis) * 100 : 0;
}
