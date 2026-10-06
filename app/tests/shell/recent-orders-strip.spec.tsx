import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskActivity, DeskActivityEvent } from "../../src/live/desk";
import { RecentOrdersStrip } from "../../src/shell/recent-orders-strip";

/**
 * `RecentOrdersStrip` (#2017 Phase 1 slice 13, task 3a) — the trade ticket's compact "here's what
 * you've done" intel strip: nothing for an uncommitted symbol or desk, nothing while the query
 * hasn't resolved, an honest note when the ledger isn't wired or has no orders for this exact
 * symbol, and up to 3 most-recent events rendered via the shared `EventLine` (order-event-line.tsx)
 * row (proven here, not just asserted, by checking for the side-pill text `EventLine` renders) with
 * a "+N more" note when a 4th+ exists. The match is exact-symbol (not underlying-aware like
 * `WireRow`) — an event for a different symbol is excluded even when it shares an underlying.
 */

let nextActivity: DeskActivity = { available: true, activity: [] };
let neverResolves = false;

rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () =>
    neverResolves
      ? new Promise<DeskActivity>(() => {
          // Deliberately never resolves — pins the "no data yet" state for the test to observe.
        })
      : Promise.resolve(nextActivity),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const event = (overrides: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: overrides.orderId ?? `o-${Math.random()}`,
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 10,
  filled: 10,
  price: "180.00",
  status: "filled",
  at: "2026-09-08T12:00:00Z",
  backfilled: false,
  origin: "desk",
  ...overrides,
});

describe("RecentOrdersStrip", () => {
  beforeEach(() => {
    neverResolves = false;
    nextActivity = { available: true, activity: [] };
  });

  it("renders nothing for an uncommitted symbol", () => {
    const { container } = render(withClient(<RecentOrdersStrip symbol="" deskId="desk-1" />));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an uncommitted desk", () => {
    const { container } = render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="" />));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the query hasn't resolved yet", () => {
    neverResolves = true;
    const { container } = render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the unavailable-ledger note when the ledger isn't wired", async () => {
    nextActivity = { available: false, activity: [] };
    render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));

    expect(
      await screen.findByText("No durable activity ledger is wired in this deployment."),
    ).toBeInTheDocument();
  });

  it("shows the empty-orders note when available and no events match the symbol", async () => {
    nextActivity = { available: true, activity: [event({ symbol: "AAPL" })] };
    render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));

    expect(
      await screen.findByText("No recorded orders for NVDA in the ledger's window."),
    ).toBeInTheDocument();
  });

  it("excludes an event for a different symbol", async () => {
    nextActivity = {
      available: true,
      activity: [
        event({ orderId: "mine", symbol: "NVDA" }),
        event({ orderId: "other", symbol: "AAPL" }),
      ],
    };
    render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));

    await screen.findByText("BUY");
    expect(screen.getAllByText("BUY")).toHaveLength(1);
  });

  /** #4650 — a bot's spread is one Activity row with no symbol of its own, its legs the orders. */
  describe("a bot's spread", () => {
    const LOW = "NVDA261113C00185000";
    const leg = (orderId: string, symbol: string, side: "buy" | "sell", price: string) =>
      event({ orderId, symbol, display: symbol, side, quantity: 1, filled: 1, price });
    const spread = event({
      orderId: "mleg-1",
      symbol: "",
      display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
      quantity: 1,
      filled: 1,
      price: "$3.35",
      net: "$335.00 paid",
      legs: [
        leg("leg-low", LOW, "buy", "$5.10"),
        leg("leg-high", "NVDA261113C00200000", "sell", "$1.75"),
      ],
    });

    it("never reads as a share trade on the underlying's ticket", async () => {
      // Even a spread row that named its underlying: the strip lists a spread's legs, never the row.
      nextActivity = { available: true, activity: [{ ...spread, symbol: "NVDA" }] };
      render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));

      expect(
        await screen.findByText("No recorded orders for NVDA in the ledger's window."),
      ).toBeInTheDocument();
      expect(screen.queryByText("$3.35")).not.toBeInTheDocument();
    });

    it("lists each leg on the ticket of its own contract", async () => {
      nextActivity = { available: true, activity: [spread] };
      render(withClient(<RecentOrdersStrip symbol={LOW} deskId="desk-1" />));

      await screen.findByText("BUY");
      expect(document.querySelectorAll(".tl-event")).toHaveLength(1);
      expect(screen.getByText("$5.10")).toBeInTheDocument();
      expect(screen.getByText("filled")).toBeInTheDocument();
      expect(screen.queryByText("SELL")).not.toBeInTheDocument();
    });
  });

  it("renders up to 3 events via the reused EventLine row, with a +N more note when a 4th exists", async () => {
    nextActivity = {
      available: true,
      activity: Array.from({ length: 4 }, (_, i) =>
        event({ orderId: `o${i}`, quantity: 10 + i, filled: 10 + i }),
      ),
    };
    render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));

    // `EventLine`'s own side-pill markup (`.tl-side`) proves this reuses the shared order-fill
    // row rather than a parallel re-implementation.
    await screen.findAllByText("BUY");
    expect(document.querySelectorAll(".tl-side")).toHaveLength(3);
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });
});
