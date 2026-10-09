import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import { PositionCards } from "../../src/shell/position-cards";

/**
 * A phone position card opens that position on Trade (#4947): an option lands on the HELD contract
 * — the Orders pane with its Close / Roll row marked — never a new-order preset for the same strike.
 */

// No router here; surface the search each card hands Trade so it's observable.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, search }: { children: ReactNode; search: unknown }) => (
    <a href="/app/trade" data-search={JSON.stringify(search)}>
      {children}
    </a>
  ),
}));

const position = (symbol: string, display: string): DeskPosition =>
  ({
    symbol,
    display,
    isOption: symbol.length > 6,
    quantity: "-1",
    totalPl: "-$292",
    returnPct: "−111.0%",
    totalTone: "neg",
    plainName: "",
  }) as DeskPosition;

const searchOf = (name: string) =>
  JSON.parse(screen.getByRole("link", { name: new RegExp(name) }).dataset.search ?? "{}");

describe("PositionCards — the hand-off to Trade", () => {
  it("opens an option on the held contract, not a new-order preset", () => {
    render(<PositionCards positions={[position("AMD261120P00150000", "AMD put")]} deskId="eric" />);
    expect(searchOf("AMD put")).toEqual({
      desk: "eric",
      symbol: "AMD",
      section: "orders",
      manage: "AMD261120P00150000",
    });
  });

  it("opens shares on their ticker", () => {
    render(<PositionCards positions={[position("SPY", "SPY")]} deskId="eric" />);
    expect(searchOf("SPY")).toEqual({ desk: "eric", symbol: "SPY" });
  });
});
