/** One share order a submit left `working` — accepted by the broker, no fill seen yet (#4655). */
export interface PendingShareOrder {
  readonly orderId: string;
  readonly symbol: string;
}

/**
 * The share orders a submit left `working` (#4650): queued for the open, or slower than the
 * submit's own poll. Unlike an option limit, a share order is never canceled by the bot — it is
 * only re-read at the top of each live cycle until the broker ends it, so what it became (filled,
 * partly, or not at all) reaches the decision that placed it. Owned by the bot's
 * `SwappableBotBroker`, so a credential rotation never forgets one. Keyed by the broker's order id.
 */
export class PendingShareOrders {
  private readonly byOrderId = new Map<string, PendingShareOrder>();

  add(order: PendingShareOrder): void {
    this.byOrderId.set(order.orderId, order);
  }

  forget(orderId: string): void {
    this.byOrderId.delete(orderId);
  }

  list(): readonly PendingShareOrder[] {
    return [...this.byOrderId.values()];
  }
}
