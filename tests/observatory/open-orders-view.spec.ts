import type { AlpacaOrder } from "../../src/alpaca/alpaca-trading-client.js";
import { openOrdersPanel } from "../../src/observatory/open-orders-view.js";

const NOW = Date.parse("2026-08-27T12:00:00.000Z");
const secondsAgo = (n: number): string => new Date(NOW - n * 1000).toISOString();

const order = (over: Partial<AlpacaOrder> = {}): AlpacaOrder => ({
  id: "o1",
  symbol: "AAPL",
  qty: "5",
  side: "buy",
  status: "new",
  ...over,
});

describe("openOrdersPanel — undefined vs. empty (two different honest states)", () => {
  it("renders nothing when there's no trading client to ask (undefined, not empty)", () => {
    expect(openOrdersPanel(undefined, NOW)).toBe("");
  });

  it("renders the section with an honest empty state when there are genuinely no orders", () => {
    const html = openOrdersPanel([], NOW);
    expect(html).toContain("Open orders");
    expect(html).toContain("No open orders right now.");
  });
});

describe("openOrdersPanel — open orders", () => {
  it("shows a plain market order as Open, with a cancel button", () => {
    const html = openOrdersPanel([order({ status: "new" })], NOW);
    expect(html).toContain("AAPL");
    expect(html).toContain("BUY");
    expect(html).toContain("MARKET");
    expect(html).toContain(">Open<");
    expect(html).toContain('name="cancelOrder" value="o1"');
  });

  it("shows a limit order's price", () => {
    const html = openOrdersPanel(
      [order({ status: "accepted", type: "limit", limit_price: "118.5" })],
      NOW,
    );
    expect(html).toContain("LIMIT");
    expect(html).toContain("limit $118.50");
  });

  it("shows a stop order's price", () => {
    const html = openOrdersPanel(
      [order({ status: "new", side: "sell", type: "stop", stop_price: "90" })],
      NOW,
    );
    expect(html).toContain("STOP");
    expect(html).toContain("stop $90.00");
  });

  it("treats a partial fill as still open", () => {
    const html = openOrdersPanel([order({ status: "partially_filled" })], NOW);
    expect(html).toContain(">Open<");
    expect(html).toContain('name="cancelOrder"');
  });
});

describe("openOrdersPanel — the fill/cancel transient window", () => {
  it("shows a just-filled order subdued, with its fill price, no cancel button", () => {
    const html = openOrdersPanel(
      [order({ status: "filled", filled_avg_price: "121.30", filled_at: secondsAgo(5) })],
      NOW,
    );
    expect(html).toContain('style="opacity:.55"');
    expect(html).toContain("Filled · $121.30");
    expect(html).not.toContain('name="cancelOrder"');
  });

  it("drops a filled order once it's older than the transient window", () => {
    const html = openOrdersPanel(
      [order({ status: "filled", filled_avg_price: "121.30", filled_at: secondsAgo(11) })],
      NOW,
    );
    expect(html).toContain("No open orders right now.");
  });

  it("shows a just-canceled order subdued, labeled Canceled", () => {
    const html = openOrdersPanel([order({ status: "canceled", canceled_at: secondsAgo(3) })], NOW);
    expect(html).toContain('style="opacity:.55"');
    expect(html).toContain(">Canceled<");
    expect(html).not.toContain('name="cancelOrder"');
  });

  it("drops a canceled order once it's older than the transient window", () => {
    const html = openOrdersPanel([order({ status: "canceled", canceled_at: secondsAgo(30) })], NOW);
    expect(html).toContain("No open orders right now.");
  });

  it("omits a canceled order with no timestamp at all rather than guessing its age", () => {
    const html = openOrdersPanel([order({ status: "canceled" })], NOW);
    expect(html).toContain("No open orders right now.");
  });
});

describe("openOrdersPanel — mixed list", () => {
  it("shows open, recently-filled, and recently-canceled together, drops the rest", () => {
    const html = openOrdersPanel(
      [
        order({ id: "open1", status: "new" }),
        order({ id: "fill1", status: "filled", filled_avg_price: "10", filled_at: secondsAgo(2) }),
        order({
          id: "old-fill",
          status: "filled",
          filled_avg_price: "10",
          filled_at: secondsAgo(999),
        }),
        order({ id: "cancel1", status: "canceled", canceled_at: secondsAgo(2) }),
      ],
      NOW,
    );
    // Three rows survive (open, recent fill, recent cancel); the stale fill is dropped —
    // filled/canceled rows carry no id in the markup (no cancel button), so count body rows via
    // their leading cell instead (the header row has no `tcell`).
    expect((html.match(/class="tcell"/g) ?? []).length).toBe(3);
    expect(html).toContain('value="open1"');
    expect(html).toContain(">Filled ·");
    expect(html).toContain(">Canceled<");
  });
});
