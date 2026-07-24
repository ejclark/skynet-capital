import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { Participant } from "../participants/participant.js";

/** A single holding as shown on the dashboard. */
export interface PositionView {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
  readonly marketValue: number;
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
  readonly cash: number;
  readonly equity: number;
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
