import { fireEvent, render, screen } from "@testing-library/react";
import type { ConsiderationChip } from "../../src/live/desk";
import { ConsiderationsRail } from "../../src/shell/considerations-rail";

/** #3186 slice 3 — the considerations rail: collapsed/expanded rendering and the single-expand
 *  accordion behavior (the issue's own open question on the chip interaction — this repo's chosen
 *  default). */

const chip = (over: Partial<ConsiderationChip> = {}): ConsiderationChip => ({
  id: "at-risk-AAPL",
  kind: "at-risk",
  symbol: "AAPL",
  display: "AAPL",
  notional: "$20,000",
  delta: "-$2,500",
  deltaTone: "neg",
  reason: "AAPL is down 12.5% from cost.",
  action: { label: "View position", href: "?section=positions#pos-AAPL" },
  ...over,
});

describe("ConsiderationsRail", () => {
  it("renders nothing when there are no chips", () => {
    const { container } = render(<ConsiderationsRail chips={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a collapsed chip with its symbol, kind, and delta", () => {
    render(<ConsiderationsRail chips={[chip()]} />);
    expect(screen.getByText("At risk")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("-$2,500")).toBeInTheDocument();
    expect(screen.queryByText("AAPL is down 12.5% from cost.")).not.toBeInTheDocument();
  });

  it("expands a chip to show the notional, reason, and action on click", () => {
    render(<ConsiderationsRail chips={[chip()]} />);
    fireEvent.click(screen.getByRole("button", { name: /AAPL/ }));
    expect(screen.getByText("$20,000")).toBeInTheDocument();
    expect(screen.getByText("AAPL is down 12.5% from cost.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View position" })).toHaveAttribute(
      "href",
      "?section=positions#pos-AAPL",
    );
  });

  it("collapses the previously expanded chip when a different one opens (single-expand)", () => {
    const chips = [chip(), chip({ id: "opportunity-NVDA", kind: "opportunity", symbol: "NVDA" })];
    render(<ConsiderationsRail chips={chips} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0] as HTMLElement);
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(buttons[1] as HTMLElement);
    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
  });

  it("omits the notional line for a chip with no live position behind it", () => {
    render(<ConsiderationsRail chips={[chip({ kind: "opportunity", notional: "—" })]} />);
    fireEvent.click(screen.getByRole("button", { name: /AAPL/ }));
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });
});
