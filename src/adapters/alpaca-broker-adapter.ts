import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { OrderIntent, OrderResult, Portfolio, Side } from "../domain/types.js";
import type { BrokerPort } from "../ports/broker.js";

/**
 * One order this adapter's own submit path got the broker to accept — everything a caller
 * needs to translate into an audit line or a bus event, without this module knowing either
 * concept exists (#1211 slice 2: `AlpacaBrokerAdapter.submit` writes no audit line at all today,
 * the one path — bot autonomous orders — that bypasses `desk-gate.ts`'s `submitAndAudit`).
 */
export interface BotOrderSubmission {
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Side;
  readonly quantity: number;
  readonly at: string;
}

/**
 * Adapts the Alpaca paper Trading API to the engine's `BrokerPort`. Because the engine
 * depends only on the port, swapping the in-memory paper broker for this live adapter
 * changes no engine, persona, or guard code — that's the whole point of the port.
 *
 * Fill semantics differ from the in-memory broker: a market order posts asynchronously
 * and Alpaca fills it shortly after. We treat a successfully-accepted order as "filled"
 * (paper markets fill near-instantly) and surface a rejection only when the API rejects
 * the submission. A later increment can poll order status for exact fills.
 */
export class AlpacaBrokerAdapter implements BrokerPort {
  private readonly client: AlpacaTradingClient;
  private readonly onSubmitted?: (info: BotOrderSubmission) => void;
  private readonly now: () => Date;

  /**
   * `deps.onSubmitted` fires once the broker has actually accepted an order — never on a
   * rejection — mirroring `submitAndAudit`'s "append the audit line on success only". A
   * throwing listener can never break `submit()`'s own result: this is a notification, not a
   * gate, so the caller wraps its own bus-publish failure handling (`activity-publishing.ts`'s
   * `logBusFailure` pattern) rather than this adapter swallowing anything silently.
   */
  constructor(
    client: AlpacaTradingClient,
    deps?: { onSubmitted?: (info: BotOrderSubmission) => void; now?: () => Date },
  ) {
    this.client = client;
    this.onSubmitted = deps?.onSubmitted;
    this.now = deps?.now ?? (() => new Date());
  }

  async getPortfolio(): Promise<Portfolio> {
    const [account, positions] = await Promise.all([
      this.client.getAccount(),
      this.client.getPositions(),
    ]);
    return {
      cash: Number(account.cash),
      positions: positions.map((position) => ({
        symbol: position.symbol,
        quantity: Number(position.qty),
        avgPrice: Number(position.avg_entry_price),
      })),
    };
  }

  async submit(order: OrderIntent): Promise<OrderResult> {
    try {
      const placed = await this.client.placeOrder({
        symbol: order.symbol,
        qty: order.quantity,
        side: order.side,
      });
      if (placed.status === "rejected" || placed.status === "canceled") {
        return {
          intent: order,
          status: "rejected",
          reason: `order ${placed.status}`,
          orderId: placed.id,
        };
      }
      if (this.onSubmitted) {
        try {
          this.onSubmitted({
            orderId: placed.id,
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            at: this.now().toISOString(),
          });
        } catch {
          // A listener's own failure is its caller's to log — never this adapter's problem,
          // and never allowed to turn a real fill into a reported rejection.
        }
      }
      return {
        intent: order,
        status: "filled",
        filledQuantity: order.quantity,
        orderId: placed.id,
      };
    } catch (error) {
      // The broker never created an order here (the request itself failed), so there is no id to
      // report — `orderId` stays absent, same as any submission that never reached the broker.
      return { intent: order, status: "rejected", reason: String(error) };
    }
  }
}
