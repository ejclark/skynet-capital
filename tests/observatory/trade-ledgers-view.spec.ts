import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { ActivityRow } from "../../src/observatory/trade-ledgers-view.js";
import {
  caveats,
  dayStrip,
  foldedLedger,
  tripsTable,
} from "../../src/observatory/trade-ledgers-view.js";
import type { RoundTrip, RoundTripLedger } from "../../src/trading/round-trips.js";

const trip = (over: Partial<RoundTrip> = {}): RoundTrip => ({
  symbol: "NVDA",
  quantity: 10,
  entryPrice: 100,
  exitPrice: 110,
  openedAt: "2026-08-19T14:00:00.000Z",
  closedAt: "2026-08-19T15:00:00.000Z",
  realized: 100,
  returnPct: 10,
  holdMs: 3_600_000,
  ...over,
});

const ledger = (over: Partial<RoundTripLedger> = {}): RoundTripLedger => ({
  trips: [],
  open: [],
  unpricedFills: 0,
  unmatchedSellQuantity: 0,
  truncated: false,
  ...over,
});

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 5_000,
  equity: 11_000,
  positions: [],
  ...over,
});

describe("caveats", () => {
  it("stays silent when the durable ledger has records and nothing else is amiss", () => {
    expect(caveats(ledger(), true)).toBe("");
  });

  it("names each honesty gap the ledger actually hit", () => {
    const html = caveats(
      ledger({ truncated: true, unmatchedSellQuantity: 3, unpricedFills: 2, open: [{} as never] }),
      false,
    );
    expect(html).toContain("Only the broker's recent-order window is visible here");
    expect(html).toContain("History begins mid-trade");
    expect(html).toContain("2 fill(s) carry no recorded price");
    expect(html).toContain("1 lot(s) still open");
  });
});

describe("dayStrip", () => {
  it("renders nothing when there are no closed trades", () => {
    expect(dayStrip([], "America/New_York")).toBe("");
  });

  it("buckets a closed trade's realized P/L onto its close day", () => {
    const html = dayStrip([trip({ realized: 50 })], "America/New_York");
    expect(html).toContain("Trading days");
    expect(html).toContain('class="day pos"');
    expect(html).toContain("1 green");
  });
});

describe("tripsTable", () => {
  it("shows the empty state with no closed trades", () => {
    expect(tripsTable([], undefined)).toContain("No closed trades in this window");
  });

  it("renders one row per closed trade, newest close first", () => {
    const html = tripsTable(
      [
        trip({ symbol: "NVDA", closedAt: "2026-08-19T15:00:00.000Z" }),
        trip({ symbol: "AAPL", closedAt: "2026-08-20T15:00:00.000Z" }),
      ],
      undefined,
    );
    const aaplIndex = html.indexOf("AAPL");
    const nvdaIndex = html.indexOf("NVDA");
    expect(aaplIndex).toBeGreaterThan(-1);
    expect(nvdaIndex).toBeGreaterThan(aaplIndex);
  });
});

describe("foldedLedger", () => {
  const row: ActivityRow = {
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    filledQuantity: 10,
    price: 120,
    status: "filled",
    at: "2026-08-19T14:30:00.000Z",
  };

  it("shows the empty state with no matching orders", () => {
    expect(foldedLedger([], snapshot(), [])).toContain("No orders match this window and type");
  });

  it("folds orders as receipts, badging backfilled rows and omitting the why column with no decisions", () => {
    const html = foldedLedger([row, { ...row, source: "backfill" }], snapshot(), []);
    expect(html).toContain("Order activity — 2 orders");
    expect(html).toContain("src-badge");
    expect(html).not.toContain("<th>Context</th>");
  });
});
