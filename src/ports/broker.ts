import type { OrderIntent, OrderResult, Portfolio, Side } from "../domain/types.js";

/** A share order the broker still holds open — not yet filled, canceled or expired. */
export interface OpenShareOrder {
  readonly symbol: string;
  readonly side: Side;
  /** Shares still to fill: the order's size less what has already filled. 0 when the broker's
   *  numbers cannot be read (an order sized in dollars carries no share count). */
  readonly quantity: number;
}

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
  /**
   * Every share order still open at the broker (#4678). An order queued for the open is not in the
   * portfolio yet, so without this a bot would buy the same symbol again. Throws when the broker
   * cannot be asked, so a caller can tell "nothing open" from "could not tell". Absent on a broker
   * that fills or rejects every order on the spot (`InMemoryBroker`): nothing there is ever open.
   */
  openShareOrders?(): Promise<readonly OpenShareOrder[]>;
}
