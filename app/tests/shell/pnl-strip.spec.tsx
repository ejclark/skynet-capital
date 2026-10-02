import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { WirePnl } from "../../src/live/wire";
import { PnlStrip } from "../../src/shell/pnl-strip";

// One `<Link to="/u/$id">` per cell — no route tree is mounted in a component-level spec, so `Link`
// becomes a plain anchor (the same stub `wire-trade-row.spec.tsx` uses).
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    params,
    children,
    ...rest
  }: {
    readonly params?: { readonly id?: string };
    readonly children?: ReactNode;
  }) => (
    <a href={`/u/${params?.id ?? ""}`} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * Booked P&L as a summary strip (#784 slice 3) — the figure that used to be one of Activity's
 * sections. Behavioral only: that the ranking is on screen without a tap, that the direction is
 * readable from a character and not a colour, and that nothing is booked is said rather than shown
 * as an empty row.
 */

const rows: readonly WirePnl[] = [
  { who: "Sauron", whoId: "sauron", kind: "bot", realized: "+$1,998.00", tone: "pos" },
  { who: "Eric", whoId: "eric", kind: "human", realized: "−$250.00", tone: "neg" },
];

describe("PnlStrip", () => {
  it("names every participant and their signed figure, linked to their profile", () => {
    render(<PnlStrip rows={rows} />);
    expect(screen.getByRole("link", { name: "Sauron" })).toHaveAttribute("href", "/u/sauron");
    expect(screen.getByText("+$1,998.00")).toBeInTheDocument();
    expect(screen.getByText("−$250.00")).toBeInTheDocument();
  });

  it("says which desk each row is, in a word beside the figure", () => {
    render(<PnlStrip rows={rows} />);
    expect(screen.getByText("BOT")).toBeInTheDocument();
    expect(screen.getByText("HUMAN")).toBeInTheDocument();
  });

  it("carries the direction in the sign character, so hue is never the only signal", () => {
    render(<PnlStrip rows={rows} />);
    expect(screen.getByText("+$1,998.00").textContent?.startsWith("+")).toBe(true);
    expect(screen.getByText("−$250.00").textContent?.startsWith("−")).toBe(true);
  });

  it("says nothing is booked yet rather than rendering an empty list", () => {
    render(<PnlStrip rows={[]} />);
    expect(screen.getByText(/Nothing booked yet/)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("keeps its own heading, so the strip is still labelled beside the feed", () => {
    render(<PnlStrip rows={rows} />);
    expect(screen.getByRole("heading", { name: "Booked P&L" })).toBeInTheDocument();
  });
});
