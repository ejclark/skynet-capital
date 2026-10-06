/** One option order a submit left `working` — its cancel was not confirmed, so it may still fill. */
export interface PendingOptionOrder {
  /** Absent when the POST's answer was lost and the lookup after it failed too: the order may or
   *  may not exist, so `settle` resolves it by its client order id. */
  readonly orderId?: string;
  readonly clientOrderId: string;
  readonly underlying: string;
}

/**
 * The option orders a submit left `working` (#4642 slice 5), rechecked at the top of every live
 * cycle (`AlpacaOptionOrderFlow.settle`). Owned by the bot's `SwappableBotBroker`, not by any one
 * client, so a credential rotation never forgets an order still live at the broker. Keyed by the
 * client order id — the one id every entry has, even one whose broker id was never learned.
 */
export class PendingOptionOrders {
  private readonly byClientId = new Map<string, PendingOptionOrder>();

  add(order: PendingOptionOrder): void {
    this.byClientId.set(order.clientOrderId, order);
  }

  forget(clientOrderId: string): void {
    this.byClientId.delete(clientOrderId);
  }

  list(): readonly PendingOptionOrder[] {
    return [...this.byClientId.values()];
  }
}
