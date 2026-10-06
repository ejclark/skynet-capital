import { AlpacaBrokerAdapter } from "../../src/adapters/alpaca-broker-adapter.js";
import { optionSettlementOf } from "../../src/adapters/alpaca-option-result.js";
import { PendingOptionOrders } from "../../src/adapters/pending-option-orders.js";
import { PendingShareOrders } from "../../src/adapters/pending-share-orders.js";
import { AlpacaApiError, AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { anOrder, FakeOptionBroker, flowOver, PREFIX, PUT } from "../support/fake-option-broker.js";

/**
 * What a bot's `working` order became once the broker ended it (#4650): the settle loop that
 * already re-reads every order a submit left working now reports each one that ended — filled,
 * partly filled, or never — instead of forgetting it, so the decision store can read it beside the
 * decision. Option limits and share orders queued for the open alike.
 */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const AT = "2026-10-07T15:00:00.000Z";

describe("optionSettlementOf", () => {
  it("reads a limit that partly filled and was then canceled as filled, with the true quantity", () => {
    const order = anOrder({
      status: "canceled",
      qty: "3",
      filled_qty: "1",
      filled_avg_price: "2.05",
    });
    expect(optionSettlementOf(order, `${PREFIX}CRWV-a-0`, AT)).toEqual({
      orderId: "o1",
      clientOrderId: `${PREFIX}CRWV-a-0`,
      status: "filled",
      filledQuantity: 1,
      filledPrice: 2.05,
      legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
      settledAt: AT,
    });
  });

  it("keeps each spread leg's own order id and fill, and the broker's net", () => {
    const leg = (id: string, symbol: string, side: "buy" | "sell", price: string) =>
      anOrder({ id, symbol, side, status: "filled", filled_qty: "1", filled_avg_price: price });
    const parent = anOrder({
      id: "mleg-1",
      symbol: "",
      side: "buy",
      status: "filled",
      filled_qty: "1",
      filled_avg_price: "3.35",
      legs: [leg("leg-low", LOW, "buy", "5.10"), leg("leg-high", HIGH, "sell", "1.75")],
    });
    expect(optionSettlementOf(parent, undefined, AT)).toEqual({
      orderId: "mleg-1",
      status: "filled",
      filledQuantity: 1,
      filledPrice: 3.35,
      legs: [
        { occSymbol: LOW, orderId: "leg-low", filledQuantity: 1, filledPrice: 5.1 },
        { occSymbol: HIGH, orderId: "leg-high", filledQuantity: 1, filledPrice: 1.75 },
      ],
      settledAt: AT,
    });
  });

  it("reads an order that ended with nothing traded as unfilled, or rejected when the broker refused it", () => {
    expect(optionSettlementOf(anOrder({ status: "expired" }), undefined, AT)).toMatchObject({
      status: "unfilled",
      filledQuantity: 0,
    });
    expect(optionSettlementOf(anOrder({ status: "rejected" }), undefined, AT).status).toBe(
      "rejected",
    );
    expect(optionSettlementOf(anOrder({ status: "expired" }), undefined, AT)).not.toHaveProperty(
      "filledPrice",
    );
  });
});

describe("AlpacaOptionOrderFlow.settle — reporting what a working order became", () => {
  it("reports an order that ended — filled after the wait — once, then forgets it", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "late", clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    broker.reads.set("late", [
      anOrder({ id: "late", status: "filled", filled_qty: "1", filled_avg_price: "2.05" }),
    ]);
    const { flow, settled } = flowOver(broker, pending);

    expect([...(await flow.settle())]).toEqual([]);
    expect([...(await flow.settle())]).toEqual([]);
    expect(settled).toEqual([
      {
        orderId: "late",
        clientOrderId: `${PREFIX}CRWV-a-0`,
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.05,
        legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
        settledAt: "2026-10-07T15:00:00.000Z",
      },
    ]);
    expect(pending.list()).toEqual([]);
  });

  it("reports nothing for an order still live, one the broker no longer knows, or one never placed", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "live", clientOrderId: `${PREFIX}NVDA-a-1`, underlying: "NVDA" });
    pending.add({ orderId: "gone", clientOrderId: `${PREFIX}AMD-a-2`, underlying: "AMD" });
    pending.add({ clientOrderId: `${PREFIX}TSLA-a-3`, underlying: "TSLA" });
    broker.reads.set("live", [anOrder({ id: "live", status: "new" })]);
    broker.reads.set("gone", [new AlpacaApiError(404, null)]);
    broker.lookups.push(undefined);
    const { flow, settled } = flowOver(broker, pending);

    expect([...(await flow.settle())]).toEqual(["NVDA"]);
    expect(settled).toEqual([]);
  });

  it("resolves an order whose POST answer was lost by its stamp, and reports it with both ids", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    broker.lookups.push(
      anOrder({ id: "landed", status: "canceled", filled_qty: "1", filled_avg_price: "2.00" }),
    );
    const { flow, settled } = flowOver(broker, pending);

    await flow.settle();
    expect(settled).toMatchObject([
      {
        orderId: "landed",
        clientOrderId: `${PREFIX}CRWV-a-0`,
        status: "filled",
        filledQuantity: 1,
      },
    ]);
  });

  it("a listener that throws never keeps an ended order pending", async () => {
    const broker = new FakeOptionBroker();
    const pending = new PendingOptionOrders();
    pending.add({ orderId: "late", clientOrderId: `${PREFIX}CRWV-a-0`, underlying: "CRWV" });
    broker.reads.set("late", [anOrder({ id: "late", status: "canceled" })]);
    const { flow } = flowOver(broker, pending, () => {
      throw new Error("disk full");
    });

    expect([...(await flow.settle())]).toEqual([]);
    expect(pending.list()).toEqual([]);
  });
});

