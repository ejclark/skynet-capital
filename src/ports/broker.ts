import type { OrderIntent, OrderResult, Portfolio } from "../domain/types.js";

/**
 * The boundary between our engine and wherever orders actually execute.
 *
 * A paper broker (in-memory, for tests and simulation) and the real Alpaca paper
 * account both implement this interface. The engine never imports a concrete broker —
 * it depends only on this port, so swapping execution backends changes nothing upstream.
 */
export interface BrokerPort {
  /** Current account state: cash and open positions. */
  getPortfolio(): Promise<Portfolio>;
  /** Execute a single order. Implementations must never throw for a business rejection —
   *  they return an `OrderResult` with `status: "rejected"` and a `reason` instead. */
  submit(order: OrderIntent): Promise<OrderResult>;
}
