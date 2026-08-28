import { deskActivityView, deskView } from "../../src/observatory/desk-json-view.js";
import { orderOriginIndex } from "../../src/observatory/order-origin.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/** The desk's JSON twin: same figures as the blotter, formatted once, filterable raws alongside. */

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 11_090,
  equity: 100_000,
  positions: [
    { symbol: "AAPL", quantity: 200, avgPrice: 189.2, marketValue: 42_930 },
    { symbol: "NVDA261218C00130000", quantity: 6, avgPrice: 7.85, marketValue: 10_920 },
  ],
  activity: [],
  ...over,
});

describe("deskView", () => {
  it("formats the blotter figures and tiles with the page's own helpers", () => {
    const view = deskView(snapshot());
    expect(view).toMatchObject({ id: "sauron", name: "Sauron", kind: "bot" });
    expect(view.tiles.openPositions).toBe(2);
    expect(view.tiles.cash).toBe("$11,090");
    // Sorted by market value: AAPL first.
    expect(view.positions[0]).toMatchObject({ symbol: "AAPL", isOption: false, value: "$42,930" });
    expect(view.positions[1]?.isOption).toBe(true);
    expect(view.positions[1]?.display).not.toBe("NVDA261218C00130000");
  });

  it("carries the raw P/L for client-side filtering, signed formatting for display", () => {
    const view = deskView(snapshot());
    const aapl = view.positions[0];
    expect(aapl?.totalPlRaw).toBeCloseTo(42_930 - 200 * 189.2, 5);
    expect(aapl?.totalPl.startsWith("+") || aapl?.totalPl.startsWith("-")).toBe(true);
  });

  it("keeps an errored account honest — zeros stay absent, the error rides along", () => {
    const view = deskView(snapshot({ positions: [], error: "account unreachable" }));
    expect(view.error).toBe("account unreachable");
    expect(view.positions).toEqual([]);
  });
});

describe("deskActivityView", () => {
  const line = (over: Record<string, unknown>) => ({
    orderId: "ord-1",
    participantId: "sauron",
    symbol: "NVDA",
    side: "buy" as const,
    quantity: 100,
    filledQuantity: 0,
    status: "new",
    at: "2026-08-28T14:00:00Z",
    source: "stream" as const,
    ...over,
  });

  it("collapses journal lines to the latest state per order, newest first, provenance kept", () => {
    const view = deskActivityView([
      line({}),
      line({ filledQuantity: 100, status: "filled", price: 176.1, at: "2026-08-28T14:00:05Z" }),
      line({
        orderId: "ord-0",
        symbol: "AAPL",
        side: "sell",
        at: "2026-08-27T10:00:00Z",
        source: "backfill",
        filledQuantity: 40,
        status: "filled",
        price: 145.2,
      }),
    ]);
    expect(view).toHaveLength(2);
    expect(view[0]).toMatchObject({ orderId: "ord-1", status: "filled", price: "$176.10" });
    expect(view[1]).toMatchObject({ orderId: "ord-0", backfilled: true });
  });

  it("renders a missing price as an em dash, never a fabricated number", () => {
    expect(deskActivityView([line({})])[0]?.price).toBe("—");
  });

  it("says who placed each order once audit evidence is handed in", () => {
    const origins = orderOriginIndex(
      [{ participantId: "sauron", orderId: "ord-1", at: "2026-08-28T13:00:00Z" }],
      "human",
    );
    const view = deskActivityView(
      [line({}), line({ orderId: "ord-2", at: "2026-08-28T15:00:00Z" })],
      origins,
    );
    expect(view.find((e) => e.orderId === "ord-1")?.origin).toBe("desk");
    expect(view.find((e) => e.orderId === "ord-2")?.origin).toBe("alpaca-direct");
  });

  it("defaults every row to unknown with no evidence — knowledge and authorship stay separate", () => {
    // `source: "broker"` says the reconcile learned the row; it says nothing about who placed it.
    expect(deskActivityView([line({ source: "broker" })])[0]?.origin).toBe("unknown");
  });
});
