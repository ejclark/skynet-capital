import { AlpacaBrokerAdapter } from "../../src/adapters/alpaca-broker-adapter.js";
import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { anOptionIntent } from "../support/builders.js";

class FakeTradingTransport implements AlpacaTradingTransport {
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  get(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  post(path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
  delete(path: string): Promise<JsonResponse> {
    return Promise.resolve(this.responses[path] ?? { status: 404, body: null });
  }
}

/** Like `FakeTradingTransport`, but a GET path can be scripted to answer DIFFERENTLY each call —
 *  the `pollFill` retry loop's own test needs "unfilled, then filled" from the SAME `getOrder` id. */
class SequencedGetTransport implements AlpacaTradingTransport {
  private readonly getCallsByPath = new Map<string, number>();
  constructor(
    private readonly postResponses: Record<string, JsonResponse>,
    private readonly getSequences: Record<string, readonly JsonResponse[]>,
  ) {}
  get(path: string): Promise<JsonResponse> {
    const n = this.getCallsByPath.get(path) ?? 0;
    this.getCallsByPath.set(path, n + 1);
    const sequence = this.getSequences[path] ?? [];
    return Promise.resolve(
      sequence[Math.min(n, sequence.length - 1)] ?? { status: 404, body: null },
    );
  }
  post(path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve(this.postResponses[path] ?? { status: 404, body: null });
  }
  delete(): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
}

const adapterWith = (
  responses: Record<string, JsonResponse>,
  deps?: ConstructorParameters<typeof AlpacaBrokerAdapter>[1],
): AlpacaBrokerAdapter =>
  new AlpacaBrokerAdapter(new AlpacaTradingClient(new FakeTradingTransport(responses)), deps);

const buy: OrderIntent = { symbol: "EEM", side: "buy", quantity: 100, type: "market", reason: "t" };

describe("AlpacaBrokerAdapter", () => {
  describe("getPortfolio", () => {
    it("maps Alpaca's string-typed account and positions into the domain Portfolio", async () => {
      const adapter = adapterWith({
        "/v2/account": {
          status: 200,
          body: { id: "a1", cash: "4000000", portfolio_value: "5000000", status: "ACTIVE" },
        },
        "/v2/positions": {
          status: 200,
          body: [{ symbol: "EEM", qty: "500", avg_entry_price: "42.10", market_value: "21050" }],
        },
      });

      const portfolio = await adapter.getPortfolio();

      expect(portfolio.cash).toBe(4_000_000);
      expect(portfolio.positions[0]).toEqual({
        symbol: "EEM",
        quantity: 500,
        avgPrice: 42.1,
        marketValue: 21_050,
      });
    });

    it("keeps an option row's broker market value — the dollar mark the price stream never quotes (#4643)", async () => {
      const adapter = adapterWith({
        "/v2/account": {
          status: 200,
          body: { id: "a1", cash: "10000", portfolio_value: "10500", status: "ACTIVE" },
        },
        "/v2/positions": {
          status: 200,
          // Alpaca: qty in contracts, avg_entry_price PER SHARE, market_value in total dollars.
          body: [
            {
              symbol: "NVDA261113C00240000",
              qty: "1",
              avg_entry_price: "4.50",
              market_value: "500",
            },
          ],
        },
      });

      const [option] = (await adapter.getPortfolio()).positions;

      expect(option).toEqual({
        symbol: "NVDA261113C00240000",
        quantity: 1,
        avgPrice: 4.5,
        marketValue: 500,
      });
    });

    it("leaves marketValue off when the broker sends none, so valuation falls back to cost", async () => {
      const adapter = adapterWith({
        "/v2/account": {
          status: 200,
          body: { id: "a1", cash: "10000", portfolio_value: "10000", status: "ACTIVE" },
        },
        "/v2/positions": {
          status: 200,
          body: [
            { symbol: "EEM", qty: "5", avg_entry_price: "42.10", market_value: "" },
            { symbol: "SPY", qty: "1", avg_entry_price: "500", market_value: null },
          ],
        },
      });

      const [eem, spy] = (await adapter.getPortfolio()).positions;

      // A null would otherwise parse to a $0 mark and value the holding at nothing.
      expect(eem).toEqual({ symbol: "EEM", quantity: 5, avgPrice: 42.1 });
      expect(spy).toEqual({ symbol: "SPY", quantity: 1, avgPrice: 500 });
    });
  });

  describe("submit", () => {
    it("rejects an option order, and a share-shaped order naming a contract, without calling the broker", async () => {
      let calls = 0;
      const counting: AlpacaTradingTransport = {
        get: () => {
          calls++;
          return Promise.resolve({ status: 404, body: null });
        },
        post: () => {
          calls++;
          return Promise.resolve({ status: 404, body: null });
        },
        delete: () => {
          calls++;
          return Promise.resolve({ status: 404, body: null });
        },
      };
      const adapter = new AlpacaBrokerAdapter(new AlpacaTradingClient(counting));
      const bare: OrderIntent = { ...buy, symbol: "EEM261120C00050000", quantity: 1 };

      for (const order of [anOptionIntent(), bare]) {
        expect(await adapter.submit(order)).toEqual({
          intent: order,
          status: "rejected",
          reason: "option orders are not wired to the broker yet",
        });
      }
      expect(calls).toBe(0);
    });

    it("reports working, never filled, when the fill poll never sees the order (#4655)", async () => {
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
          // No "/v2/orders/o1" entry — getOrder 404s every attempt, same as an unfindable id.
        },
        { sleep: () => Promise.resolve() },
      );

      const result = await adapter.submit(buy);

      // Nothing confirmed a fill, so the placement response's own status is all there is to say.
      expect(result).toEqual({
        intent: buy,
        status: "working",
        reason: "order accepted",
        orderId: "o1",
      });
    });

    // #4655 EARS 3/4: the poll reads the order fine, it just has not traded — a queued after-hours
    // market order sits at "accepted" until the open; "new", "held" and "pending_new" are the
    // other live states a slow fill passes through.
    for (const brokerStatus of ["accepted", "new", "held", "pending_new"]) {
      it(`reports a live ${brokerStatus} order as working with the broker's status`, async () => {
        const adapter = adapterWith(
          {
            "/v2/orders": {
              status: 200,
              body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
            },
            "/v2/orders/o1": {
              status: 200,
              body: { id: "o1", status: brokerStatus, filled_qty: "0", filled_avg_price: null },
            },
          },
          { sleep: () => Promise.resolve() },
        );

        const result = await adapter.submit(buy);

        expect(result).toEqual({
          intent: buy,
          status: "working",
          reason: `order ${brokerStatus}`,
          orderId: "o1",
        });
      });
    }

    // #4655 EARS 2: the order was taken, then ended before anything traded.
    for (const brokerStatus of ["canceled", "expired", "rejected"]) {
      it(`reports an order the broker ${brokerStatus} with nothing filled as rejected, keeping its id`, async () => {
        let reads = 0;
        const transport = new SequencedGetTransport(
          {
            "/v2/orders": {
              status: 200,
              body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
            },
          },
          {
            "/v2/orders/o1": [
              { status: 200, body: { id: "o1", status: brokerStatus, filled_qty: "0" } },
            ],
          },
        );
        const counting: AlpacaTradingTransport = {
          get: (path) => {
            reads++;
            return transport.get(path);
          },
          post: (path, body) => transport.post(path, body),
          delete: () => transport.delete(),
        };
        const adapter = new AlpacaBrokerAdapter(new AlpacaTradingClient(counting), {
          sleep: () => Promise.resolve(),
        });

        const result = await adapter.submit(buy);

        expect(result).toEqual({
          intent: buy,
          status: "rejected",
          reason: `order ${brokerStatus}`,
          orderId: "o1",
        });
        // An ended order will not change, so the poll stops at the first read that says so.
        expect(reads).toBe(1);
      });
    }

    // #4655 EARS 1: a partial fill is a fill of what filled, never of what was asked.
    it("reports a partial fill as filled with the quantity and price the broker confirmed", async () => {
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
          "/v2/orders/o1": {
            status: 200,
            body: {
              id: "o1",
              status: "partially_filled",
              filled_qty: "40",
              filled_avg_price: "42.15",
            },
          },
        },
        { sleep: () => Promise.resolve() },
      );

      const result = await adapter.submit(buy);

      expect(result).toEqual({
        intent: buy,
        status: "filled",
        filledQuantity: 40,
        filledPrice: 42.15,
        orderId: "o1",
      });
    });

    it("reports a canceled order that partly filled as filled with what traded", async () => {
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
          "/v2/orders/o1": {
            status: 200,
            body: { id: "o1", status: "canceled", filled_qty: "25", filled_avg_price: "42.00" },
          },
        },
        { sleep: () => Promise.resolve() },
      );

      expect(await adapter.submit(buy)).toMatchObject({
        status: "filled",
        filledQuantity: 25,
        filledPrice: 42,
      });
    });

    it("polls getOrder and captures the real fill price once Alpaca reports it (#2287 PR 7 prerequisite)", async () => {
      const transport = new SequencedGetTransport(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
        },
        {
          // Unfilled on the first getOrder, then a real fill on the retry.
          "/v2/orders/o1": [
            { status: 200, body: { id: "o1", status: "new" } },
            {
              status: 200,
              body: { id: "o1", status: "filled", filled_qty: "100", filled_avg_price: "176.42" },
            },
          ],
        },
      );
      const client = new AlpacaTradingClient(transport);
      const adapter = new AlpacaBrokerAdapter(client, { sleep: () => Promise.resolve() });

      const result = await adapter.submit(buy);

      // #4655 EARS 5: a fill the poll sees is reported exactly as before — the whole object.
      expect(result).toEqual({
        intent: buy,
        status: "filled",
        filledQuantity: 100,
        filledPrice: 176.42,
        orderId: "o1",
      });
    });

    it("a throwing getOrder poll never turns a live order into a rejection — it stays working", async () => {
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
          "/v2/orders/o1": { status: 500, body: { message: "boom" } },
        },
        { sleep: () => Promise.resolve() },
      );

      const result = await adapter.submit(buy);

      expect(result).toMatchObject({ status: "working", reason: "order accepted", orderId: "o1" });
      expect(result.filledQuantity).toBeUndefined();
      expect(result.filledPrice).toBeUndefined();
    });

    it("carries the broker's order id even on a same-request rejection (#885)", async () => {
      // A "rejected"/"canceled" status still means the broker CREATED an order object — its id is
      // the join key `playbook-attribution.ts` needs, so it must survive here too.
      const adapter = adapterWith({
        "/v2/orders": {
          status: 200,
          body: { id: "o2", symbol: "EEM", qty: "100", side: "buy", status: "rejected" },
        },
      });

      const result = await adapter.submit(buy);

      expect(result).toMatchObject({ status: "rejected", orderId: "o2" });
    });

    it("reports a rejected result with no order id when the API errors before creating one", async () => {
      const adapter = adapterWith({
        "/v2/orders": { status: 403, body: { message: "insufficient buying power" } },
      });

      const result = await adapter.submit(buy);

      expect(result.status).toBe("rejected");
      expect(result.reason).toContain("403");
      expect(result.orderId).toBeUndefined();
    });

    it("fires onSubmitted with the broker's own order id once an order is accepted (#1211 slice 2)", async () => {
      const submitted: unknown[] = [];
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
        },
        {
          onSubmitted: (info) => submitted.push(info),
          now: () => new Date("2026-09-04T12:00:00.000Z"),
        },
      );

      const result = await adapter.submit(buy);

      expect(result.status).toBe("working");
      expect(submitted).toEqual([
        {
          orderId: "o1",
          symbol: "EEM",
          side: "buy",
          quantity: 100,
          at: "2026-09-04T12:00:00.000Z",
        },
      ]);
    });

    it("never fires onSubmitted for a rejected or canceled order", async () => {
      const submitted: unknown[] = [];
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", side: "buy", status: "rejected" },
          },
        },
        { onSubmitted: (info) => submitted.push(info) },
      );

      await adapter.submit(buy);

      expect(submitted).toEqual([]);
    });

    it("a throwing onSubmitted never turns a real fill into a reported rejection", async () => {
      const adapter = adapterWith(
        {
          "/v2/orders": {
            status: 200,
            body: { id: "o1", symbol: "EEM", qty: "100", side: "buy", status: "accepted" },
          },
          "/v2/orders/o1": {
            status: 200,
            body: { id: "o1", status: "filled", filled_qty: "100", filled_avg_price: "42.10" },
          },
        },
        {
          onSubmitted: () => {
            throw new Error("listener boom");
          },
          sleep: () => Promise.resolve(),
        },
      );

      const result = await adapter.submit(buy);

      expect(result).toMatchObject({ status: "filled", filledQuantity: 100, filledPrice: 42.1 });
    });
  });
});
