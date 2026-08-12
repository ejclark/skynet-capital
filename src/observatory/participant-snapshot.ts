import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { Participant } from "../participants/participant.js";

/** A single holding as shown on the dashboard. */
export interface PositionView {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
  readonly marketValue: number;
}

/** Broker feeds can hand us NaN/Infinity; a non-finite number is treated as 0 rather than letting it
 *  poison downstream math and reach a rendered surface as the string "NaN". */
export const fin = (v: number): number => (Number.isFinite(v) ? v : 0);

/** A position's unrealized P/L — market value minus cost basis (quantity × average price). The one
 *  place this arithmetic lives; both the dashboard cards and the world projection read from here. */
export function unrealizedPl(position: PositionView): number {
  return fin(position.marketValue) - fin(position.quantity) * fin(position.avgPrice);
}

/** A single order/transaction as shown in the account's activity feed. */
export interface ActivityView {
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
      cash: Number(account.cash),
      equity: Number(account.portfolio_value),
      positions: positions.map((position) => ({
        symbol: position.symbol,
        quantity: Number(position.qty),
        avgPrice: Number(position.avg_entry_price),
        marketValue: Number(position.market_value),
      })),
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
