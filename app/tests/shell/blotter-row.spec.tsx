import { fireEvent, render, screen } from "@testing-library/react";
import type { DeskPosition } from "../../src/live/desk";
import { BlotterRow } from "../../src/shell/blotter-row";

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
const inTable = (row: React.ReactElement) => (
  <table>
    <tbody>{row}</tbody>
  </table>
);

describe("BlotterRow", () => {
  it("shows the symbol and the always-visible columns", () => {
    render(inTable(<BlotterRow position={position()} onTimeline={() => undefined} />));

    expect(screen.getByRole("button", { name: "SPY" })).toBeInTheDocument();
    expect(screen.getByText("199")).toBeInTheDocument();
    expect(screen.getByText("+$985")).toBeInTheDocument();
  });

  it("starts collapsed — no detail grid until expanded", () => {
    render(inTable(<BlotterRow position={position()} onTimeline={() => undefined} />));

    expect(screen.getByRole("button", { name: /Detail for/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Cost / share")).not.toBeInTheDocument();
  });

  it("reveals the detail grid when the expand chevron is clicked", () => {
    render(inTable(<BlotterRow position={position()} onTimeline={() => undefined} />));

    fireEvent.click(screen.getByRole("button", { name: /Detail for/ }));

    expect(screen.getByText("Cost / share")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Detail for/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("collapses again on a second click of the same chevron", () => {
    render(inTable(<BlotterRow position={position()} onTimeline={() => undefined} />));
    const chevron = screen.getByRole("button", { name: /Detail for/ });

    fireEvent.click(chevron);
    fireEvent.click(chevron);

    expect(screen.queryByText("Cost / share")).not.toBeInTheDocument();
  });

  it("calls onTimeline with the position when the symbol is clicked", () => {
    const seen: DeskPosition[] = [];
    const p = position();
    render(inTable(<BlotterRow position={p} onTimeline={(pos) => seen.push(pos)} />));

    fireEvent.click(screen.getByRole("button", { name: "SPY" }));

    expect(seen).toEqual([p]);
  });
});
