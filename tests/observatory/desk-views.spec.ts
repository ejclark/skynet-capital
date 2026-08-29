import { positionsFrom } from "../../src/observatory/broker-positions.js";
import { fillsFrom, formatHold, ticketContext } from "../../src/observatory/desk-data.js";
import { DESK_STYLE } from "../../src/observatory/desk-style.js";
import { deskHref, deskTabs, parseDeskTab } from "../../src/observatory/desk-tabs.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { renderPositionsBody } from "../../src/observatory/positions-view.js";

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
    expect(parseDeskTab("performance")).toBe("performance");
  });

  it("downgrades the owner-only settings tab to the overview without owner rights (#475)", () => {
    expect(parseDeskTab("settings")).toBe("overview");
    expect(parseDeskTab("settings", false)).toBe("overview");
    expect(parseDeskTab("settings", true)).toBe("settings");
    // Indistinguishable from a typo, so probing the URL reveals nothing about owner status.
    expect(deskTabs("ann", parseDeskTab("settings"))).toBe(
      deskTabs("ann", parseDeskTab("nonsense")),
    );
  });

  it("links the overview at the bare profile url and the rest with ?tab=", () => {
    expect(deskHref("ann", "overview")).toBe("/u/ann");
    expect(deskHref("ann", "positions")).toBe("/u/ann?tab=positions");
  });

  it("marks exactly one tab active, for assistive tech too", () => {
    const html = deskTabs("ann", "performance");
    expect(html).toContain('class="desk-tab active" href="/u/ann?tab=performance"');
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

  it("scales an option premium to per-contract dollars, leaving stock untouched", () => {
    // A contract controls 100 shares. Reporting the raw $4.20 premium made a closed option trade
    // read as 1/100th of its real P/L, while the positions tab scaled the same broker price
    // correctly — two surfaces disagreeing about one trade.
    const fills = fillsFrom([
      {
        symbol: "MSFT260918P00420000",
        side: "buy",
        quantity: 1,
        filledQuantity: 1,
        price: 4.2,
        status: "filled",
        at: "t1",
      },
      {
        symbol: "MSFT",
        side: "buy",
        quantity: 1,
        filledQuantity: 1,
        price: 4.2,
        status: "filled",
        at: "t2",
      },
    ]);
    expect(fills[0]).toMatchObject({ quantity: 1, price: 420 });
    expect(fills[1]).toMatchObject({ quantity: 1, price: 4.2 });
  });

  it("marks an 'expired worthless' or 'assigned' lifecycle row synthetic (#468 criterion 6)", () => {
    const fills = fillsFrom([
      {
        symbol: "MSFT260918P00420000",
        side: "sell",
        quantity: 1,
        filledQuantity: 1,
        price: 0,
        status: "expired worthless",
        at: "t1",
      },
      {
        symbol: "AAPL261218C00150000",
        side: "sell",
        quantity: 1,
        filledQuantity: 1,
        price: 0,
        status: "assigned",
        at: "t2",
      },
    ]);
    expect(fills).toEqual([
      {
        symbol: "MSFT260918P00420000",
        side: "sell",
        quantity: 1,
        price: 0,
        at: "t1",
        synthetic: true,
      },
      {
        symbol: "AAPL261218C00150000",
        side: "sell",
        quantity: 1,
        price: 0,
        at: "t2",
        synthetic: true,
      },
    ]);
  });

  it("excludes 'exercised' and 'option settlement' rows from round-trip math entirely (#468 criterion 6)", () => {
    // Exercise converts a long option's value into stock — a $0 close would read as a wipeout
    // rather than the value transfer it actually is. OPTRD's wire shape isn't confirmed yet.
    // Both stay OUT of fillsFrom regardless of side/price, never just synthetic.
    const fills = fillsFrom([
      {
        symbol: "AAPL261218C00150000",
        side: "sell",
        quantity: 1,
        filledQuantity: 1,
        price: 0,
        status: "exercised",
        at: "t1",
      },
      {
        symbol: "AAPL",
        side: "buy",
        quantity: 100,
        filledQuantity: 100,
        price: 150,
        status: "option settlement",
        at: "t2",
      },
    ]);
    expect(fills).toEqual([]);
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
    expect(html).toContain("needs sign-in configured");
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

describe("desk styling", () => {
  it("reuses the brand tokens rather than hard-coding a parallel palette", () => {
    expect(DESK_STYLE).toContain("var(--accent)");
    expect(DESK_STYLE).toContain("var(--pos)");
    expect(DESK_STYLE).not.toContain("#35D0BA");
  });
});
