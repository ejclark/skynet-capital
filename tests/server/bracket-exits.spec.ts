import type { AlpacaOrder } from "../../src/alpaca/alpaca-trading-client.js";
import type { Participant } from "../../src/participants/participant.js";
import { bracketExitRoles, echoedExits } from "../../src/server/bracket-exits.js";
import { submitAndAudit } from "../../src/server/desk-gate.js";
import { deskOrdersView } from "../../src/server/desk-orders-view.js";

// #8249 PR 2: the receipt names a bracket's exits at the prices the broker echoed, and the orders
// list (read flat, each leg a row of its own) names each exit by its job.

const order = (over: Partial<AlpacaOrder>): AlpacaOrder =>
  ({
    id: "e1",
    symbol: "XLE",
    qty: "3",
    side: "buy",
    type: "limit",
    status: "filled",
    limit_price: "91",
    time_in_force: "gtc",
    order_class: "bracket",
    submitted_at: "2026-11-24T15:00:00Z",
    filled_at: "2026-11-24T15:00:01Z",
    ...over,
  }) as AlpacaOrder;

const entry = order({});
const takeProfit = order({ id: "e1-tp", side: "sell", status: "new", limit_price: "95" });
const stop = order({
  id: "e1-sl",
  side: "sell",
  type: "stop",
  status: "new",
  limit_price: null,
  stop_price: "85",
});

describe("echoedExits", () => {
  it("reads the take-profit and stop off the broker's legs", () => {
    expect(echoedExits([takeProfit, stop])).toEqual({ takeProfit: 95, stop: 85 });
  });

  it("is nothing unless both legs are there", () => {
    expect(echoedExits(null)).toBeUndefined();
    expect(echoedExits(undefined)).toBeUndefined();
    expect(echoedExits([takeProfit])).toBeUndefined();
  });

  it("reads a stop leg that carries a limit (stop_limit) by its stop price", () => {
    expect(echoedExits([takeProfit, { ...stop, type: "stop_limit", limit_price: "84.5" }])).toEqual(
      {
        takeProfit: 95,
        stop: 85,
      },
    );
  });
});

describe("bracketExitRoles", () => {
  it("names the stop and the take-profit, never the entry", () => {
    const roles = bracketExitRoles([entry, takeProfit, stop]);
    expect(roles.get("e1-tp")).toBe("take-profit");
    expect(roles.get("e1-sl")).toBe("stop");
    expect(roles.has("e1")).toBe(false);
  });

  it("names nothing on a simple order", () => {
    expect(bracketExitRoles([order({ order_class: "simple", side: "sell" })]).size).toBe(0);
  });

  it("leaves a limit unnamed when the symbol's brackets disagree on the exit side", () => {
    const shortStop = order({ id: "s1-sl", side: "buy", type: "stop", stop_price: "99" });
    const roles = bracketExitRoles([entry, takeProfit, stop, shortStop]);
    expect(roles.has("e1-tp")).toBe(false);
    expect(roles.get("e1-sl")).toBe("stop");
    expect(roles.get("s1-sl")).toBe("stop");
  });
});

describe("deskOrdersView with a bracket (#8249)", () => {
  it("lists both exits as working rows by their job, at the broker's prices", () => {
    const view = deskOrdersView([entry, takeProfit, stop], Date.parse("2026-11-24T16:00:00Z"));
    expect(view.working).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "e1-tp", exitRole: "take-profit", limitPrice: 95 }),
        expect.objectContaining({ id: "e1-sl", exitRole: "stop", stopPrice: 85 }),
      ]),
    );
    expect(view.recent).toEqual([expect.not.objectContaining({ exitRole: expect.anything() })]);
  });

  it("adds no field to a list with no bracket", () => {
    const simple = order({ order_class: "simple" });
    expect(
      deskOrdersView([simple], Date.parse("2026-11-24T16:00:00Z")).recent[0],
    ).not.toHaveProperty("exitRole");
  });
});

describe("submitAndAudit's answer (#8249)", () => {
  const participant = { id: "human-ann" } as Participant;

  it("carries the broker's echoed exits on a bracket", async () => {
    const result = await submitAndAudit(
      () => Promise.resolve({ ...order({ status: "accepted" }), legs: [takeProfit, stop] }),
      participant,
      {},
    );
    expect(result).toEqual({
      ok: true,
      orderId: "e1",
      status: "accepted",
      symbol: "XLE",
      timeInForce: "gtc",
      exits: { takeProfit: 95, stop: 85 },
    });
  });

  it("answers any other order exactly as before", async () => {
    const result = await submitAndAudit(
      () => Promise.resolve({ id: "o1", status: "accepted", symbol: "XLE", time_in_force: "day" }),
      participant,
      {},
    );
    expect(result).toEqual({
      ok: true,
      orderId: "o1",
      status: "accepted",
      symbol: "XLE",
      timeInForce: "day",
    });
  });
});
