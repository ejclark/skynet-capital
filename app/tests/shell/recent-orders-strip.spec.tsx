import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskActivity, DeskActivityEvent } from "../../src/live/desk";
import { RecentOrdersStrip } from "../../src/shell/recent-orders-strip";

/**
 * `RecentOrdersStrip` (#2017 Phase 1 slice 13, task 3a) — the trade ticket's compact "here's what
 * you've done" intel strip: nothing for an uncommitted symbol or desk, nothing while the query
 * hasn't resolved, an honest note when the ledger isn't wired or has no orders for this exact
 * symbol, and up to 3 most-recent events rendered via the timeline drawer's own reused `EventLine`
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

  it("renders up to 3 events via the reused EventLine row, with a +N more note when a 4th exists", async () => {
    nextActivity = {
      available: true,
      activity: Array.from({ length: 4 }, (_, i) =>
        event({ orderId: `o${i}`, quantity: 10 + i, filled: 10 + i }),
      ),
    };
    render(withClient(<RecentOrdersStrip symbol="NVDA" deskId="desk-1" />));

    // `EventLine`'s own side-pill markup (`.tl-side`) proves this reuses the timeline drawer's
    // row rather than a parallel re-implementation.
    await screen.findAllByText("BUY");
    expect(document.querySelectorAll(".tl-side")).toHaveLength(3);
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });
});
