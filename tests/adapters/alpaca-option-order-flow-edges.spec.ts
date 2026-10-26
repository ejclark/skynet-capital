import {
  AlpacaOptionOrderFlow,
  type AlpacaOptionOrderFlowDeps,
} from "../../src/adapters/alpaca-option-order-flow.js";
import { PendingOptionOrders } from "../../src/adapters/pending-option-orders.js";
import { AlpacaApiError } from "../../src/alpaca/alpaca-trading-client.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";
import {
  anOrder,
  FakeOptionBroker,
  flowOver,
  NOW,
  PREFIX,
  PUT,
} from "../support/fake-option-broker.js";

// The edges of the bots' option order flow (#4642 slice 5) that the per-step specs in
// alpaca-option-order-flow.spec.ts and alpaca-option-order-settle.spec.ts leave open: what is
// refused before the broker is touched, what an adopted order that already ended reads as, a
// listener that throws, the flow with its real default timing, and the sweep's tolerance of a
// cancel the broker refuses. The module is imported directly here — the flow it builds is real, only
// the broker and the clock are faked.

const CID = `${PREFIX}CRWV-mg1x2-0`;
const put = (over: Parameters<typeof anOptionIntent>[0] = {}): OrderIntent =>
  anOptionIntent({ clientOrderId: CID, ...over });

/** A flow wired by hand, so a spec controls exactly which listeners it has — and timing it leaves
 *  at the module's defaults unless asked. */
function bareFlow(
  broker: FakeOptionBroker,
  over: Partial<AlpacaOptionOrderFlowDeps> = {},
): AlpacaOptionOrderFlow {
  return new AlpacaOptionOrderFlow({
    trading: broker,
    options: broker,
    pending: new PendingOptionOrders(),
    clientOrderIdPrefix: PREFIX,
    now: () => NOW,
    sleep: () => Promise.resolve(),
    ...over,
  });
}

/** A fake whose placed order fills on the first poll. */
function filling(): FakeOptionBroker {
  const broker = new FakeOptionBroker();
  broker.reads.set("o1", [
    anOrder({ status: "filled", filled_qty: "1", filled_avg_price: "2.10" }),
  ]);
  return broker;
}

/** A broker that refuses every cancel the way Alpaca does for an order already over (422). */
class RefusingCancels extends FakeOptionBroker {
  override cancelOrder(id: string): Promise<void> {
    this.calls.push(`cancel ${id}`);
    return Promise.reject(new AlpacaApiError(422, { message: "order is not cancelable" }));
  }
}

describe("when an order is refused before the broker is asked anything", () => {
  it("treats a client order id outside Alpaca's alphabet as unstamped", async () => {
    const broker = new FakeOptionBroker();
    for (const clientOrderId of ["has a space", "semi;colon", "x".repeat(129)]) {
      const result = await flowOver(broker).flow.submit(put({ clientOrderId }));
      expect(result).toMatchObject({ status: "rejected", reason: "unstamped option order" });
    }
    expect(broker.calls).toEqual([]);
  });

  it("refuses a malformed option order, naming why, and never sends it", async () => {
    const broker = new FakeOptionBroker();
    // A cash-secured put is opened for a credit — a negative limit is not that.
    const result = await flowOver(broker).flow.submit(put({ option: { limitPrice: -1 } }));
    expect(result.status).toBe("rejected");
    expect(result.reason).toMatch(/^not a well-formed option order: .*opened for a credit/);
    expect(broker.calls).toEqual([]);
  });

  it("refuses an order with three legs — an option order has one or two", async () => {
    const broker = new FakeOptionBroker();
    const leg = { occSymbol: PUT, side: "sell" as const, ratio: 1 };
    const result = await flowOver(broker).flow.submit(put({ option: { legs: [leg, leg, leg] } }));
    expect(result.reason).toContain("an option order has one or two legs");
    expect(broker.calls).toEqual([]);
  });

  it("refuses a stamped share order — this flow sends options only", async () => {
    const broker = new FakeOptionBroker();
    const { option: _option, ...shares } = put();
    const result = await flowOver(broker).flow.submit(shares);
    expect(result.status).toBe("rejected");
    expect(result.reason).toMatch(/^not a well-formed option order:/);
    expect(broker.calls).toEqual([]);
  });
});

