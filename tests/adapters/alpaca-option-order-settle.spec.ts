import {
  freshBookProblem,
  ordersOn,
  parseOptionsLevel,
} from "../../src/adapters/alpaca-option-preflight.js";
import { netFillPrice, settledOptionResult } from "../../src/adapters/alpaca-option-result.js";
import { PendingOptionOrders } from "../../src/adapters/pending-option-orders.js";
import { AlpacaApiError } from "../../src/alpaca/alpaca-trading-client.js";
import { anOptionIntent } from "../support/builders.js";
import { anOrder, FakeOptionBroker, flowOver, PREFIX, PUT } from "../support/fake-option-broker.js";

// What happens to a bot's option order after the submit (#4642 slice 5): the pending registry
// settled at the top of each live cycle, the boot sweep of orders a crashed process left behind,
// and the pure pieces both lean on.

describe("AlpacaOptionOrderFlow.settle", () => {
  it("costs no network when nothing is pending", async () => {
    const broker = new FakeOptionBroker();
    expect([...(await flowOver(broker).flow.settle())]).toEqual([]);
    expect(broker.calls).toEqual([]);
  });

  it("forgets an order that has ended, re-cancels one still live, and names the live one's underlying", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "done", clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    pending.add({ orderId: "live", clientOrderId: `${PREFIX}NVDA-a-1`, underlying: "NVDA" });
    broker.reads.set("done", [anOrder({ id: "done", status: "filled", filled_qty: "1" })]);
    broker.reads.set("live", [anOrder({ id: "live", status: "new" })]);
    const { flow } = flowOver(broker, pending);

    expect([...(await flow.settle())]).toEqual(["NVDA"]);
    expect(broker.calls).toContain("cancel live");
    expect(broker.calls).not.toContain("cancel done");
    expect(pending.list().map((p) => p.orderId)).toEqual(["live"]);
    expect(broker.calls.filter((c) => c.startsWith("getOrder"))).toEqual([
      "getOrder done nested=true",
      "getOrder live nested=true",
    ]);
  });

  it("forgets an order the broker no longer knows (404), but keeps blocking on any other failed read", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "gone", clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    pending.add({ orderId: "blip", clientOrderId: `${PREFIX}NVDA-a-1`, underlying: "NVDA" });
    broker.reads.set("blip", [new AlpacaApiError(503, null)]);
    const { flow } = flowOver(broker, pending);

    expect([...(await flow.settle())]).toEqual(["NVDA"]);
    expect(pending.list().map((p) => p.orderId)).toEqual(["blip"]);
  });
});

describe("AlpacaOptionOrderFlow.settle — an order whose POST outcome was never learned", () => {
  const cid = (n: number) => `${PREFIX}CRWV-a-${n}`;

  it("resolves it by client order id: forgets one never placed or ended, cancels and pins one live, blocks on a failed lookup", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ clientOrderId: cid(0), underlying: "CRWV" });
    pending.add({ clientOrderId: cid(1), underlying: "AMD" });
    pending.add({ clientOrderId: cid(2), underlying: "NVDA" });
    pending.add({ clientOrderId: cid(3), underlying: "TSLA" });
    broker.lookups.push(
      undefined,
      anOrder({ id: "ended", status: "canceled" }),
      anOrder({ id: "landed", status: "new" }),
      new AlpacaApiError(503, null),
    );
    const { flow } = flowOver(broker, pending);

    expect([...(await flow.settle())]).toEqual(["NVDA", "TSLA"]);
    expect(broker.calls.filter((c) => c.startsWith("cancel"))).toEqual(["cancel landed"]);
    expect(pending.list()).toEqual([
      { clientOrderId: cid(2), underlying: "NVDA", orderId: "landed" },
      { clientOrderId: cid(3), underlying: "TSLA" },
    ]);
  });
});

describe("AlpacaOptionOrderFlow.sweepOrphans", () => {
  it("cancels every open order carrying this bot's client order id prefix — and nothing else", async () => {
    const broker = new FakeOptionBroker();
    broker.open = [
      anOrder({ id: "mine", client_order_id: `${PREFIX}CRWV-mg0aa-0` }),
      anOrder({ id: "other-bot", client_order_id: "sk1-daytrader-CRWV-mg0aa-0" }),
      anOrder({ id: "desk", client_order_id: "3f0c9a6e-desk" }),
      anOrder({ id: "unstamped" }),
    ];
    const swept = await flowOver(broker).flow.sweepOrphans();
    expect(swept).toEqual([`${PREFIX}CRWV-mg0aa-0`]);
    expect(broker.calls.filter((c) => c.startsWith("cancel"))).toEqual(["cancel mine"]);
    expect(broker.calls).toContain("listOrders open nested=true");
  });

  it("throws when the open orders cannot be listed, so boot can say the sweep did not run", async () => {
    const broker = new FakeOptionBroker();
    broker.listError = new Error("503");
    await expect(flowOver(broker).flow.sweepOrphans()).rejects.toThrow("503");
  });
});

