import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  renderResearchDocBody,
  renderResearchShelfBody,
  renderSymbolResearchBody,
} from "../../src/observatory/research-view.js";
import type { ResearchDoc, SymbolResearch } from "../../src/server/research-service.js";

const AS_OF = "2026-08-16T12:00:00Z";

const doc = (slug: string, overrides: Partial<ResearchDoc> = {}): ResearchDoc => ({
  slug,
  title: `Title of ${slug}`,
  lastAssessed: null,
  ...overrides,
});

const event = (overrides: Partial<MarketEvent> & { id: string; date: string }): MarketEvent => ({
  kind: "earnings",
  title: `Event ${overrides.id}`,
  status: "confirmed",
  source: "IR: company newsroom",
  impact: "critical",
  symbols: ["NVDA"],
  ...overrides,
});

const BANNER_TEXT = "not investment advice";

describe("renderResearchShelfBody", () => {
  const shelf = {
    studies: [doc("alpha-study")],
    ledgers: [doc("events/nvda-2026-08-26-print", { lastAssessed: "2026-08-15" })],
  };

  it("lists symbol cards, ledgers, and studies with their routes", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf,
      symbols: [
        { symbol: "NVDA", next: event({ id: "nvda-2026-08-26-print", date: "2026-08-26" }) },
      ],
    });
    expect(html).toContain('href="/research/symbol/NVDA"');
    expect(html).toContain('href="/research/events/nvda-2026-08-26-print"');
    expect(html).toContain('href="/research/alpha-study"');
    expect(html).toContain("last assessed 2026-08-15");
  });

  it("carries the standing educational banner", () => {
    const html = renderResearchShelfBody({ asOfIso: AS_OF, shelf, symbols: [] });
    expect(html).toContain(BANNER_TEXT);
  });
});

describe("renderResearchDocBody", () => {
  it("renders the doc HTML inside the shell with its provenance line and banner", () => {
    const html = renderResearchDocBody({
      asOfIso: AS_OF,
      doc: {
        ...doc("events/x", { lastAssessed: "2026-08-17" }),
        html: "<h1>The doc</h1><table><tr><td>cell</td></tr></table>",
        glanceHtml: null,
      },
    });
    expect(html).toContain("The doc");
    expect(html).toContain("<td>cell</td>");
    expect(html).toContain("last assessed 2026-08-17");
    expect(html).toContain(BANNER_TEXT);
    // No At-a-glance section authored → no decision header rendered (the CSS class is always in
    // the stylesheet, so key off the rendered element's aria-label instead).
    expect(html).not.toContain('aria-label="At a glance"');
  });

  it("promotes the At a glance header above the document when present", () => {
    const html = renderResearchDocBody({
      asOfIso: AS_OF,
      doc: {
        ...doc("events/x", { lastAssessed: "2026-08-17" }),
        html: "<h1>The body</h1>",
        glanceHtml: "<p><strong>TL;DR.</strong> Guards only.</p>",
      },
    });
    expect(html).toContain('aria-label="At a glance"');
    expect(html).toContain("Guards only.");
    // Header precedes the document body.
    expect(html.indexOf("Guards only.")).toBeLessThan(html.indexOf("The body"));
  });
});

describe("renderSymbolResearchBody", () => {
  const data: SymbolResearch = {
    symbol: "NVDA",
    events: [
      event({ id: "nvda-2026-08-26-print", date: "2026-08-26" }),
      event({ id: "nvda-2026-11-25-print", date: "2026-11-25", status: "estimate" }),
    ],
    ledgers: [doc("events/nvda-2026-08-26-print", { lastAssessed: "2026-08-15" })],
    studies: [doc("alpha-study")],
    stance: {
      html: "<p>Defined-risk only.</p>",
      from: doc("events/nvda-2026-08-26-print", { lastAssessed: "2026-08-15" }),
    },
  };

  it("shows the stance verbatim, attributed to its ledger — never a summary", () => {
    const html = renderSymbolResearchBody({ asOfIso: AS_OF, data });
    expect(html).toContain("Defined-risk only.");
    expect(html).toContain("An excerpt, never a summary");
    expect(html).toContain('href="/research/events/nvda-2026-08-26-print"');
  });

  it("links researched events to their ledgers and marks unresearched ones queued", () => {
    const html = renderSymbolResearchBody({ asOfIso: AS_OF, data });
    expect(html).toContain('href="/research/events/nvda-2026-08-26-print"');
    expect(html).toContain("research queued");
  });

  it("labels estimated dates and carries the banner", () => {
    const html = renderSymbolResearchBody({ asOfIso: AS_OF, data });
    expect(html).toContain("EST");
    expect(html).toContain(BANNER_TEXT);
  });
});
