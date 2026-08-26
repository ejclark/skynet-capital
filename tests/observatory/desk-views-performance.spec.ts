import type { EquitySample } from "../../src/observatory/history-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { renderPerformanceBody } from "../../src/observatory/performance-view.js";
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

describe("performance view — closed round trips, trade behavior, and account performance", () => {
  // Pinned "now" so the window math never depends on the wall clock (fixture fills are early Aug).
  const AS_OF = "2026-08-05T00:00:00.000Z";
  const opts = { isSelf: true, generatedAt: AS_OF };
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

  it("renders the matched trip with realized P/L, return and cost basis", () => {
    const html = renderPerformanceBody(snapshot(), opts);
    expect(html).toContain(">MSFT<");
    expect(html).toContain("+$120"); // (330 − 300) × 4
    expect(html).toContain("+10.00%");
    expect(html).toContain("Cost basis");
    expect(html).toContain("$1,200.00"); // 300 × 4
  });

  it("folds the order ledger behind the trips, with the filter chips left in the open", () => {
    const html = renderPerformanceBody(snapshot(), opts);
    expect(html).toContain('<details class="fills">');
    expect(html).toContain("Order activity");
    expect(html).toContain('class="fchip active"');
    expect(html).toContain("window=7d&type=all"); // every other window is one click away
    // The two "All" chips must not read as twins: each names what it selects (Eric, PR #459).
    expect(html).toContain(">All history<");
    expect(html).toContain(">All types<");
  });

  it("filters orders and trips by the selected window", () => {
    const withOld = snapshot({
      activity: [
        ...(snapshot().activity ?? []),
        {
          symbol: "GME",
          side: "buy",
          quantity: 1,
          filledQuantity: 1,
          price: 20,
          status: "filled",
          at: "2026-06-01T14:00:00.000Z",
        },
      ],
    });
    const week = renderPerformanceBody(withOld, { ...opts, activityWindow: "7d" });
    expect(week).not.toContain(">GME<");
    const all = renderPerformanceBody(withOld, { ...opts, activityWindow: "all" });
    expect(all).toContain(">GME<");
  });

  it("filters the order ledger by trade type without touching the trips", () => {
    const html = renderPerformanceBody(snapshot(), { ...opts, activityType: "sell" });
    expect(html).not.toContain(">BUY<");
    expect(html).toContain(">SELL<");
    expect(html).toContain("+$120"); // the round trip (buy + sell) still scores
  });

  it("extends history beyond the broker window from the durable ledger, badging backfill", () => {
    const durable = [
      {
        orderId: "b1",
        participantId: "ann",
        symbol: "CRWV",
        side: "buy" as const,
        quantity: 2,
        filledQuantity: 2,
        price: 50,
        status: "filled",
        at: "2026-06-02T14:00:00.000Z",
        source: "backfill" as const,
      },
      {
        orderId: "b2",
        participantId: "ann",
        symbol: "CRWV",
        side: "sell" as const,
        quantity: 2,
        filledQuantity: 2,
        price: 60,
        status: "filled",
        at: "2026-06-03T14:00:00.000Z",
        source: "backfill" as const,
      },
    ];
    const html = renderPerformanceBody(snapshot(), {
      ...opts,
      activityWindow: "all",
      tradeActivity: durable,
    });
    expect(html).toContain(">CRWV<");
    expect(html).toContain("backfilled");
    expect(html).not.toContain("backfill:activity"); // the ledger exists — no setup caveat
  });

  it("points at the backfill when the durable ledger has nothing yet", () => {
    const html = renderPerformanceBody(snapshot(), opts);
    expect(html).toContain("backfill:activity");
  });

  it("unfolds a bot order's decision context one click away", () => {
    const bot = snapshot({ id: "sauron", kind: "bot", displayName: "Sauron" });
    const html = renderPerformanceBody(bot, {
      ...opts,
      decisions: [
        {
          at: new Date("2026-08-04T13:59:00.000Z").getTime(),
          personaId: "sauron",
          mode: "live",
          rawIntents: [
            { symbol: "MSFT", side: "sell", quantity: 9, type: "market", reason: "lock the gain" },
          ],
          guardedIntents: [
            { symbol: "MSFT", side: "sell", quantity: 4, type: "market", reason: "lock the gain" },
          ],
          outcomes: [
            {
              intent: {
                symbol: "MSFT",
                side: "sell",
                quantity: 4,
                type: "market",
                reason: "lock the gain",
              },
              action: "placed",
            },
          ],
        },
      ],
    });
    expect(html).toContain('<details class="why"><summary>why</summary>');
    expect(html).toContain("lock the gain");
    expect(html).toContain("persona asked for 9, risk guards sized it to 4");
  });

  it("unfolds the strategy and expectation lines when the intent carries them", () => {
    const bot = snapshot({ id: "sauron", kind: "bot", displayName: "Sauron" });
    const contextualized = {
      symbol: "MSFT",
      side: "sell" as const,
      quantity: 4,
      type: "market" as const,
      reason: "banking half",
      strategy: "hc-euphoria-fade",
      expectation: "expect the rally to stall as exhausted greed unwinds",
    };
    const html = renderPerformanceBody(bot, {
      ...opts,
      decisions: [
        {
          at: new Date("2026-08-04T13:59:00.000Z").getTime(),
          personaId: "sauron",
          mode: "live",
          rawIntents: [contextualized],
          guardedIntents: [contextualized],
          outcomes: [{ intent: contextualized, action: "placed" }],
        },
      ],
    });
    expect(html).toContain("<b>Strategy</b> hc-euphoria-fade");
    expect(html).toContain("<b>Expecting</b> expect the rally to stall");
  });

  it("says history begins mid-trade when a sell had no matching lot", () => {
    const html = renderPerformanceBody(
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
      opts,
    );
    expect(html).toContain("History begins mid-trade");
  });

  it("states plainly when there is nothing closed yet", () => {
    const html = renderPerformanceBody(snapshot({ activity: [] }), opts);
    expect(html).toContain("No closed trades");
  });

  it("reports the stat family from closed trips", () => {
    const html = renderPerformanceBody(snapshot(), { isSelf: true });
    expect(html).toContain("Win rate");
    expect(html).toContain("100.00%");
    expect(html).toContain("Profit factor");
  });

  it("prints an em-dash, never 0.00, for a ratio with no losses to divide by", () => {
    const html = renderPerformanceBody(snapshot(), { isSelf: true });
    expect(html).toContain("nothing lost yet — no ratio to take");
  });

  it("draws the equity curve and the drawdown once there are samples", () => {
    const html = renderPerformanceBody(snapshot(), {
      isSelf: true,
      history: samples,
      generatedAt: "2026-08-02T14:00:00.000Z",
    });
    expect(html).toContain("equity-spark");
    expect(html).toContain("Max drawdown");
  });

  it("says history is still accruing instead of drawing a flat line", () => {
    const html = renderPerformanceBody(snapshot(), { isSelf: true, history: [] });
    expect(html).toContain("No recorded history yet");
    expect(html).not.toContain('<svg class="equity-spark"');
  });

  it("measures the doubling race against the founding baseline", () => {
    const html = renderPerformanceBody(snapshot(), {
      isSelf: true,
      history: samples,
      generatedAt: "2026-08-02T14:00:00.000Z",
    });
    expect(html).toContain("The doubling race");
    expect(html).toContain("10.0% of the way to 2×");
  });

  // The consolidation's one non-negotiable (design brief + plan): three independent inputs, three
  // independent empty states — never one blended gate that hides real data in an unrelated section.
  it("draws a real equity curve even when nothing has closed yet (no blended empty state)", () => {
    const html = renderPerformanceBody(snapshot({ activity: [] }), {
      isSelf: true,
      history: samples,
      generatedAt: "2026-08-02T14:00:00.000Z",
    });
    expect(html).toContain("equity-spark"); // the curve has real data...
    expect(html).toContain("Needs a closed trade"); // ...even though trade stats are honestly empty
  });

  it("reports real trade stats even with no equity history yet (no blended empty state)", () => {
    const html = renderPerformanceBody(snapshot(), { isSelf: true, generatedAt: AS_OF });
    expect(html).toContain("Win rate");
    expect(html).toContain("100.00%"); // trade stats are real...
    expect(html).toContain("Two samples are needed to draw a line"); // ...even though the curve is honestly empty
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
