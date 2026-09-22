import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TradeGate } from "../../src/shell/trade-gate";

/**
 * LIMIT AT MID (#3407, Workbench slice 6 — Eric, 2026-09-22: "limit at mid — it's standard
 * behavior"). The stock ticket seeds Order type Limit at the quote's cent-rounded mid once a
 * committed symbol's NBBO arrives, says where the number came from, and never overwrites a type
 * or price the member has touched. No live book → the ticket stays Market, as it always was.
 */

let answer: Record<string, unknown> = {};
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () => Promise.resolve(answer),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-09-21T00:00:00Z",
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

function mount(initialSymbol?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TradeGate deskId="desk-1" initialSymbol={initialSymbol} />
    </QueryClientProvider>,
  );
}

describe("TradeGate — limit at mid", () => {
  it("seeds Limit at the mid once the committed symbol's NBBO arrives, and says so", async () => {
    answer = nvda;
    mount("NVDA");
    await waitFor(() => expect(screen.getByLabelText("Order type")).toHaveValue("limit"));
    expect(screen.getByLabelText("Limit price")).toHaveValue(181.3);
    expect(screen.getByText(/Limit seeded at the mid/)).toHaveTextContent(
      "$181.30, between the $181.28 bid and the $181.32 ask",
    );
    // the fallback TIF follows the class: a held order outlives the session
    expect(screen.getByRole("button", { name: "GTC" })).toHaveAttribute("aria-pressed", "true");
  });

  it("stays Market when the quote carries no live book", async () => {
    answer = { symbol: "NVDA", last: 181.32, change: 0, changePct: 0, tone: "flat" };
    mount("NVDA");
    await screen.findByText(/\$181\.32/);
    expect(screen.getByLabelText("Order type")).toHaveValue("market");
    expect(screen.queryByLabelText("Limit price")).not.toBeInTheDocument();
    expect(screen.queryByText(/Limit seeded/)).not.toBeInTheDocument();
  });

  it("never overwrites a price the member typed, and drops the note the moment they do", async () => {
    answer = nvda;
    mount("NVDA");
    const price = await screen.findByLabelText("Limit price");
    await waitFor(() => expect(price).toHaveValue(181.3));
    fireEvent.change(price, { target: { value: "180" } });
    expect(screen.queryByText(/Limit seeded/)).not.toBeInTheDocument();
    expect(price).toHaveValue(180);
  });

  it("never overwrites an order type the member chose before the quote landed", async () => {
    answer = nvda;
    mount("NVDA");
    fireEvent.change(screen.getByLabelText("Order type"), { target: { value: "stop" } });
    await screen.findByText(/\$181\.32/);
    expect(screen.getByLabelText("Order type")).toHaveValue("stop");
    expect(screen.queryByText(/Limit seeded/)).not.toBeInTheDocument();
  });
});