describe("when the order was already at the broker", () => {
  it("goes on to preflight and place when the lookup by client order id itself fails", async () => {
    const broker = filling();
    // Alpaca refuses a duplicate id, so an unreadable lookup cannot cause a double send.
    broker.lookups.push(new AlpacaApiError(503, { message: "unavailable" }));
    const result = await flowOver(broker).flow.submit(put());
    expect(result).toMatchObject({ status: "filled", orderId: "o1" });
    expect(broker.placedSingle).toHaveLength(1);
  });

  it("reads an adopted order that was canceled with nothing traded as rejected, with its id", async () => {
    const broker = new FakeOptionBroker();
    broker.byClientId.set(CID, anOrder({ id: "old", status: "canceled" }));
    const { flow, submitted } = flowOver(broker);
    expect(await flow.submit(put())).toEqual({
      intent: put(),
      status: "rejected",
      reason: "order canceled",
      orderId: "old",
    });
    expect(submitted).toEqual([]);
    expect(broker.placedSingle).toEqual([]);
  });

  it("reads an adopted order that was canceled after a partial fill as filled, never rejected", async () => {
    const broker = new FakeOptionBroker();
    broker.byClientId.set(
      CID,
      anOrder({ id: "old", status: "canceled", filled_qty: "1", filled_avg_price: "2.05" }),
    );
    broker.reads.set("old", [
      anOrder({ id: "old", status: "canceled", filled_qty: "1", filled_avg_price: "2.05" }),
    ]);
    const result = await flowOver(broker).flow.submit(put({ quantity: 2 }));
    expect(result).toMatchObject({ status: "filled", filledQuantity: 1, filledPrice: 2.05 });
    expect(broker.calls).not.toContain("cancel old");
  });
});

describe("when a close shares its underlying with someone else's order", () => {
  it("is never blocked by it, and cancels nothing that is not this bot's", async () => {
    const broker = filling();
    broker.positions = [
      { symbol: PUT, qty: "1", side: "short", avg_entry_price: "2.10", market_value: "-200" },
    ];
    broker.open = [anOrder({ id: "desk", symbol: "CRWV", side: "buy", client_order_id: "desk-9" })];
    const close = anOptionIntent({
      side: "buy",
      clientOrderId: CID,
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
        limitPrice: 2.1,
      },
    });
    const result = await flowOver(broker).flow.submit(close);
    expect(result.status).toBe("filled");
    expect(broker.calls.filter((c) => c.startsWith("cancel"))).toEqual([]);
    // No cancel of ours, so positions are read once, not re-read.
    expect(broker.calls.filter((c) => c === "getPositions")).toHaveLength(1);
  });
});

describe("when the order is for more than one contract", () => {
  it("sends the quantity and announces it as the leg's own contracts", async () => {
    const broker = filling();
    broker.reads.set("o1", [
      anOrder({ status: "filled", qty: "2", filled_qty: "2", filled_avg_price: "2.10" }),
    ]);
    const submitted: { orderId: string; quantity: number; symbol: string }[] = [];
    const flow = bareFlow(broker, { onSubmitted: (info) => submitted.push(info) });
    const result = await flow.submit(put({ quantity: 2 }));
    expect(broker.placedSingle[0]).toMatchObject({ contracts: 2 });
    expect(submitted).toMatchObject([{ orderId: "o1", symbol: PUT, quantity: 2 }]);
    expect(result).toMatchObject({ status: "filled", filledQuantity: 2 });
  });
});

describe("when a listener throws", () => {
  it("never turns a live order into a rejection — onSubmitted is a notification, not a gate", async () => {
    const broker = filling();
    const flow = bareFlow(broker, {
      onSubmitted: () => {
        throw new Error("activity feed down");
      },
    });
    expect(await flow.submit(put())).toMatchObject({ status: "filled", orderId: "o1" });
  });

  it("still forgets an ended order when onSettled throws — it would otherwise block its underlying forever", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "done", clientOrderId: CID, underlying: "CRWV" });
    broker.reads.set("done", [anOrder({ id: "done", status: "filled", filled_qty: "1" })]);
    const flow = bareFlow(broker, {
      pending,
      onSettled: () => {
        throw new Error("decision store down");
      },
    });
    expect([...(await flow.settle())]).toEqual([]);
    expect(pending.list()).toEqual([]);
  });

  it("runs with no listeners at all", async () => {
    const broker = filling();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "done", clientOrderId: `${PREFIX}NVDA-a-1`, underlying: "NVDA" });
    broker.reads.set("done", [anOrder({ id: "done", status: "canceled" })]);
    const flow = bareFlow(broker, { pending });
    expect(await flow.submit(put())).toMatchObject({ status: "filled" });
    expect([...(await flow.settle())]).toEqual([]);
    expect(pending.list()).toEqual([]);
  });
});

