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
  it("shows the holding with its price, cost basis, unrealized P/L and return", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: true });
    expect(html).toContain(">AAPL<");
    expect(html).toContain("$120"); // price (the mark) = 1200 / 10
    expect(html).toContain("$1,000.00"); // cost basis = 10 × 100
    expect(html).toContain("+$200"); // 1200 − 10×100
    expect(html).toContain("+20.00%");
    // Plain-language headers (Eric, PR #459): per-share cost named as such, "Mark" retired.
    expect(html).toContain(">Cost / share</th>");
    expect(html).toContain(">Price</th>");
    expect(html).not.toContain(">Mark<");
  });

  it("measures the day's move from yesterday's close when the broker recorded one", () => {
    const html = renderPositionsBody(
      snapshot({
        positions: [
          { symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1_200, lastdayPrice: 110 },
        ],
      }),
      { isSelf: true },
    );
    expect(html).toContain("Day P/L");
    expect(html).toContain("+$100"); // 1200 − 10 × 110
    expect(html).toContain("+9.09%"); // 100 / 1100
    expect(html).toContain("+$200"); // total unrealized stays measured from cost
  });

  it("measures a position opened today from its entry — it has no yesterday to move from", () => {
    const html = renderPositionsBody(snapshot(), { isSelf: true });
    // No lastdayPrice on the fixture: day == total == +$200, +20.00% — never a dash pretending
    // the move is unknowable, and never a fabricated close.
    expect(html).toContain("Day P/L");
    expect(html.match(/\+\$200/g)?.length).toBeGreaterThanOrEqual(2);
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

describe("history view — closed round trips and the order ledger", () => {
  // Pinned "now" so the window math never depends on the wall clock (fixture fills are early Aug).
  const AS_OF = "2026-08-05T00:00:00.000Z";
  const opts = { isSelf: true, generatedAt: AS_OF };

  it("renders the matched trip with realized P/L, return and cost basis", () => {
    const html = renderHistoryBody(snapshot(), opts);
    expect(html).toContain(">MSFT<");
    expect(html).toContain("+$120"); // (330 − 300) × 4
    expect(html).toContain("+10.00%");
    expect(html).toContain("Cost basis");
    expect(html).toContain("$1,200.00"); // 300 × 4
  });

  it("shows the order ledger as a first-class blotter with the filter chips", () => {
    const html = renderHistoryBody(snapshot(), opts);
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
    const week = renderHistoryBody(withOld, { ...opts, activityWindow: "7d" });
    expect(week).not.toContain(">GME<");
    const all = renderHistoryBody(withOld, { ...opts, activityWindow: "all" });
    expect(all).toContain(">GME<");
  });

  it("filters the order ledger by trade type without touching the trips", () => {
    const html = renderHistoryBody(snapshot(), { ...opts, activityType: "sell" });
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
    const html = renderHistoryBody(snapshot(), {
      ...opts,
      activityWindow: "all",
      tradeActivity: durable,
    });
    expect(html).toContain(">CRWV<");
    expect(html).toContain("backfilled");
    expect(html).not.toContain("backfill:activity"); // the ledger exists — no setup caveat
  });

  it("points at the backfill when the durable ledger has nothing yet", () => {
    const html = renderHistoryBody(snapshot(), opts);
    expect(html).toContain("backfill:activity");
  });

  it("unfolds a bot order's decision context one click away", () => {
    const bot = snapshot({ id: "sauron", kind: "bot", displayName: "Sauron" });
    const html = renderHistoryBody(bot, {
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
    const html = renderHistoryBody(bot, {
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
      opts,
    );
    expect(html).toContain("History begins mid-trade");
  });

  it("states plainly when there is nothing closed yet", () => {
    const html = renderHistoryBody(snapshot({ activity: [] }), opts);
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
