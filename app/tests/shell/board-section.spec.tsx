import { render, screen } from "@testing-library/react";
import type { DocSymbolMatch, ResearchCall, ResearchShelfData } from "../../src/live/research";
import { CallBoard, DocList, ResearchFilters, scopedRows } from "../../src/shell/board-section";

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

/**
 * THE `sym:` SCOPE'S MARK AND ORDER (#3962). A study that only mentions a symbol is the whole point
 * of the corpus search, so it must be visibly distinguishable from the documents the symbol is
 * actually about — by a WORD, since a standing reader is red/green colourblind and hue may never
 * carry meaning alone (CLAUDE.md).
 */
describe("the doc lists under a symbol scope", () => {
  const row = (slug: string, match: DocSymbolMatch | null) => ({
    doc: { slug, title: slug, lastAssessed: null, href: `/research/${slug}` },
    match,
  });
  const named = (...symbols: string[]): DocSymbolMatch => ({ kind: "named", symbols });
  const mentions = (...symbols: string[]): DocSymbolMatch => ({ kind: "mentions", symbols });

  it("says in words which documents are named for the symbol and which only mention it", () => {
    render(
      <DocList
        title="Studies"
        rows={[row("supply-chain", mentions("NVDA")), row("nvda-deep-dive", named("NVDA"))]}
        empty="unused"
      />,
    );
    expect(screen.getByText("mentions NVDA")).toBeInTheDocument();
    expect(screen.getByText("named for NVDA")).toBeInTheDocument();
  });

  it("draws no mark at all when nothing is scoped", () => {
    const { container } = render(
      <DocList title="Studies" rows={[row("supply-chain", null)]} empty="unused" />,
    );
    expect(container.querySelector(".rx-scope")).toBeNull();
  });

  it("sorts the documents named for the symbol above the ones that only mention it", () => {
    const sorted = scopedRows(
      [
        row("aaa-mentions", mentions("NVDA")),
        row("zzz-named", named("NVDA")),
        row("bbb-mentions", mentions("NVDA")),
      ],
      ["NVDA"],
    );
    expect(sorted.map((r) => r.doc.slug)).toEqual(["zzz-named", "aaa-mentions", "bbb-mentions"]);
  });

  it("drops the documents neither net caught, and passes everything through with no scope", () => {
    const rows = [row("in", mentions("NVDA")), row("out", null)];
    expect(scopedRows(rows, ["NVDA"]).map((r) => r.doc.slug)).toEqual(["in"]);
    expect(scopedRows(rows, []).map((r) => r.doc.slug)).toEqual(["in", "out"]);
  });
});
