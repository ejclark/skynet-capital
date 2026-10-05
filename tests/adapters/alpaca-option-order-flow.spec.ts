import { AlpacaApiError } from "../../src/alpaca/alpaca-trading-client.js";
import type { OptionOrderIntent, OrderIntent } from "../../src/domain/types.js";
import { anOptionIntent } from "../support/builders.js";
import {
  anOrder,
  FakeOptionBroker,
  flowOver,
  LONG_CALL,
  PREFIX,
  PUT,
  SHORT_CALL,
} from "../support/fake-option-broker.js";

// The bots' option submit algorithm (#4642 slice 5), one branch per spec: refuse unstamped →
// adopt by client order id → fresh preflight (level, no stacking, book, quote) → place one leg or
// one mleg → adopt on a failed POST → wait → cancel → report what the broker last said.

const CID = `${PREFIX}CRWV-mg1x2-0`;
const NVDA_CID = `${PREFIX}NVDA-mg1x2-1`;

/** One cash-secured CRWV put, stamped. */
const put = (over: Partial<OrderIntent> = {}): OrderIntent =>
  anOptionIntent({ clientOrderId: CID, ...over });

/** Buying the CRWV put back. */
const putClose = (): OrderIntent =>
  anOptionIntent({
    side: "buy",
    clientOrderId: CID,
    option: {
      effect: "close",
      structure: "close",
      legs: [{ occSymbol: PUT, side: "buy", ratio: 1 }],
      limitPrice: 2.1,
    },
  });

const spread = (option: Partial<OptionOrderIntent> = {}, over: Partial<OrderIntent> = {}) =>
  anOptionIntent({
    symbol: "NVDA",
    side: "buy",
    clientOrderId: NVDA_CID,
    playbookId: "NVDA-CALL-SPREAD",
    ...over,
    option: {
      effect: "open",
      structure: "call-debit-spread",
      legs: [
        { occSymbol: LONG_CALL, side: "buy", ratio: 1 },
        { occSymbol: SHORT_CALL, side: "sell", ratio: 1 },
      ],
      limitPrice: 4,
      band: { low: 3.7, high: 4.1, at: "2026-10-07T14:59:30Z" },
      ...option,
    },
  });

/** Closing the spread as one mleg order, for a net credit. */
const spreadClose = () =>
  spread(
    {
      effect: "close",
      structure: "close",
      legs: [
        { occSymbol: LONG_CALL, side: "sell", ratio: 1 },
        { occSymbol: SHORT_CALL, side: "buy", ratio: 1 },
      ],
      limitPrice: -3.9,
    },
    { side: "sell" },
  );

function withSpreadQuotes(broker: FakeOptionBroker): FakeOptionBroker {
  broker.snapshots.set(LONG_CALL, { bid: 9.8, ask: 10, quotedAt: "2026-10-07T14:59:30Z" });
  broker.snapshots.set(SHORT_CALL, { bid: 5.9, ask: 6.1, quotedAt: "2026-10-07T14:59:30Z" });
  return broker;
}

const shortPut = {
  symbol: PUT,
  qty: "1",
  side: "short",
  avg_entry_price: "2.10",
  market_value: "-200",
};

/** A fake whose placed order fills on the first poll. */
function filling(over: Partial<ReturnType<typeof anOrder>> = {}): FakeOptionBroker {
  const broker = new FakeOptionBroker();
  broker.reads.set("o1", [
    anOrder({ status: "filled", filled_qty: "1", filled_avg_price: "2.10", ...over }),
  ]);
  return broker;
}