/** Each GET path answers its scripted sequence in turn (the last repeats); a POST answers once. */
class ScriptedTransport implements AlpacaTradingTransport {
  readonly gets: string[] = [];
  readonly deletes: string[] = [];
  constructor(
    private readonly posts: Record<string, JsonResponse>,
    private readonly sequences: Record<string, JsonResponse[]>,
  ) {}
  get(path: string): Promise<JsonResponse> {
    this.gets.push(path);
    const sequence = this.sequences[path];
    const next = sequence && sequence.length > 1 ? sequence.shift() : sequence?.[0];
    return Promise.resolve(next ?? { status: 404, body: null });
  }
  post(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.posts[path] ?? { status: 404, body: null });
  }
  delete(path: string): Promise<JsonResponse> {
    this.deletes.push(path);
    return Promise.resolve({ status: 204, body: null });
  }
}

describe("AlpacaBrokerAdapter.settleShares — a share order queued for the open", () => {
  const buy: OrderIntent = {
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    type: "market",
    reason: "t",
  };
  const order = (over: Record<string, unknown>) => ({
    status: 200,
    body: { id: "sh-1", symbol: "NVDA", qty: "10", side: "buy", ...over },
  });

  function adapterOver(sequence: JsonResponse[]) {
    const transport = new ScriptedTransport(
      { "/v2/orders": order({ status: "accepted" }) },
      { "/v2/orders/sh-1": sequence },
    );
    const settled: OrderSettlement[] = [];
    const pendingShares = new PendingShareOrders();
    const adapter = new AlpacaBrokerAdapter(new AlpacaTradingClient(transport), {
      sleep: () => Promise.resolve(),
      fillPollAttempts: 1,
      pendingShares,
      onSettled: (s) => settled.push(s),
      now: () => new Date(AT),
    });
    return { adapter, transport, settled, pendingShares };
  }

  it("keeps re-reading it, never cancels it, and reports its fill once the broker ends it", async () => {
    const { adapter, transport, settled, pendingShares } = adapterOver([
      order({ status: "accepted", filled_qty: "0" }), // the submit's own poll
      order({ status: "accepted", filled_qty: "0" }), // the next cycle: still queued
      order({ status: "filled", filled_qty: "10", filled_avg_price: "100.25" }),
    ]);
    expect((await adapter.submit(buy)).status).toBe("working");
    expect(pendingShares.list()).toEqual([{ orderId: "sh-1", symbol: "NVDA" }]);

    await adapter.settleShares();
    expect(settled).toEqual([]);
    await adapter.settleShares();
    await adapter.settleShares();

    expect(settled).toEqual([
      {
        orderId: "sh-1",
        status: "filled",
        filledQuantity: 10,
        filledPrice: 100.25,
        settledAt: AT,
      },
    ]);
    expect(pendingShares.list()).toEqual([]);
    expect(transport.deletes).toEqual([]);
  });

  it("reads one that ended with nothing filled as rejected, as the submit itself would have", async () => {
    const { adapter, settled } = adapterOver([
      order({ status: "accepted", filled_qty: "0" }),
      order({ status: "canceled", filled_qty: "0" }),
    ]);
    await adapter.submit(buy);
    await adapter.settleShares();
    expect(settled).toEqual([
      { orderId: "sh-1", status: "rejected", filledQuantity: 0, settledAt: AT },
    ]);
  });

  it("forgets one the broker no longer knows, and keeps one whose read failed", async () => {
    const gone = adapterOver([order({ status: "accepted" }), { status: 404, body: null }]);
    await gone.adapter.submit(buy);
    await gone.adapter.settleShares();
    expect(gone.pendingShares.list()).toEqual([]);
    expect(gone.settled).toEqual([]);

    const blip = adapterOver([order({ status: "accepted" }), { status: 503, body: null }]);
    await blip.adapter.submit(buy);
    await blip.adapter.settleShares();
    expect(blip.pendingShares.list()).toHaveLength(1);
  });

  it("tracks nothing for an order that filled inside the submit's own poll", async () => {
    const { adapter, pendingShares } = adapterOver([
      order({ status: "filled", filled_qty: "10", filled_avg_price: "100" }),
    ]);
    expect((await adapter.submit(buy)).status).toBe("filled");
    expect(pendingShares.list()).toEqual([]);
  });
});
