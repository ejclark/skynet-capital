import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { TradeGate } from "../../src/shell/trade-gate";

/**
 * A DRAFT FROM CAMPAIGN (#7487 slice 6): Campaign's Trade window opens `/trade?shares=&type=`, and
 * the share ticket starts from it. A drafted Market is the member's own pick, so the limit-at-mid
 * seed leaves it alone; a drafted Limit has no price yet, so the seed prices it at the mid exactly
 * as on a fresh ticket. Either way the gate reviews it; nothing was sent from Campaign.
 */

let answer: Record<string, unknown> = {};
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve(answer),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-11-11T00:00:00Z",
      desk: { id: "desk-1", name: "Desk", kind: "human", positions: [], considerations: [] },
    }),
}));

const nvda = {
  symbol: "NVDA",
  last: 181.32,
  change: 2.14,
  changePct: 1.19,
  tone: "pos",
  bid: 181.28,
  ask: 181.32,
  mid: 181.3,
};

function mount(props: { initialShares?: number; initialOrderType?: "market" | "limit" }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TradeGate deskId="desk-1" initialSymbol="NVDA" {...props} />
    </QueryClientProvider>,
  );
}

describe("TradeGate — a draft from Campaign", () => {
  it("starts from the drafted share count", () => {
    answer = nvda;
    mount({ initialShares: 3, initialOrderType: "market" });
    expect(screen.getByLabelText("Shares")).toHaveValue(3);
  });

  it("keeps a drafted Market: the seed never overrides the member's pick", async () => {
    answer = nvda;
    mount({ initialShares: 1, initialOrderType: "market" });
    await screen.findByText(/\$181\.32/);
    expect(screen.getByLabelText("Order type")).toHaveValue("market");
    expect(screen.queryByText(/Limit seeded/)).not.toBeInTheDocument();
  });

  it("prices a drafted Limit at the mid once the quote lands", async () => {
    answer = nvda;
    mount({ initialShares: 1, initialOrderType: "limit" });
    expect(screen.getByLabelText("Order type")).toHaveValue("limit");
    await waitFor(() => expect(screen.getByLabelText("Limit price")).toHaveValue(181.3));
    expect(screen.getByText(/Limit seeded at the mid/)).toBeInTheDocument();
  });

  it("is a fresh ticket when nothing was drafted", () => {
    answer = nvda;
    mount({});
    expect(screen.getByLabelText("Shares")).toHaveValue(null);
  });
});
