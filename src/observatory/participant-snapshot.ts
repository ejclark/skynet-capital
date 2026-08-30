import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { fin } from "../domain/finite.js";
import type { Participant } from "../participants/participant.js";
import { type PositionView, positionsFrom } from "./broker-positions.js";

/** A single holding as shown on the dashboard — defined in `broker-positions.ts`, re-exported here
 *  because this module is where every view already reaches for the account's shapes. */
export type { PositionView };

/** The guard lives in `src/domain/finite.ts`, shared with the options greek math; re-exported here
 *  because this module is where every view already reaches for the account's shapes. */
export { fin };

/** A position's unrealized P/L — market value minus cost basis (quantity × average price). The one
 *  place this arithmetic lives; both the dashboard cards and the world projection read from here. */
export function unrealizedPl(position: PositionView): number {
  return fin(position.marketValue) - fin(position.quantity) * fin(position.avgPrice);
}

/** A position's cost basis — what was actually paid for what's held. */
export function costBasis(position: PositionView): number {
  return fin(position.quantity) * fin(position.avgPrice);
}

/**
 * Today's move on a position: market value against yesterday's close when the broker gave us one,
 * against cost when it didn't (a position with no yesterday — opened this session — has only its
 * entry to move from). Derived from the live market value rather than the broker's own intraday
 * fields so it keeps updating as price events fold through the reducer instead of going stale.
 * `pct` is null (never 0) when the base is unmeasurable.
 */
export function dayPl(position: PositionView): { amount: number; pct: number | null } {
  const lastday = fin(position.lastdayPrice ?? 0);
  const base = lastday > 0 ? lastday * fin(position.quantity) : costBasis(position);
  const amount = fin(position.marketValue) - base;
  return { amount, pct: base > 0 ? (amount / base) * 100 : null };
}

/** A single order/transaction as shown in the account's activity feed. */
export interface ActivityView {
  /** The broker's order id — the identity the durable activity ledger dedupes on. */
  readonly orderId?: string;
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly filledQuantity: number;
  readonly price?: number;
  readonly status: string;
  /** ISO-8601; rendered in the participant's timezone when one is set. */
  readonly at: string;
}

/** One participant's account state at a point in time — a row on the dashboard. */
export interface ParticipantSnapshot {
  readonly id: string;
  readonly displayName: string;
  readonly kind: Participant["kind"];
  readonly personaId?: string;
  /** IANA timezone for rendering this account's activity times locally. */
  readonly timezone?: string;
  /**
   * Alpaca's own account identifier — present only on a successful read. Two participants
   * sharing one `accountId` means they're pointed at the same brokerage account regardless of
   * which credential pair each believes it holds; see `account-collisions.ts`.
   */
  readonly accountId?: string;
  /**
   * Alpaca's human-readable account number (`PA…` on paper) — present only on a successful read.
   * Distinct from `accountId` on purpose: the UUID identifies the account to the API, this one
   * identifies it to the *member*, because it's what Alpaca's own dashboard shows them. That makes
   * it the only value that answers "which of my broker accounts is this board name?"
   */
  readonly accountNumber?: string;
  readonly cash: number;
  readonly equity: number;
  /**
   * Cumulative realized P/L booked on this account since the reducer began folding — the gain/loss
   * locked in by sells (sell price − average cost × quantity sold). Absent on pure Alpaca reads
   * (which don't return it); the realtime reducer accumulates it. The seed of the history layer:
   * the first durable record of what a trade *earned*, not just what's currently held.
   */
  readonly realizedPl?: number;
  readonly positions: PositionView[];
  readonly activity?: ActivityView[];
  /** True when the account read failed; the snapshot then carries zeros and the error. */
  readonly error?: string;
}

/**
 * Read one participant's live account into a dashboard snapshot. Alpaca returns numbers
 * as strings; this is where they become numbers. A read failure is captured on the
 * snapshot (not thrown) so one unreachable account never blanks the whole dashboard.
 */
export async function buildParticipantSnapshot(
  participant: Participant,
  client: AlpacaTradingClient,
): Promise<ParticipantSnapshot> {
  const base = {
    id: participant.id,
    displayName: participant.displayName,
    kind: participant.kind,
    ...(participant.personaId ? { personaId: participant.personaId } : {}),
    ...(participant.timezone ? { timezone: participant.timezone } : {}),
  };

  try {
    const [account, positions] = await Promise.all([client.getAccount(), client.getPositions()]);
    return {
      ...base,
      accountId: account.id,
      ...(account.account_number ? { accountNumber: account.account_number } : {}),
      cash: Number(account.cash),
      equity: Number(account.portfolio_value),
      positions: positionsFrom(positions),
      // Activity is supplementary — a failure to read it must not blank the account.
      activity: await readActivity(client),
    };
  } catch (error) {
    return { ...base, cash: 0, equity: 0, positions: [], activity: [], error: String(error) };
  }
}

async function readActivity(client: AlpacaTradingClient): Promise<ActivityView[]> {
  try {
    const orders = await client.getRecentOrders();
    return orders.map((order) => ({
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: Number(order.qty),
      filledQuantity: Number(order.filled_qty ?? "0"),
      ...(order.filled_avg_price ? { price: Number(order.filled_avg_price) } : {}),
      status: order.status,
      at: order.filled_at ?? order.submitted_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
