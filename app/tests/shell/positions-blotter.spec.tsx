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

  // #5042: "Losing" filtered on lifetime P/L while members tapped it for today's losers.
  describe("today's change and lifetime against cost are two chips, each named for what it keeps", () => {
    const msft = position({
      symbol: "MSFT",
      display: "MSFT",
      dayPl: "−$76",
      dayPct: "−0.6%",
      dayTone: "neg",
      totalPl: "+$414",
      totalPlRaw: 414,
      totalTone: "pos",
    });
    const book = [msft, position({ symbol: "SPY", display: "SPY", dayTone: "pos" })];

    it("labels the chips by today's change and by cost — never Losing or In profit", () => {
      render(
        withClient(
          <PositionsBlotter
            deskId="d"
            positions={book}
            query=""
            onFilterChange={() => undefined}
          />,
        ),
      );
      for (const label of ["Up today", "Down today", "Above cost", "Below cost"]) {
        expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
      }
      expect(screen.queryByRole("button", { name: "Losing" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "In profit" })).not.toBeInTheDocument();
    });

    it("Down today writes day:<0 and keeps MSFT, −$76 today though +$414 overall", () => {
      const seen: string[] = [];
      const { rerender } = render(
        withClient(
          <PositionsBlotter
            deskId="d"
            positions={book}
            query=""
            onFilterChange={(q) => seen.push(q)}
          />,
        ),
      );
      fireEvent.click(screen.getByRole("button", { name: "Down today" }));
      expect(seen).toEqual(["day:<0"]);
      rerender(
        withClient(
          <PositionsBlotter
            deskId="d"
            positions={book}
            query="day:<0"
            onFilterChange={() => undefined}
          />,
        ),
      );
      expect(screen.getAllByText("MSFT").length).toBeGreaterThan(0);
      expect(screen.queryByText("SPY")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Down today" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("Below cost still reads pl:<0, so a saved view or an old link keeps working", () => {
      render(
        withClient(
          <PositionsBlotter
            deskId="d"
            positions={book}
            query="pl:<0"
            onFilterChange={() => undefined}
          />,
        ),
      );
      expect(screen.getByRole("button", { name: "Below cost" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.queryByText("MSFT")).not.toBeInTheDocument();
    });
  });

  it("renders the one New trade card", () => {
    render(<NewTradeCard deskId="d" />);
    expect(screen.getByText("New trade")).toBeInTheDocument();
  });
});
