import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DeskPosition } from "../../src/live/desk";
import { BlotterRow } from "../../src/shell/blotter-row";

rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () =>
    Promise.resolve({
      available: true,
      activity: [
        {
          orderId: "o1",
          symbol: "SPY",
          display: "SPY",
          side: "buy",
          quantity: 199,
          filled: 199,
          price: "$500.05",
          status: "filled",
          at: "2026-09-01T14:00:00.000Z",
          backfilled: false,
          origin: "desk",
        },
      ],
    }),
}));

const position = (overrides: Partial<DeskPosition> = {}): DeskPosition =>
  ({
    symbol: "SPY",
    display: "SPY",
    detail: "199 sh",
    isOption: false,
    quantity: "199",
    costPerShare: "$500.05",
    price: "$505.00",
    costBasis: "$99,510",
    value: "$100,495",
    dayPl: "+$120",
    dayPct: "+0.1%",
    dayTone: "pos",
    totalPl: "+$985",
    totalPlRaw: 985,
    returnPct: "+1.0%",
    totalTone: "pos",
    weightPct: 20,
    ...overrides,
  }) as DeskPosition;

// A `<tr>` needs a table ancestor to render its real semantics in jsdom/happy-dom.
const inTable = (row: React.ReactElement) => {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <table>
        <tbody>{row}</tbody>
      </table>
    </QueryClientProvider>
  );
};

describe("BlotterRow", () => {
  it("shows the symbol and the always-visible columns", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    expect(screen.getByRole("button", { name: "SPY" })).toBeInTheDocument();
    expect(screen.getByText("199")).toBeInTheDocument();
    expect(screen.getByText("+$985")).toBeInTheDocument();
  });

  it("starts collapsed — no detail grid until expanded", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    expect(screen.getByRole("button", { name: /Detail for/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Cost / share")).not.toBeInTheDocument();
  });

  it("reveals the detail grid when the expand chevron is clicked", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    fireEvent.click(screen.getByRole("button", { name: /Detail for/ }));

    expect(screen.getByText("Cost / share")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Detail for/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("collapses again on a second click of the same chevron", () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));
    const chevron = screen.getByRole("button", { name: /Detail for/ });

    fireEvent.click(chevron);
    fireEvent.click(chevron);

    expect(screen.queryByText("Cost / share")).not.toBeInTheDocument();
  });

  it("expands the fill timeline inline when the symbol is clicked — never a drawer", async () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));

    const symbolBtn = screen.getByRole("button", { name: "SPY" });
    expect(symbolBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(symbolBtn);

    expect(symbolBtn).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByText("BUY")).toBeInTheDocument());
  });

  it("collapses the timeline again on a second click of the symbol", async () => {
    render(inTable(<BlotterRow position={position()} deskId="sauron" />));
    const symbolBtn = screen.getByRole("button", { name: "SPY" });

    fireEvent.click(symbolBtn);
    await waitFor(() => expect(screen.getByText("BUY")).toBeInTheDocument());
    fireEvent.click(symbolBtn);

    expect(screen.queryByText("BUY")).not.toBeInTheDocument();
  });
});