describe("AlpacaOptionOrderFlow.submit", () => {
  it("0 · refuses an order with no client order id, touching nothing", async () => {
    const broker = new FakeOptionBroker();
    const result = await flowOver(broker).flow.submit(anOptionIntent());
    expect(result).toMatchObject({ status: "rejected", reason: "unstamped option order" });
    expect(broker.calls).toEqual([]);
  });

  it("1 · adopts an order already carrying this client order id — no preflight, no second POST", async () => {
    const broker = filling();
    broker.byClientId.set(CID, anOrder({ status: "new" }));
    const result = await flowOver(broker).flow.submit(put());
    expect(result).toMatchObject({ status: "filled", filledQuantity: 1, orderId: "o1" });
    expect(broker.calls).not.toContain("getAccount");
    expect(broker.placedSingle).toEqual([]);
  });

  describe("2 · preflight on fresh broker state", () => {
    it("refuses an open the account's options level does not allow", async () => {
      const broker = new FakeOptionBroker();
      broker.account = { ...broker.account, options_trading_level: "0" };
      const result = await flowOver(broker).flow.submit(put());
      expect(result).toMatchObject({
        status: "rejected",
        reason: "options level 0 is below the 1 this order needs",
      });
      expect(broker.placedSingle).toEqual([]);
    });

    it("refuses an open when the level cannot be read, and never gates a close on it", async () => {
      const broker = filling({ side: "buy" });
      broker.account = { ...broker.account, options_trading_level: undefined };
      broker.positions = [shortPut];
      expect((await flowOver(broker).flow.submit(put())).reason).toBe(
        "the account's options approval level could not be read",
      );
      expect((await flowOver(broker).flow.submit(putClose())).status).toBe("filled");
    });

    it("refuses to stack an open on an underlying with any order working — a share order or a spread leg", async () => {
      for (const working of [
        anOrder({ id: "s1", symbol: "CRWV", side: "buy", client_order_id: "desk-123" }),
        anOrder({
          id: "m1",
          symbol: "",
          legs: [anOrder({ id: "l1", symbol: "CRWV261120C00100000" })],
        }),
      ]) {
        const broker = new FakeOptionBroker();
        broker.open = [working];
        const result = await flowOver(broker).flow.submit(put());
        expect(result.reason).toBe("an order is already working on CRWV — not stacking");
        expect(broker.calls).not.toContain(`cancel ${working.id}`);
      }
    });

    it("before a close, cancels OUR working order on the underlying (never anyone else's) and re-reads positions", async () => {
      const broker = filling({ side: "buy" });
      broker.positions = [shortPut];
      broker.open = [
        anOrder({ id: "ours", client_order_id: `${PREFIX}CRWV-mg0aa-0` }),
        anOrder({ id: "desk", symbol: "CRWV", side: "buy", client_order_id: "desk-9" }),
      ];
      broker.reads.set("ours", [anOrder({ id: "ours", status: "canceled" })]);
      const result = await flowOver(broker).flow.submit(putClose());
      expect(broker.calls).toContain("cancel ours");
      expect(broker.calls).not.toContain("cancel desk");
      expect(broker.calls.filter((c) => c === "getPositions")).toHaveLength(2);
      expect(result.status).toBe("filled");
    });

    it("refuses a close when our own earlier order will not cancel", async () => {
      const broker = new FakeOptionBroker();
      broker.positions = [shortPut];
      broker.open = [anOrder({ id: "ours", client_order_id: `${PREFIX}CRWV-mg0aa-0` })];
      broker.reads.set("ours", [anOrder({ id: "ours", status: "pending_cancel" })]);
      const result = await flowOver(broker).flow.submit(putClose());
      expect(result.reason).toBe("an earlier order on CRWV would not cancel — not stacking");
      expect(broker.placedSingle).toEqual([]);
    });

    it("re-checks the book on fresh positions with the guards' words", async () => {
      const broker = new FakeOptionBroker();
      broker.account = { ...broker.account, cash: "8000" };
      expect((await flowOver(broker).flow.submit(put())).reason).toBe(
        "not enough free cash to secure the sold put",
      );
      broker.positions = [];
      expect((await flowOver(broker).flow.submit(putClose())).reason).toBe("nothing held to close");
    });

    it("bounds an open by Alpaca's own options buying power when the account reports one", async () => {
      const broker = new FakeOptionBroker();
      broker.account = { ...broker.account, options_buying_power: "5000" };
      expect((await flowOver(broker).flow.submit(put())).reason).toBe(
        "options buying power $5000.00 is below the $8500.00 this order needs",
      );
    });

    it("refuses when the quote moved and the limit no longer sits inside it", async () => {
      const broker = new FakeOptionBroker();
      broker.snapshots.set(PUT, { bid: 2.2, ask: 2.35, quotedAt: "2026-10-07T14:59:30Z" });
      const result = await flowOver(broker).flow.submit(put());
      expect(result).toMatchObject({
        status: "rejected",
        reason: "quote moved: limit 2.10 outside [2.20, 2.35]",
      });
    });

    it("refuses an open on a stale or unstamped quote; a close may use an unstamped one", async () => {
      const broker = filling({ side: "buy" });
      broker.positions = [shortPut];
      broker.snapshots.set(PUT, { bid: 2, ask: 2.2, quotedAt: "2026-10-07T14:40:00Z" });
      expect((await flowOver(broker).flow.submit(put())).reason).toBe(
        `the quote on ${PUT} is stale`,
      );
      broker.snapshots.set(PUT, { bid: 2, ask: 2.2 });
      expect((await flowOver(broker).flow.submit(put())).reason).toBe(
        `the quote on ${PUT} carries no time`,
      );
      expect((await flowOver(broker).flow.submit(putClose())).status).toBe("filled");
    });

    it("refuses when the account cannot be re-read — never sends on stale state", async () => {
      const broker = new FakeOptionBroker();
      broker.accountError = new Error("ECONNRESET");
      const result = await flowOver(broker).flow.submit(put());
      expect(result.reason).toBe(
        "could not re-check the account before sending: Error: ECONNRESET",
      );
      expect(broker.placedSingle).toEqual([]);
    });
  });

  describe("3 · place", () => {
    it("sends one leg as a DAY limit with its position intent and the client order id", async () => {
      const broker = filling();
      await flowOver(broker).flow.submit(put());
      expect(broker.placedSingle).toEqual([
        {
          occSymbol: PUT,
          contracts: 1,
          side: "sell",
          type: "limit",
          limitPrice: 2.1,
          positionIntent: "sell_to_open",
          timeInForce: "day",
          clientOrderId: CID,
        },
      ]);
    });

    it("sends two legs as ONE mleg order, the signed net limit exactly as decided", async () => {
      const broker = withSpreadQuotes(filling());
      broker.positions = [
        { symbol: LONG_CALL, qty: "1", side: "long", avg_entry_price: "8", market_value: "990" },
        { symbol: SHORT_CALL, qty: "1", side: "short", avg_entry_price: "4", market_value: "-600" },
      ];
      await flowOver(broker).flow.submit(spreadClose());
      expect(broker.placedMulti).toEqual([
        {
          legs: [
            { occSymbol: LONG_CALL, ratioQty: 1, side: "sell", positionIntent: "sell_to_close" },
            { occSymbol: SHORT_CALL, ratioQty: 1, side: "buy", positionIntent: "buy_to_close" },
          ],
          quantity: 1,
          netLimitPrice: -3.9,
          timeInForce: "day",
          clientOrderId: NVDA_CID,
        },
      ]);
    });

    it("looks a failed POST up by its client order id and adopts it when it landed", async () => {
      const broker = filling();
      broker.placeAnswer = new AlpacaApiError(422, { message: "client_order_id must be unique" });
      broker.afterPost = anOrder({ status: "new" });
      const result = await flowOver(broker).flow.submit(put());
      expect(result).toMatchObject({ status: "filled", orderId: "o1" });
    });

    it("reports a failed POST that never landed as rejected, with the broker's words", async () => {
      const broker = new FakeOptionBroker();
      broker.placeAnswer = new Error("socket hang up");
      const result = await flowOver(broker).flow.submit(put());
      expect(result).toEqual({
        intent: put(),
        status: "rejected",
        reason: "Error: socket hang up",
      });
    });
  });

  it("4 · an order the broker rejected on arrival is rejected, with its id, and announced to no one", async () => {
    const broker = new FakeOptionBroker();
    broker.placeAnswer = anOrder({ status: "rejected" });
    const { flow, submitted } = flowOver(broker);
    expect(await flow.submit(put())).toEqual({
      intent: put(),
      status: "rejected",
      reason: "order rejected",
      orderId: "o1",
    });
    expect(submitted).toEqual([]);
  });

  it("4 · announces a placed spread once per leg, each leg's own contract, side and id", async () => {
    const broker = withSpreadQuotes(new FakeOptionBroker());
    broker.placeAnswer = anOrder({
      id: "m1",
      symbol: "",
      legs: [anOrder({ id: "leg-a", symbol: LONG_CALL, side: "buy" })],
    });
    broker.reads.set("m1", [
      anOrder({ id: "m1", status: "filled", filled_qty: "1", filled_avg_price: "4.00" }),
    ]);
    const { flow, submitted } = flowOver(broker);
    await flow.submit(spread());
    expect(submitted.map(({ at: _at, ...rest }) => rest)).toEqual([
      { orderId: "leg-a", symbol: LONG_CALL, side: "buy", quantity: 1 },
      { orderId: "m1#1", symbol: SHORT_CALL, side: "sell", quantity: 1 },
    ]);
  });

  describe("5–7 · wait, cancel, report", () => {
    it("waits for a fill and reports the broker's price and the leg's fill", async () => {
      const broker = new FakeOptionBroker();
      broker.reads.set("o1", [
        anOrder(),
        anOrder({ status: "filled", filled_qty: "1", filled_avg_price: "2.10" }),
      ]);
      const result = await flowOver(broker).flow.submit(put());
      expect(result).toEqual({
        intent: put(),
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.1,
        orderId: "o1",
        legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.1 }],
      });
      expect(broker.calls).not.toContain("cancel o1");
    });

    it("reports a partial fill as filled — what filled — once the remainder is canceled", async () => {
      const broker = withSpreadQuotes(new FakeOptionBroker());
      broker.placeAnswer = anOrder({ id: "m1", symbol: "", qty: "2" });
      broker.reads.set("m1", [
        anOrder({ id: "m1", symbol: "", qty: "2", status: "partially_filled", filled_qty: "1" }),
        anOrder({ id: "m1", symbol: "", qty: "2", status: "partially_filled", filled_qty: "1" }),
        anOrder({ id: "m1", symbol: "", qty: "2", status: "partially_filled", filled_qty: "1" }),
        anOrder({
          id: "m1",
          symbol: "",
          qty: "2",
          status: "canceled",
          filled_qty: "1",
          legs: [
            anOrder({
              id: "a",
              symbol: LONG_CALL,
              side: "buy",
              filled_qty: "1",
              filled_avg_price: "10.00",
            }),
            anOrder({
              id: "b",
              symbol: SHORT_CALL,
              side: "sell",
              filled_qty: "1",
              filled_avg_price: "6.05",
            }),
          ],
        }),
      ]);
      const result = await flowOver(broker).flow.submit(spread({}, { quantity: 2 }));
      expect(broker.calls).toContain("cancel m1");
      expect(result).toMatchObject({
        status: "filled",
        filledQuantity: 1,
        filledPrice: 3.95,
        reason: "partial fill; remainder canceled",
        legFills: [
          { occSymbol: LONG_CALL, filledQuantity: 1, filledPrice: 10 },
          { occSymbol: SHORT_CALL, filledQuantity: 1, filledPrice: 6.05 },
        ],
      });
    });

    it("cancels a limit that was not reached and reports it unfilled", async () => {
      const broker = new FakeOptionBroker();
      broker.reads.set("o1", [anOrder(), anOrder(), anOrder(), anOrder({ status: "canceled" })]);
      const { flow, pending } = flowOver(broker);
      const result = await flow.submit(put());
      expect(broker.calls).toContain("cancel o1");
      expect(result).toEqual({
        intent: put(),
        status: "unfilled",
        reason: "limit $2.10 not reached in 3s; canceled",
        orderId: "o1",
      });
      expect(pending.list()).toEqual([]);
    });

    it("reports a later broker rejection as rejected", async () => {
      const broker = new FakeOptionBroker();
      broker.reads.set("o1", [anOrder({ status: "rejected" })]);
      expect(await flowOver(broker).flow.submit(put())).toMatchObject({
        status: "rejected",
        reason: "order rejected",
        orderId: "o1",
      });
    });

    it("reports a cancel it could not confirm as working, and keeps the order pending", async () => {
      const broker = new FakeOptionBroker();
      broker.reads.set("o1", [anOrder({ status: "pending_cancel" })]);
      const { flow, pending } = flowOver(broker);
      const result = await flow.submit(put());
      expect(result).toMatchObject({
        status: "working",
        reason: "cancel not confirmed — rechecked next cycle",
        orderId: "o1",
      });
      expect(pending.list()).toEqual([{ orderId: "o1", clientOrderId: CID, underlying: "CRWV" }]);
    });
  });
});
