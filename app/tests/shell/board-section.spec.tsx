import { render, screen } from "@testing-library/react";
import type { ResearchCall, ResearchShelfData } from "../../src/live/research";
import { CallBoard, ResearchFilters } from "../../src/shell/board-section";

/**
 * Research's Board links only to pages that exist. No per-symbol research page is served (only
 * study and ledger slugs resolve), so a selected symbol chip scopes the board and offers no
 * "full page" link that would open a 404; and a hub event id links to its ledger only when that
 * ledger exists.
 */

const shelf = (over: Partial<ResearchShelfData> = {}): ResearchShelfData => ({
  events: [],
  closures: [],
  calls: [],
  symbols: [{ symbol: "NVDA" }],
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

describe("CallBoard — the hubs readout", () => {
  const call = (eventId: string): ResearchCall => ({
    eventId,
    call: "watch",
    horizon: "today",
    href: `/research/events/${eventId}`,
    adjacent: ["fomc-2026-10-28", "cpi-2026-10-15"],
  });

  it("links a hub only when it has a ledger, and names the rest as plain text", () => {
    const { container } = render(
      <CallBoard
        data={shelf({
          calls: [call("nvda-2026-11-19-print"), call("amd-2026-11-04-print")],
          ledgers: [
            {
              slug: "events/fomc-2026-10-28",
              title: "FOMC",
              lastAssessed: null,
              href: "/research/events/fomc-2026-10-28",
            },
          ],
        })}
        filter={{ terms: [], symbols: [], lens: "all" }}
        inRangeIds={new Set(["nvda-2026-11-19-print", "amd-2026-11-04-print"])}
        rangeName="all research"
      />,
    );
    expect(screen.getByRole("link", { name: "fomc-2026-10-28" })).toHaveAttribute(
      "href",
      "/research/events/fomc-2026-10-28",
    );
    expect(screen.getByText("cpi-2026-10-15")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "cpi-2026-10-15" })).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/research/events/cpi-2026-10-15"]')).toBeNull();
  });
});
