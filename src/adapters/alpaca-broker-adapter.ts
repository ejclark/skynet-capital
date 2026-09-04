import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { OrderIntent, OrderResult, Portfolio } from "../domain/types.js";
import type { BrokerPort } from "../ports/broker.js";

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

  constructor(client: AlpacaTradingClient) {
    this.client = client;
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
