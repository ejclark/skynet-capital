import { render, screen } from "@testing-library/react";
import type { ResearchShelfData } from "../../src/live/research";
import { ResearchFilters } from "../../src/shell/board-section";

/**
 * Research's Board links only to pages that exist. No per-symbol research page is served (only
 * study and ledger slugs resolve), so a selected symbol chip scopes the board and offers no
 * "full page" link that would open a 404.
 */

const shelf = (over: Partial<ResearchShelfData> = {}): ResearchShelfData => ({
  events: [],
  closures: [],
  calls: [],
  symbols: [{ symbol: "NVDA", href: "/research/symbol/NVDA" }],
  studies: [],
  ledgers: [],
  ...over,
});

describe("ResearchFilters — the symbol chips", () => {
  it("scopes the board on a selected chip without linking to a symbol page that does not exist", () => {
    const { container } = render(
      <ResearchFilters data={shelf()} query="sym:NVDA" onChange={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: /NVDA/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/full page/)).not.toBeInTheDocument();
    expect(container.querySelector('a[href^="/research/symbol/"]')).toBeNull();
  });
});
