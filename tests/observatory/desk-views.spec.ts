import { renderAnalysisBody } from "../../src/observatory/analysis-view.js";
import { positionsFrom } from "../../src/observatory/broker-positions.js";
import { fillsFrom, formatHold, ticketContext } from "../../src/observatory/desk-data.js";
import { DESK_STYLE } from "../../src/observatory/desk-style.js";
import { deskHref, deskTabs, parseDeskTab } from "../../src/observatory/desk-tabs.js";
import type { EquitySample } from "../../src/observatory/history-store.js";
import { renderHistoryBody } from "../../src/observatory/history-view.js";
import { renderMetricsBody } from "../../src/observatory/metrics-view.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { renderPositionsBody } from "../../src/observatory/positions-view.js";
import { renderTradeReviewBody } from "../../src/observatory/trade-review-view.js";
import { previewOrder } from "../../src/trading/order-ticket.js";

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 5_000,
  equity: 11_000,
  positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_200 }],
  activity: [
    {
      symbol: "MSFT",
      side: "buy",
      quantity: 4,
      filledQuantity: 4,
      price: 300,
      status: "filled",
      at: "2026-08-01T14:00:00.000Z",
    },
    {
      symbol: "MSFT",
      side: "sell",
      quantity: 4,
      filledQuantity: 4,
      price: 330,
      status: "filled",
      at: "2026-08-04T14:00:00.000Z",
    },
  ],
  ...over,
});

describe("desk tabs", () => {
  it("defaults to the overview for a missing or unknown tab", () => {
    expect(parseDeskTab(null)).toBe("overview");
    expect(parseDeskTab("nonsense")).toBe("overview");
    expect(parseDeskTab("analysis")).toBe("analysis");
  });

  it("links the overview at the bare profile url and the rest with ?tab=", () => {
    expect(deskHref("ann", "overview")).toBe("/u/ann");
    expect(deskHref("ann", "positions")).toBe("/u/ann?tab=positions");
  });

  it("marks exactly one tab active, for assistive tech too", () => {
    const html = deskTabs("ann", "history");
    expect(html).toContain('class="desk-tab active" href="/u/ann?tab=history"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});

describe("broker positions", () => {
  it("turns the broker's string payload into numbers exactly once", () => {
    expect(
      positionsFrom([
        { symbol: "AAPL", qty: "10", avg_entry_price: "100.5", market_value: "1200.25" },
      ]),
    ).toEqual([{ symbol: "AAPL", quantity: 10, avgPrice: 100.5, marketValue: 1200.25 }]);
  });

  it("maps an empty account to an empty list rather than throwing", () => {
    expect(positionsFrom([])).toEqual([]);
  });
});

describe("desk data adapters", () => {
  it("keeps only fills that actually filled shares", () => {
    const fills = fillsFrom([
      {
        symbol: "AAPL",
        side: "buy",
        quantity: 5,
        filledQuantity: 0,
        status: "canceled",
        at: "t1",
      },
      {
        symbol: "AAPL",
        side: "buy",
        quantity: 5,
        filledQuantity: 5,
        price: 10,
        status: "filled",
        at: "t2",
      },
    ]);
    expect(fills).toEqual([{ symbol: "AAPL", side: "buy", quantity: 5, price: 10, at: "t2" }]);
  });

  it("carries the deployment's trading flag into the ticket context", () => {
    const context = ticketContext(snapshot(), { tradingEnabled: false, isSelf: true });
    expect(context).toMatchObject({ tradingEnabled: false, isSelf: true, cash: 5_000 });
    expect(context.marketOpen).toBeUndefined();
  });

  it("renders hold time in the coarsest truthful unit", () => {
    expect(formatHold(30_000)).toBe("<1m");
    expect(formatHold(45 * 60_000)).toBe("45m");
    expect(formatHold(3 * 3_600_000)).toBe("3h");
    expect(formatHold(50 * 3_600_000)).toBe("2d 2h");
  });
});

describe("positions view — the blotter", () => {
  it("shows the holding with its mark, unrealized P/L and return", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: true });
    expect(html).toContain(">AAPL<");
    expect(html).toContain("$120"); // mark = 1200 / 10
    expect(html).toContain("+$200"); // 1200 − 10×100
    expect(html).toContain("+20.00%");
  });

  it("offers a sell action to the account holder, defaulting to the whole position", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: true, tradingEnabled: true });
    expect(html).toContain('action="/trade"');
    expect(html).toContain('name="quantity" type="number" min="1" step="1" max="10" value="10"');
  });

  it("gives a visitor no action controls at all", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: false, tradingEnabled: true });
    expect(html).not.toContain('action="/trade"');
  });

  it("renders roll as disabled with its real reason rather than hiding or faking it", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: true, tradingEnabled: true });
    expect(html).toContain(">Roll</button>");
    expect(html).toContain("single atomic order");
  });

  it("disables the ticket and says why when desk trading is switched off", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: true, tradingEnabled: false });
    expect(html).toContain("Preview only.");
    expect(html).toContain("SKYNET_DESK_TRADING=on");
  });

  it("degrades to an honest message when the account read failed", () => {
    const html = renderPositionsBody(snapshot({ error: "boom" }), { isSelf: true });
    expect(html).toContain("Account unreachable");
    expect(html).not.toContain('action="/trade"');
  });

  it("shows the notice banner from a completed order round trip", () => {
    const html = renderPositionsBody(snapshot(), {
      isSelf: true,
      notice: { kind: "ok", message: "Order sent to the broker." },
    });
    expect(html).toContain("Order sent to the broker.");
  });
});

