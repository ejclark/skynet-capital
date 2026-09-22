import type { AlpacaOrder } from "../../src/alpaca/alpaca-trading-client.js";
import {
  deskOrderRow,
  deskOrdersView,
  RECENT_WINDOW_MS,
} from "../../src/server/desk-orders-view.js";

/**
 * The working-orders view is a pure projection over the broker's order record (#3407 P1): the
 * broker's status alphabet collapses to six words a member can read, a cancel is offered exactly
 * when it can still reach the broker, and a settled order stays in `recent` for one day so the
 * row a member just submitted keeps telling its story.
 */

const NOW = Date.parse("2026-09-21T15:00:00.000Z");
const ago = (ms: number): string => new Date(NOW - ms).toISOString();

const order = (over: Partial<AlpacaOrder> = {}): AlpacaOrder => ({
  id: "o1",
  symbol: "NVDA",
  qty: "10",
  side: "buy",
  status: "new",
  submitted_at: ago(60_000),
  ...over,
});

describe("deskOrderRow — the broker's status alphabet as six honest words", () => {
  it.each([
    ["new", "working", true],
    ["accepted", "working", true],
    ["pending_new", "working", true],
    ["held", "working", true],
    ["pending_cancel", "working", true],
    ["partially_filled", "partial", true],
    ["filled", "filled", false],
    ["canceled", "cancelled", false],
    ["done_for_day", "cancelled", false],
    ["rejected", "rejected", false],
    ["expired", "expired", false],
    ["replaced", "replaced", false],
    ["pending_replace", "working", true],
  ])("%s → %s (cancelable: %s)", (status, state, cancelable) => {
    expect(deskOrderRow(order({ status }))).toMatchObject({ state, cancelable });
  });

  it("marks a working limit or stop replaceable, never a market order or a settled one (P1 1b)", () => {
    expect(deskOrderRow(order({ status: "accepted", type: "limit" }))?.replaceable).toBe(true);
    expect(deskOrderRow(order({ status: "partially_filled", type: "stop" }))?.replaceable).toBe(
      true,
    );
    expect(deskOrderRow(order({ status: "accepted", type: "market" }))?.replaceable).toBe(false);
    expect(deskOrderRow(order({ status: "filled", type: "limit" }))?.replaceable).toBe(false);
  });

  it("carries the broker's id lineage both ways", () => {
    const old = deskOrderRow(order({ status: "replaced", replaced_by: "o-9" }));
    expect(old).toMatchObject({ state: "replaced", replacedBy: "o-9" });
    expect(old?.replaces).toBeUndefined();
    const fresh = deskOrderRow(order({ status: "accepted", replaces: "o-1" }));
    expect(fresh).toMatchObject({ state: "working", replaces: "o-1" });
  });

  it("drops a status it cannot name rather than mislabelling it", () => {
    expect(deskOrderRow(order({ status: "something_new_from_the_broker" }))).toBeUndefined();
  });

  it("carries the prices, the time in force and the fill as numbers, never strings", () => {
    const row = deskOrderRow(
      order({
        status: "partially_filled",
        type: "limit",
        limit_price: "118.50",
        time_in_force: "GTC",
        filled_qty: "4",
        filled_avg_price: "118.40",
      }),
    );
    expect(row).toMatchObject({
      orderType: "limit",
      limitPrice: 118.5,
      timeInForce: "gtc",
      quantity: 10,
      filledQuantity: 4,
      avgFillPrice: 118.4,
    });
    expect(row?.stopPrice).toBeUndefined();
  });

  it("reads a record that predates the TIF field without inventing one", () => {
    expect(deskOrderRow(order())?.timeInForce).toBeUndefined();
  });

  it("stamps settledAt from the fill for a fill and from the cancel for a cancel", () => {
    expect(deskOrderRow(order({ status: "filled", filled_at: ago(1) }))?.settledAt).toBe(ago(1));
    expect(deskOrderRow(order({ status: "canceled", canceled_at: ago(2) }))?.settledAt).toBe(
      ago(2),
    );
  });
});

describe("deskOrdersView — working vs recent", () => {
  it("splits live orders from settled ones and keeps a day of the settled", () => {
    const view = deskOrdersView(
      [
        order({ id: "w", status: "accepted" }),
        order({ id: "p", status: "partially_filled", submitted_at: ago(120_000) }),
        order({ id: "f", status: "filled", filled_at: ago(3_600_000) }),
        order({ id: "old", status: "filled", filled_at: ago(RECENT_WINDOW_MS + 1) }),
      ],
      NOW,
    );
    expect(view.working.map((r) => r.id)).toEqual(["w", "p"]);
    expect(view.recent.map((r) => r.id)).toEqual(["f"]);
  });

  it("orders each list newest submission first", () => {
    const view = deskOrdersView(
      [
        order({ id: "older", submitted_at: ago(300_000) }),
        order({ id: "newer", submitted_at: ago(10_000) }),
      ],
      NOW,
    );
    expect(view.working.map((r) => r.id)).toEqual(["newer", "older"]);
  });

  it("leaves a settled order with no stamp at all out of recent — it cannot claim to be recent", () => {
    const view = deskOrdersView(
      [order({ id: "x", status: "filled", submitted_at: undefined, filled_at: null })],
      NOW,
    );
    expect(view.recent).toEqual([]);
  });

  it("is honestly empty on an empty broker list", () => {
    expect(deskOrdersView([], NOW)).toEqual({ working: [], recent: [] });
  });
});
