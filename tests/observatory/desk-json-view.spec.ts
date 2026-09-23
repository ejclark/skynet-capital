import {
  deskActivityView as deskActivityPage,
  deskView,
} from "../../src/observatory/desk-json-view.js";
import { orderOriginIndex } from "../../src/observatory/order-origin.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { OpenLot, RoundTripLedger } from "../../src/trading/round-trips.js";

/** PR 5 (issue #2287) made `deskActivityView` return a paginated `{activity, nextCursor}` page
 *  rather than a bare array — unwrap `.activity` once here so the existing bare-array assertions
 *  below stay unchanged. */
const deskActivityView = (...args: Parameters<typeof deskActivityPage>) =>
  deskActivityPage(...args).activity;

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

  it("carries no detail line for a stock position — the qty column already says it", () => {
    const view = deskView(snapshot());
    expect(view.positions[0]).toMatchObject({ symbol: "AAPL", detail: "" });
  });

  it("carries the contract count as detail for an option position", () => {
    const view = deskView(snapshot());
    expect(view.positions[1]).toMatchObject({ detail: "6 ct" });
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

  it("renders no lots at all with no ledger — today's aggregate-only row, unchanged", () => {
    const view = deskView(snapshot());
    expect(view.positions[0]?.lots).toBeUndefined();
  });

  it("carries an empty considerations list when nothing is at risk and no catalog is given", () => {
    const view = deskView(snapshot());
    expect(view.considerations).toEqual([]);
  });

  it("folds a matching play into considerations when the catalog is threaded in", () => {
    const view = deskView(snapshot(), undefined, [
      {
        id: "aapl-earnings",
        symbol: "AAPL",
        symbols: ["AAPL"],
        description: "Long into the print.",
        enter: "D-20",
        exitTakeProfit: "none",
        exitCutLosses: "D-5",
        hold: "flat",
        evidence: "internal study",
        window: "D-20 to D-6",
        size: { conservative: 0.02, standard: 0.05, aggressive: 0.1 },
        traits: [],
        metrics: [],
      },
    ]);
    expect(view.considerations).toEqual([
      expect.objectContaining({ kind: "opportunity", symbol: "AAPL" }),
    ]);
  });
});

/** Slice 1 of #3186 — the positions accordion's lot breakdown. */
describe("deskView lots", () => {
  const ledgerWith = (open: OpenLot[]): RoundTripLedger => ({
    trips: [],
    open,
    unpricedFills: 0,
    unmatchedSellQuantity: 0,
    writtenQuantity: 0,
    truncated: false,
  });

  it("splits a position into lots that sum exactly back to the parent row", () => {
    // 100 @ $180.00 + 100 @ $198.40 = $37,840.00, the same as avgPrice(189.2) × qty(200).
    const ledger = ledgerWith([
      { symbol: "AAPL", quantity: 100, price: 180, at: "2026-09-10T14:00:00Z" },
      { symbol: "AAPL", quantity: 100, price: 198.4, at: "2026-09-15T14:00:00Z" },
    ]);
    const view = deskView(snapshot(), ledger);
    const aapl = view.positions[0];
    expect(aapl?.lots).toHaveLength(2);
    const lots = aapl?.lots ?? [];

    const sumOf = (field: "quantity" | "costBasis" | "value" | "dayPl" | "totalPl") =>
      lots.reduce((sum, lot) => sum + Number(lot[field].replace(/[^0-9.-]/g, "")), 0);

    expect(sumOf("quantity")).toBe(200);
    expect(sumOf("costBasis")).toBeCloseTo(200 * 189.2, 0);
    expect(sumOf("value")).toBeCloseTo(42_930, 0);
    expect(sumOf("dayPl")).toBeCloseTo(Number(aapl?.dayPl.replace(/[^0-9.-]/g, "")), 0);
    expect(sumOf("totalPl")).toBeCloseTo(aapl?.totalPlRaw ?? Number.NaN, 0);
  });

  it("shows only whole-dollar cost basis on a lot, never cents", () => {
    const ledger = ledgerWith([
      { symbol: "AAPL", quantity: 200, price: 189.2, at: "2026-09-10T14:00:00Z" },
    ]);
    const view = deskView(snapshot(), ledger);
    expect(view.positions[0]?.lots?.[0]?.costBasis).not.toMatch(/\.\d\d$/);
  });

  it("omits lots when the reconstructed quantity doesn't cover the whole position", () => {
    // Only 150 of AAPL's 200 shares are visible — a truncated window, not a full breakdown.
    const ledger = ledgerWith([
      { symbol: "AAPL", quantity: 150, price: 189.2, at: "2026-09-10T14:00:00Z" },
    ]);
    expect(deskView(snapshot(), ledger).positions[0]?.lots).toBeUndefined();
  });

  it("omits lots for a written/short position — inverted P&L isn't rendered here", () => {
    const ledger = ledgerWith([
      { symbol: "AAPL", quantity: 200, price: 189.2, at: "2026-09-10T14:00:00Z", short: true },
    ]);
    expect(deskView(snapshot(), ledger).positions[0]?.lots).toBeUndefined();
  });

  it("omits lots for a symbol the ledger never opened", () => {
    expect(deskView(snapshot(), ledgerWith([])).positions[0]?.lots).toBeUndefined();
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

  describe("pagination (PR 5, issue #2287)", () => {
    const lines = Array.from({ length: 5 }, (_, i) =>
      line({ orderId: `ord-${i}`, at: `2026-08-28T14:0${i}:00Z` }),
    );

    it("clamps limit to [1, 100] and omits nextCursor when the page isn't full", () => {
      const page = deskActivityPage(lines, undefined, { limit: 1_000 });
      expect(page.activity).toHaveLength(5);
      expect(page).not.toHaveProperty("nextCursor");
    });

    it("pages with an exclusive before cursor, newest first", () => {
      const first = deskActivityPage(lines, undefined, { limit: 2 });
      expect(first.activity.map((e) => e.orderId)).toEqual(["ord-4", "ord-3"]);
      expect(first.nextCursor).toBe("2026-08-28T14:03:00Z");

      const next = deskActivityPage(lines, undefined, { limit: 2, before: first.nextCursor });
      expect(next.activity.map((e) => e.orderId)).toEqual(["ord-2", "ord-1"]);
    });
  });
});
