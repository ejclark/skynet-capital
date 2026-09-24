import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import * as actualDesk from "../../src/live/desk" with { rstest: "importActual" };
import type { DeskPosition } from "../../src/live/desk";
import { NewTradeCard, POSITION_CHIPS, PositionsBlotter } from "../../src/shell/positions-blotter";

/**
 * The one positions blotter (#3407 P0): chips toggle the query, the query filters the table, and
 * both routes that used to carry their own copy now render this.
 */

rstest.mock("../../src/live/desk", () => ({
  ...actualDesk,
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
}));
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactElement; className?: string }) => (
    <a href="/app/trade" className={className}>
      {children}
    </a>
  ),
}));

const position = (over: Partial<DeskPosition>): DeskPosition =>
  ({
    symbol: "SPY",
    display: "SPY",
    detail: "",
    isOption: false,
    quantity: "10",
    costPerShare: "$500.00",
    price: "$505.00",
    costBasis: "$5,000",
    value: "$5,050",
    dayPl: "+$50",
    dayPct: "+1.0%",
    dayTone: "pos",
    totalPl: "+$50",
    totalPlRaw: 50,
    returnPct: "+1.0%",
    totalTone: "pos",
    weightPct: 50,
    ...over,
  }) as DeskPosition;

const positions = [
  position({}),
  position({ symbol: "MSFT260918P00420000", display: "MSFT put", isOption: true, totalPlRaw: -20 }),
];

function withClient(node: ReactElement) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("PositionsBlotter", () => {
  it("renders every chip, and a chip click reports the toggled query", () => {
    const seen: string[] = [];
    render(
      withClient(
        <PositionsBlotter
          deskId="d"
          positions={positions}
          query=""
          onFilterChange={(q) => seen.push(q)}
        />,
      ),
    );
    for (const [, label] of POSITION_CHIPS) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    expect(seen).toEqual(["is:option"]);
  });

  it("filters the table by the query it is given", () => {
    render(
      withClient(
        <PositionsBlotter
          deskId="d"
          positions={positions}
          query="is:option"
          onFilterChange={() => undefined}
        />,
      ),
    );
    // The table and the phone's cards (#3689 slice 8) both list what the filter kept.
    expect(screen.getAllByText("MSFT put").length).toBeGreaterThan(0);
    expect(screen.queryByText("SPY")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Options" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders the one New trade card", () => {
    render(<NewTradeCard deskId="d" />);
    expect(screen.getByText("New trade")).toBeInTheDocument();
  });
});
