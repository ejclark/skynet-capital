import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import {
  deskLedger,
  fillsFrom,
  formatPctOrDash,
  formatPrice,
  formatRatio,
  reviewLine,
  ticketContext,
} from "../../src/observatory/desk-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * The adapter between the observatory's account snapshot and the pure trading layer — only
 * FILLED buy/sell rows become trades, and merging the durable ledger with a broker window must
 * never double-count the same order.
 */

function snapshot(activity: ParticipantSnapshot["activity"]): ParticipantSnapshot {
  return {
    id: "human-ann",
    cash: 10_000,
    positions: [],
    activity,
  } as unknown as ParticipantSnapshot;
}

describe("deskLedger", () => {
  it("matches a filled buy against a filled sell into one closed round trip", () => {
    const ledger = deskLedger(
      snapshot([
        {
          orderId: "o1",
          symbol: "NVDA",
          side: "buy",
          quantity: 10,
          filledQuantity: 10,
          price: 100,
          status: "filled",
          at: "2026-01-01T00:00:00Z",
        },
        {
          orderId: "o2",
          symbol: "NVDA",
          side: "sell",
          quantity: 10,
          filledQuantity: 10,
          price: 110,
          status: "filled",
          at: "2026-01-02T00:00:00Z",
        },
      ]),
    );
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]).toMatchObject({ symbol: "NVDA", quantity: 10, realized: 100 });
    expect(ledger.open).toHaveLength(0);
  });

  it("drops unfilled and non-buy/sell rows — only real fills are history", () => {
    const ledger = deskLedger(
      snapshot([
        {
          orderId: "o1",
          symbol: "NVDA",
          side: "buy",
          quantity: 10,
          filledQuantity: 0,
          status: "canceled",
          at: "2026-01-01T00:00:00Z",
        },
      ]),
    );
    expect(ledger.trips).toHaveLength(0);
    expect(ledger.open).toHaveLength(0);
  });

  it("merges the durable ledger with the broker window without double-counting a shared order", () => {
    const durable: TradeActivityRecord[] = [
      {
        orderId: "o1",
        participantId: "human-ann",
        symbol: "NVDA",
        side: "buy",
        quantity: 10,
        filledQuantity: 10,
        price: 100,
        status: "filled",
        at: "2026-01-01T00:00:00Z",
        source: "stream",
      },
    ];
    // The same order also rides the broker's recent-order window — a fresh read, not a second fill.
    const snap = snapshot([
      {
        orderId: "o1",
        symbol: "NVDA",
        side: "buy",
        quantity: 10,
        filledQuantity: 10,
        price: 100,
        status: "filled",
        at: "2026-01-01T00:00:00Z",
      },
      {
        orderId: "o2",
        symbol: "NVDA",
        side: "sell",
        quantity: 10,
        filledQuantity: 10,
        price: 105,
        status: "filled",
        at: "2026-01-02T00:00:00Z",
      },
    ]);
    const ledger = deskLedger(snap, durable);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0]?.realized).toBe(50); // (105 - 100) * 10, not double the buy leg
  });
});

describe("ticketContext", () => {
  it("carries the snapshot's cash and positions through, omitting marketOpen when unknown", () => {
    const ctx = ticketContext(snapshot([]), { tradingEnabled: true, isSelf: true });
    expect(ctx).toEqual({ cash: 10_000, positions: [], tradingEnabled: true, isSelf: true });
  });

  it("includes marketOpen only when it was actually checked", () => {
    const ctx = ticketContext(snapshot([]), {
      tradingEnabled: true,
      isSelf: false,
      marketOpen: false,
    });
    expect(ctx.marketOpen).toBe(false);
    expect(ctx.isSelf).toBe(false);
  });
});

describe("formatPrice", () => {
  it("keeps cent precision, unlike the whole-dollar house currency formatter", () => {
    expect(formatPrice(31.5)).toBe("$31.50");
    expect(formatPrice(-2.005)).toBe("-$2.01");
  });
});

describe("formatRatio", () => {
  it("renders an em-dash for an unmeasurable stat rather than a false 0.00", () => {
    expect(formatRatio(null)).toBe("—");
    expect(formatRatio(1.5, "x")).toBe("1.50x");
  });
});

describe("formatPctOrDash", () => {
  it("renders — for null, and a leading + only when signed", () => {
    expect(formatPctOrDash(null)).toBe("—");
    expect(formatPctOrDash(3.2, true)).toBe("+3.20%");
    expect(formatPctOrDash(-3.2, true)).toBe("-3.20%");
    expect(formatPctOrDash(3.2, false)).toBe("3.20%");
  });
});

describe("reviewLine", () => {
  it("escapes both the label and the value", () => {
    expect(reviewLine("Cost <est>", "$1 & change")).toBe(
      '<div class="review-line"><span>Cost &lt;est&gt;</span><span>$1 &amp; change</span></div>',
    );
  });

  it("carries an optional class onto the value span", () => {
    expect(reviewLine("Side", "sell", "neg")).toContain('<span class="neg">sell</span>');
  });
});

describe("fillsFrom (lifecycle events, #468 criterion 6)", () => {
  it("marks an 'expired worthless' or 'assigned' lifecycle row synthetic", () => {
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

  it("excludes 'exercised' and 'option settlement' rows from round-trip math entirely", () => {
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
});