describe("history view — closed round trips", () => {
  it("renders the matched trip with realized P/L, not the raw fills", () => {
    const html = renderHistoryBody(snapshot(), { isSelf: true });
    expect(html).toContain(">MSFT<");
    expect(html).toContain("+$120"); // (330 − 300) × 4
    expect(html).toContain("+10.00%");
  });

  it("keeps the raw fills available as the receipts, folded away", () => {
    const html = renderHistoryBody(snapshot(), { isSelf: true });
    expect(html).toContain("Raw fills");
    expect(html).toContain("<details");
  });

  it("says history begins mid-trade when a sell had no matching lot", () => {
    const html = renderHistoryBody(
      snapshot({
        activity: [
          {
            symbol: "TSLA",
            side: "sell",
            quantity: 3,
            filledQuantity: 3,
            price: 200,
            status: "filled",
            at: "2026-08-02T14:00:00.000Z",
          },
        ],
      }),
      { isSelf: true },
    );
    expect(html).toContain("History begins mid-trade");
  });

  it("states plainly when there is nothing closed yet", () => {
    const html = renderHistoryBody(snapshot({ activity: [] }), { isSelf: true });
    expect(html).toContain("No closed trades");
  });
});

describe("analysis view — trade behavior", () => {
  it("reports the stat family from closed trips", () => {
    const html = renderAnalysisBody(snapshot(), { isSelf: true });
    expect(html).toContain("Win rate");
    expect(html).toContain("100.00%");
    expect(html).toContain("Profit factor");
  });

  it("refuses to invent analysis from open positions alone", () => {
    const html = renderAnalysisBody(snapshot({ activity: [] }), { isSelf: true });
    expect(html).toContain("Analysis needs closed trades");
    expect(html).not.toContain("Win rate");
  });

  it("prints an em-dash, never 0.00, for a ratio with no losses to divide by", () => {
    const html = renderAnalysisBody(snapshot(), { isSelf: true });
    expect(html).toContain("nothing lost yet — no ratio to take");
  });
});

describe("metrics view — account performance", () => {
  const samples: EquitySample[] = [
    {
      at: "2026-07-01T14:00:00.000Z",
      participantId: "ann",
      equity: 10_000,
      cash: 10_000,
      realizedPl: 0,
    },
    {
      at: "2026-08-01T14:00:00.000Z",
      participantId: "ann",
      equity: 11_000,
      cash: 5_000,
      realizedPl: 120,
    },
  ];

  it("draws the equity curve and the drawdown once there are samples", () => {
    const html = renderMetricsBody(snapshot(), {
      isSelf: true,
      history: samples,
      generatedAt: "2026-08-02T14:00:00.000Z",
    });
    expect(html).toContain("equity-spark");
    expect(html).toContain("Max drawdown");
  });

  it("says history is still accruing instead of drawing a flat line", () => {
    const html = renderMetricsBody(snapshot(), { isSelf: true, history: [] });
    expect(html).toContain("No recorded history yet");
    expect(html).not.toContain('<svg class="equity-spark"');
  });

  it("measures the doubling race against the founding baseline", () => {
    const html = renderMetricsBody(snapshot(), {
      isSelf: true,
      history: samples,
      generatedAt: "2026-08-02T14:00:00.000Z",
    });
    expect(html).toContain("The doubling race");
    expect(html).toContain("10.0% of the way to 2×");
  });
});

describe("review screen", () => {
  const preview = previewOrder(
    { symbol: "AAPL", quantity: 10, action: "sell" },
    { cash: 5_000, positions: snapshot().positions, tradingEnabled: true, isSelf: true },
  );

  it("restates the whole order and asks for a second, explicit confirm", () => {
    const html = renderTradeReviewBody(snapshot(), preview);
    expect(html).toContain("SELL 10 AAPL · market");
    expect(html).toContain("Estimated proceeds");
    expect(html).toContain("Cash after (est.)");
    expect(html).toContain('name="confirm" value="1"');
    expect(html).toContain("Cancel");
  });

  it("surfaces warnings without blocking the confirm", () => {
    const html = renderTradeReviewBody(snapshot(), preview);
    expect(html).toContain("closes the position completely");
    expect(html).toContain("Confirm —");
  });

  it("replaces the confirm with the refusal reasons when the order can't go", () => {
    const refused = previewOrder(
      { symbol: "AAPL", quantity: 99, action: "sell" },
      { cash: 5_000, positions: snapshot().positions, tradingEnabled: true, isSelf: true },
    );
    const html = renderTradeReviewBody(snapshot(), refused);
    expect(html).toContain("You hold 10 shares");
    expect(html).not.toContain('name="confirm" value="1"');
  });

  it("labels the account as paper, every time", () => {
    expect(renderTradeReviewBody(snapshot(), preview)).toContain("Paper account.");
  });
});

describe("desk styling", () => {
  it("reuses the brand tokens rather than hard-coding a parallel palette", () => {
    expect(DESK_STYLE).toContain("var(--accent)");
    expect(DESK_STYLE).toContain("var(--pos)");
    expect(DESK_STYLE).not.toContain("#35D0BA");
  });
});
