import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import * as realTicket from "../../src/live/ticket" with { rstest: "importActual" };
import type { TicketPreview } from "../../src/live/ticket";
import { TradeGate } from "../../src/shell/trade-gate";

/**
 * A first buy on the stock ticket's review (#5173). The server now prices a symbol the account
 * doesn't hold from the latest quote; the form says so as estimates and names the amount on Submit.
 * With no price at all the cash check cannot run, and the headline must not claim every check
 * passed.
 */

let preview: TicketPreview;
rstest.mock("../../src/live/ticket", () => ({
  ...realTicket,
  reviewTicket: () => Promise.resolve({ preview }),
}));
rstest.mock("../../src/live/quote", () => ({
  fetchQuote: () =>
    Promise.resolve({ symbol: "NVDA", last: 232.1, change: 0, changePct: 0, tone: "flat" }),
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
  fetchDesk: () =>
    Promise.resolve({
      generatedAt: "2026-10-08T19:00:00Z",
      desk: { id: "desk-1", name: "Desk", kind: "human", positions: [], considerations: [] },
    }),
}));

const base: TicketPreview = {
  action: "buy",
  symbol: "NVDA",
  quantity: 10,
  orderType: "market",
  timeInForce: "day",
  ok: true,
  refusals: [],
  warnings: [],
};

async function review(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TradeGate deskId="desk-1" initialSymbol="NVDA" />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Shares"), { target: { value: "10" } });
  fireEvent.click(screen.getByRole("button", { name: "Review order" }));
  await screen.findByText(/ready to submit/i);
}

describe("TradeGate — a first buy's review (#5173)", () => {
  it("shows the quote-priced estimate and names the amount on Submit", async () => {
    preview = { ...base, estPrice: 232.1, estNotional: 2_321, estCashAfter: 59_159 };
    await review();
    expect(screen.getByText("All checks passed — ready to submit")).toBeInTheDocument();
    expect(screen.getByText("Est. cash after")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Submit order — \$2,321/ })).toBeInTheDocument();
  });

  it("never says every check passed when there was no price to check the cost against", async () => {
    preview = {
      ...base,
      warnings: ["No recent price for this symbol — cost is an estimate the broker will settle."],
    };
    await review();
    expect(screen.queryByText(/All checks passed/)).not.toBeInTheDocument();
    expect(screen.getByText(/the cost isn't checked against your cash/)).toBeInTheDocument();
  });
});
