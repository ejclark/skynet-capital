import { render, screen } from "@testing-library/react";
import { LadderRail } from "../../src/shell/ladder-rail";

rstest.mock("@tanstack/react-router", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: a test double for TanStack's own Link props
  Link: ({ to, search, children, ...rest }: any) => {
    const resolvedSearch = typeof search === "function" ? search({ desk: "human-eric" }) : search;
    const href = resolvedSearch ? `${to}?play=${resolvedSearch.play}` : to;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

const plays = [
  { code: "101", name: "Buy stock", earned: true, locked: false },
  { code: "102", name: "Sell stock", earned: true, locked: false },
  { code: "201", name: "Sell a cash-secured put", earned: false, locked: false },
  { code: "202", name: "Sell a covered call", earned: false, locked: true },
] as never;

/**
 * The ladder rail (Eric, 2026-09-22) — the click-to-preset function `MilestoneStrip` had, restored
 * as the rail's own item list rather than a second strip above the ticket.
 */
describe("LadderRail", () => {
  it("presets ?play= for a reached rung, landing on the ticket", () => {
    render(<LadderRail deskId="human-eric" plays={plays} current="201" />);
    const link = screen.getByRole("link", { name: /Sell a cash-secured put/ });
    expect(link).toHaveAttribute("href", "/trade?play=201");
  });

  it("routes a locked rung to /learn/trading instead of presetting it", () => {
    render(<LadderRail deskId="human-eric" plays={plays} current="201" />);
    const link = screen.getByRole("link", { name: /Sell a covered call — locked/ });
    expect(link).toHaveAttribute("href", "/learn/trading");
  });

  it("marks the current rung, and no other, with aria-current", () => {
    render(<LadderRail deskId="human-eric" plays={plays} current="102" />);
    expect(screen.getByRole("link", { name: /Sell stock — earned/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Buy stock — earned/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows the code as the visible label, the full name only in aria-label/title", () => {
    render(<LadderRail deskId="human-eric" plays={plays} current="101" />);
    const link = screen.getByRole("link", { name: /Buy stock — earned/ });
    expect(link).toHaveTextContent("101");
    expect(link).not.toHaveTextContent("Buy stock");
    expect(link).toHaveAttribute("title", "101 Buy stock");
  });
});
