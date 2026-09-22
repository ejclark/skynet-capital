import { render, screen } from "@testing-library/react";
import { type DeskTilesFigures, DeskTilesGrid } from "../../src/shell/desk-tiles-grid";

const tiles = (overrides: Partial<DeskTilesFigures> = {}): DeskTilesFigures => ({
  openPositions: 3,
  invested: "$645,840",
  dayPl: "+$8,240",
  dayTone: "pos",
  unrealized: "+$8,240",
  unrealizedNote: "+1.28% on cost",
  unrealizedTone: "pos",
  cash: "$3,601,200",
  ...overrides,
});

describe("DeskTilesGrid", () => {
  it("renders every figure it's handed, formatted string verbatim", () => {
    render(<DeskTilesGrid tiles={tiles()} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("$645,840")).toBeInTheDocument();
    expect(screen.getAllByText("+$8,240")).toHaveLength(2);
    expect(screen.getByText("+1.28% on cost")).toBeInTheDocument();
    expect(screen.getByText("$3,601,200")).toBeInTheDocument();
  });

  it("carries the P/L tone class so pos/neg/flat reads without relying on color alone", () => {
    render(<DeskTilesGrid tiles={tiles({ dayTone: "neg", dayPl: "-$500" })} />);

    expect(screen.getByText("-$500")).toHaveClass("tone-neg");
  });
});
