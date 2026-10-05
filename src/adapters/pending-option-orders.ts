/** One option order a submit left `working` — its cancel was not confirmed, so it may still fill. */
export interface PendingOptionOrder {
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly underlying: string;
}

/**
 * The option orders a submit left `working` (#4642 slice 5), rechecked at the top of every live
 * cycle (`AlpacaOptionOrderFlow.settle`). Owned by the bot's `SwappableBotBroker`, not by any one
 * client, so a credential rotation never forgets an order still live at the broker.
 */
export class PendingOptionOrders {
  private readonly byId = new Map<string, PendingOptionOrder>();

  add(order: PendingOptionOrder): void {
    this.byId.set(order.orderId, order);
  }

  forget(orderId: string): void {
    this.byId.delete(orderId);
  }

  list(): readonly PendingOptionOrder[] {
    return [...this.byId.values()];
  }
}
