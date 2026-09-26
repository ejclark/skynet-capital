import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { RungChip } from "../../src/shell/rung-chip";

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
    className,
  }: {
    to: string;
    search?: Record<string, string>;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to} className={className}>
      {children}
    </a>
  ),
}));

const plays = [
  { code: "101", name: "Buy stock", earned: true, locked: false },
  { code: "102", name: "Sell stock", earned: false, locked: false },
  { code: "201", name: "Sell a cash-secured put", earned: false, locked: true },
] as never;

/**
 * The rung chip (#3407, Workbench slice 5) — the one line the ticket keeps when the milestone
 * strip moves to the ladder (the Trading chapter of the Profile page's Milestones since #3807 2b): the
 * rung, its state as a WORD, the count, the door to the ladder.
 */
describe("RungChip", () => {
  it("names the rung, says its state in a word, counts the earned rungs and links to the ladder", () => {
    render(<RungChip plays={plays} code="201" />);
    expect(screen.getByText("201")).toBeInTheDocument();
    expect(screen.getByText("Sell a cash-secured put")).toBeInTheDocument();
    expect(screen.getByText("locked")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 earned")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trading ladder →" })).toHaveAttribute(
      "href",
      "/accounts?section=milestones&chapter=trading",
    );
  });

  it("says earned with a mark, and open for a reachable rung", () => {
    const { rerender } = render(<RungChip plays={plays} code="101" />);
    expect(screen.getByText("earned ✓")).toBeInTheDocument();
    rerender(<RungChip plays={plays} code="102" />);
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("renders nothing for a rung the catalog does not know", () => {
    const { container } = render(<RungChip plays={plays} code="999" />);
    expect(container).toBeEmptyDOMElement();
  });
});
