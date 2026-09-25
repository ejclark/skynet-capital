import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import { PositionsTable } from "../../src/shell/positions-table";

// The row's Guidance link (#3729 step 4) is a router Link; no router here, so render its href.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    search,
  }: {
    children: ReactNode;
    className?: string;
    search: Record<string, string>;
  }) => (
    <a href={`/trade?${new URLSearchParams(search).toString()}`} className={className}>
      {children}
    </a>
  ),
}));

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

    // Beginner column names, the jargon ones one hover from their glossary (#3689 slice 6).
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Breakeven" })).toBeInTheDocument();
    expect(screen.getByText("SPY")).toBeInTheDocument();
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
