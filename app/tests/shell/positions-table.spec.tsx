import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { DeskPosition } from "../../src/live/desk";
import { PositionsTable } from "../../src/shell/positions-table";

rstest.mock("../../src/live/desk", () => ({
  fetchDeskActivity: () => Promise.resolve({ available: true, activity: [] }),
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

const withClient = (el: React.ReactElement) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{el}</QueryClientProvider>;
};

describe("PositionsTable", () => {
  it("renders a blotter row per position, headers included", () => {
    render(withClient(<PositionsTable positions={[position()]} deskId="sauron" totalCount={1} />));

    expect(screen.getByText("Mark")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SPY" })).toBeInTheDocument();
  });

  it("shows the zero-positions note when there are none open at all", () => {
    render(withClient(<PositionsTable positions={[]} deskId="sauron" totalCount={0} />));

    expect(screen.getByText("No open positions — waiting is a position.")).toBeInTheDocument();
  });

  it("shows the filtered-to-zero note when positions exist but none match", () => {
    render(withClient(<PositionsTable positions={[]} deskId="sauron" totalCount={3} />));

    expect(screen.getByText("No positions match this filter.")).toBeInTheDocument();
  });
});
