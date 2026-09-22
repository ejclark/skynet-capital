import { render, screen } from "@testing-library/react";
import { PayoffChart } from "../../src/shell/payoff-chart";

/**
 * The payoff diagram (#3407; rows 8 / 19): the server's points drawn as one line, the breakevens
 * ticked and named, the worst and best labelled in words, "unlimited" when the server said so —
 * and nothing at all for a curve too thin to draw.
 */

const curve = {
  from: 144,
  to: 240,
  breakevens: [183.1],
  points: [
    { price: 144, pnl: 310 },
    { price: 180, pnl: 310 },
    { price: 183.1, pnl: 0 },
    { price: 200, pnl: -1690 },
    { price: 240, pnl: -1690 },
  ],
};

describe("PayoffChart", () => {
  it("names the extremes and the breakeven for a reader who cannot see the line", () => {
    const { container } = render(<PayoffChart curve={curve} maxLoss={1690} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "At expiration: worst $1,690.00 near $200.00, best $310.00 near $144.00, breakeven at $183.10.",
    );
    expect(screen.getByText("BE $183.10")).toBeInTheDocument();
    expect(screen.getByText("−$1,690.00")).toBeInTheDocument();
    expect(screen.getByText("+$310.00")).toBeInTheDocument();
    expect(container.querySelector(".payoff-line")).not.toBeNull();
    expect(container.querySelector(".payoff-zero")).not.toBeNull();
  });

  it("says unlimited in words when the server did", () => {
    render(<PayoffChart curve={curve} maxLoss="unlimited" />);
    expect(screen.getByText("loss unlimited ↓")).toBeInTheDocument();
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("worst unlimited");
  });

  it("draws nothing for a curve with fewer than two points", () => {
    const { container } = render(
      <PayoffChart curve={{ ...curve, points: [{ price: 180, pnl: 0 }] }} maxLoss={0} />,
    );
    expect(container.querySelector("svg")).toBeNull();
  });
});