describe("parseOptionsLevel", () => {
  it("reads 0–3 from a number or a numeric string", () => {
    expect([0, 1, 2, 3, "0", "3", " 2 "].map(parseOptionsLevel)).toEqual([0, 1, 2, 3, 0, 3, 2]);
  });

  it("is undefined — never a guessed 0 — for anything else", () => {
    for (const raw of [undefined, null, "", "abc", "4", -1, 1.5, true, {}]) {
      expect(parseOptionsLevel(raw)).toBeUndefined();
    }
  });
});

describe("ordersOn — the no-stacking fence", () => {
  it("tells this bot's own orders on an underlying from anyone's", () => {
    const open = [
      anOrder({ id: "ours", client_order_id: `${PREFIX}NVDA-x-0` }),
      anOrder({ id: "share", symbol: "NVDA", client_order_id: "desk" }),
      anOrder({ id: "prefix-of-another", symbol: "", client_order_id: `${PREFIX}NVD-x-0` }),
      anOrder({ id: "elsewhere", symbol: PUT }),
    ];
    const fence = ordersOn(open, "NVDA", PREFIX);
    expect(fence.ours.map((o) => o.id)).toEqual(["ours"]);
    expect(fence.any.map((o) => o.id)).toEqual(["ours", "share"]);
  });
});

describe("netFillPrice and settledOptionResult", () => {
  it("takes the parent's own fill price when it reports one, else nets the legs in Alpaca's sign", () => {
    expect(netFillPrice(anOrder({ filled_avg_price: "-0.85" }))).toBe(-0.85);
    const legs = [
      anOrder({ side: "sell", filled_avg_price: "9.90", ratio_qty: "1" }),
      anOrder({ side: "buy", filled_avg_price: "6.05", ratio_qty: "1" }),
    ];
    expect(netFillPrice(anOrder({ legs }))).toBe(-3.85);
    expect(netFillPrice(anOrder({ legs: [legs[0] ?? anOrder(), anOrder()] }))).toBeUndefined();
  });

  it("words an expired limit and a credit limit plainly", () => {
    const close = anOptionIntent({
      side: "sell",
      option: {
        effect: "close",
        structure: "close",
        legs: [
          { occSymbol: "NVDA261113C00180000", side: "sell", ratio: 1 },
          { occSymbol: "NVDA261113C00190000", side: "buy", ratio: 1 },
        ],
        limitPrice: -0.85,
      },
    });
    expect(settledOptionResult(close, anOrder({ status: "expired" }), 15_000).reason).toBe(
      "limit $0.85 credit not reached in 15s; expired",
    );
  });

  it("reads a filled status with no filled_qty as the whole order", () => {
    const result = settledOptionResult(
      anOptionIntent(),
      anOrder({ status: "filled", filled_qty: undefined, filled_avg_price: "2.10" }),
      15_000,
    );
    expect(result).toMatchObject({ status: "filled", filledQuantity: 1 });
  });
});

describe("freshBookProblem — the guards' arithmetic on fresh positions", () => {
  const call = anOptionIntent({
    option: {
      structure: "covered-call",
      legs: [{ occSymbol: "CRWV261106C00110000", side: "sell", ratio: 1 }],
    },
  });

  it("refuses a covered call the shares no longer cover, and passes one they do", () => {
    const option = call.option;
    if (!option) throw new Error("fixture");
    const fifty = { cash: 0, positions: [{ symbol: "CRWV", quantity: 50, avgPrice: 90 }] };
    const hundred = { cash: 0, positions: [{ symbol: "CRWV", quantity: 100, avgPrice: 90 }] };
    expect(freshBookProblem(call, option, fifty)).toBe(
      "not enough free shares to cover the sold call",
    );
    expect(freshBookProblem(call, option, hundred)).toBeUndefined();
  });

  it("refuses a close of more than is now held — never resizes it", () => {
    const close = anOptionIntent({
      side: "buy",
      quantity: 2,
      option: {
        effect: "close",
        structure: "close",
        legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
      },
    });
    const option = close.option;
    if (!option) throw new Error("fixture");
    const book = { cash: 10_000, positions: [{ symbol: PUT, quantity: -1, avgPrice: 2.1 }] };
    expect(freshBookProblem(close, option, book)).toBe("only 1 held to close, not 2");
  });
});