describe("when settle finds an order the broker has ended", () => {
  it("reports what it became, stamped with the client order id and the time it was seen", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "late", clientOrderId: CID, underlying: "CRWV" });
    broker.reads.set("late", [
      anOrder({ id: "late", status: "filled", filled_qty: "1", filled_avg_price: "2.10" }),
    ]);
    const { flow, settled } = flowOver(broker, pending);
    await flow.settle();
    expect(settled).toEqual([
      {
        orderId: "late",
        clientOrderId: CID,
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.1,
        legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.1 }],
        settledAt: new Date(NOW).toISOString(),
      },
    ]);
  });

  it("reports an order that ended with nothing traded as unfilled, and one the broker refused as rejected", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "exp", clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    pending.add({ orderId: "rej", clientOrderId: `${PREFIX}NVDA-a-1`, underlying: "NVDA" });
    broker.reads.set("exp", [anOrder({ id: "exp", status: "expired" })]);
    broker.reads.set("rej", [anOrder({ id: "rej", status: "rejected" })]);
    const { flow, settled } = flowOver(broker, pending);
    await flow.settle();
    expect(settled.map((s) => [s.orderId, s.status, s.filledQuantity])).toEqual([
      ["exp", "unfilled", 0],
      ["rej", "rejected", 0],
    ]);
  });

  it("reports nothing for an order the broker no longer knows or a POST that never landed", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "gone", clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    pending.add({ clientOrderId: `${PREFIX}NVDA-a-1`, underlying: "NVDA" });
    broker.lookups.push(undefined);
    const { flow, settled } = flowOver(broker, pending);
    expect([...(await flow.settle())]).toEqual([]);
    expect(settled).toEqual([]);
    expect(pending.list()).toEqual([]);
  });

  it("costs no network on the next pass once everything pending has ended", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "done", clientOrderId: CID, underlying: "CRWV" });
    broker.reads.set("done", [anOrder({ id: "done", status: "filled", filled_qty: "1" })]);
    const { flow } = flowOver(broker, pending);
    await flow.settle();
    broker.calls.length = 0;
    expect([...(await flow.settle())]).toEqual([]);
    expect(broker.calls).toEqual([]);
  });
});

describe("when the flow runs on its default timing", () => {
  it("gives a limit fifteen seconds to fill before it cancels, and says so", async () => {
    const broker = new FakeOptionBroker();
    // 15 one-second polls see the order still working, then the cancel is confirmed.
    broker.reads.set("o1", [
      ...Array.from({ length: 15 }, () => anOrder()),
      anOrder({ status: "canceled" }),
    ]);
    const slept: number[] = [];
    const flow = bareFlow(broker, {
      sleep: (ms) => {
        slept.push(ms);
        return Promise.resolve();
      },
    });
    const result = await flow.submit(put());
    expect(result).toMatchObject({
      status: "unfilled",
      reason: "limit $2.10 not reached in 15s; canceled",
    });
    expect(broker.calls).toContain("cancel o1");
    // Polls are a second apart; the wait never runs past the budget.
    expect(slept.filter((ms) => ms === 1_000)).toHaveLength(15);
  });

  it("lets a caller override one timing and keep the rest", async () => {
    const broker = new FakeOptionBroker();
    broker.reads.set("o1", [anOrder(), anOrder({ status: "canceled" })]);
    const flow = bareFlow(broker, { timing: { waitMs: 1_000 } });
    expect(await flow.submit(put())).toMatchObject({
      status: "unfilled",
      reason: "limit $2.10 not reached in 1s; canceled",
    });
  });
});

describe("when a cancel is refused by the broker", () => {
  it("still sweeps every orphan and reports each one", async () => {
    const broker = new RefusingCancels();
    broker.open = [
      anOrder({ id: "a", client_order_id: `${PREFIX}CRWV-mg0aa-0` }),
      anOrder({ id: "b", client_order_id: `${PREFIX}NVDA-mg0aa-1` }),
    ];
    const swept = await bareFlow(broker).sweepOrphans();
    expect(swept).toEqual([`${PREFIX}CRWV-mg0aa-0`, `${PREFIX}NVDA-mg0aa-1`]);
    expect(broker.calls.filter((c) => c.startsWith("cancel"))).toEqual(["cancel a", "cancel b"]);
  });

  it("sweeps nothing, and cancels nothing, when no open order is this bot's", async () => {
    const broker = new FakeOptionBroker();
    broker.open = [anOrder({ id: "desk", client_order_id: "desk-1" })];
    expect(await bareFlow(broker).sweepOrphans()).toEqual([]);
    expect(broker.calls.filter((c) => c.startsWith("cancel"))).toEqual([]);
  });

  it("reads the order afterward rather than assuming the cancel worked — an unconfirmed one stays pending", async () => {
    const broker = new RefusingCancels();
    // A refused cancel leaves the order live; the settle re-reads see it never ended.
    broker.reads.set("o1", [anOrder({ status: "new" })]);
    const pending = new PendingOptionOrders();
    const flow = bareFlow(broker, { pending });
    const result = await flow.submit(put());
    expect(result).toMatchObject({ status: "working", orderId: "o1" });
    expect(pending.list()).toEqual([{ orderId: "o1", clientOrderId: CID, underlying: "CRWV" }]);
  });
});
