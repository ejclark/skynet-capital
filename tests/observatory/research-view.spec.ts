import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  addMonths,
  monthGrid,
  monthOf,
  parseMonth,
  resolveMonth,
} from "../../src/observatory/calendar-widget.js";
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
  kind: "macro-print",
  title: `Event ${overrides.id}`,
  status: "confirmed",
  source: "FED: federalreserve.gov FOMC calendar",
  impact: "high",
  symbols: [],
  ...overrides,
});

const BANNER_TEXT = "not investment advice";
const emptyShelf = { studies: [], ledgers: [] };

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

describe("parseMonth", () => {
  it("accepts strict YYYY-MM and rejects everything else", () => {
    expect(parseMonth("2026-09")).toBe("2026-09");
    expect(parseMonth("2026-13")).toBeUndefined();
    expect(parseMonth("2026-9")).toBeUndefined();
    expect(parseMonth("garbage")).toBeUndefined();
    expect(parseMonth("")).toBeUndefined();
    expect(parseMonth(null)).toBeUndefined();
    expect(parseMonth(undefined)).toBeUndefined();
  });
});

describe("addMonths", () => {
  it("crosses year boundaries in both directions", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-08", 4)).toBe("2026-12");
  });
});

describe("resolveMonth", () => {
  const events = [event({ id: "far", date: "2026-12-15" })];

  it("falls back to the as-of month on missing or invalid input", () => {
    expect(resolveMonth(undefined, AS_OF, events)).toBe(monthOf(AS_OF));
    expect(resolveMonth("nope", AS_OF, events)).toBe("2026-08");
  });

  it("clamps below the as-of month and above the last event's month", () => {
    expect(resolveMonth("2026-01", AS_OF, events)).toBe("2026-08");
    expect(resolveMonth("2027-06", AS_OF, events)).toBe("2026-12");
    expect(resolveMonth("2026-10", AS_OF, events)).toBe("2026-10");
  });

  it("clamps to the as-of month when there are no events at all", () => {
    expect(resolveMonth("2027-01", AS_OF, [])).toBe("2026-08");
  });
});

describe("monthGrid", () => {
  it("aligns the grid to a Monday week start — Aug 1 2026 is a Saturday, so 5 leading blanks", () => {
    const html = monthGrid("2026-08", AS_OF, []);
    const beforeDayOne = html.slice(0, html.indexOf(">1<"));
    expect(beforeDayOne.split("mg-blank").length - 1).toBe(5);
  });

  it("renders the right number of days — leap and non-leap Februaries", () => {
    const events = [event({ id: "far", date: "2028-03-01" })];
    expect(monthGrid("2028-02", AS_OF, events)).toContain(">29<");
    expect(monthGrid("2028-02", AS_OF, events)).not.toContain(">30<");
    expect(monthGrid("2027-02", AS_OF, events)).not.toContain(">29<");
    expect(monthGrid("2026-09", AS_OF, events)).not.toContain(">31<");
  });

  it("turns event days into jump links and leaves event-free days inert", () => {
    const html = monthGrid("2026-09", AS_OF, [event({ id: "fomc", date: "2026-09-16" })]);
    expect(html).toContain('href="#day-2026-09-16"');
    expect(html).toContain("mg-evt");
    expect(html).not.toContain('href="#day-2026-09-17"');
  });

  it("marks a stacked day with its event count", () => {
    const html = monthGrid("2026-10", AS_OF, [
      event({ id: "a", date: "2026-10-28" }),
      event({ id: "b", date: "2026-10-28" }),
    ]);
    expect(html).toContain('<i class="mg-count">2</i>');
  });

  it("escalates the marker only when a day carries a critical event", () => {
    const critical = monthGrid("2026-08", AS_OF, [
      event({ id: "nvda", date: "2026-08-26", impact: "critical" }),
    ]);
    const medium = monthGrid("2026-08", AS_OF, [
      event({ id: "pjm", date: "2026-08-26", impact: "medium" }),
    ]);
    expect(critical).toContain("mg-crit");
    expect(medium).not.toContain("mg-crit");
  });

  it("rings today only when rendering the as-of month", () => {
    expect(monthGrid("2026-08", AS_OF, [])).toContain("mg-today");
    expect(monthGrid("2026-09", AS_OF, [event({ id: "x", date: "2026-09-16" })])).not.toContain(
      "mg-today",
    );
  });

  it("mutes days already behind the as-of date in the current month", () => {
    const html = monthGrid("2026-08", AS_OF, []);
    expect(html).toContain("mg-past");
    // The 15th is past; the 17th is not.
    expect(html).toMatch(/mg-past[^>]*>15</);
    expect(html).not.toMatch(/mg-past[^>]*>17</);
  });

  it("disables nav at the clamp edges and links it in between", () => {
    const events = [event({ id: "far", date: "2026-10-14" })];
    const first = monthGrid("2026-08", AS_OF, events);
    expect(first).toContain("mg-off");
    expect(first).toContain('href="/research?month=2026-09"');
    const last = monthGrid("2026-10", AS_OF, events);
    expect(last).toContain('href="/research?month=2026-09"');
    expect(last).toContain("mg-off");
  });

  it("never emits the agenda's marker strings — the cal-est counting spec must stay honest", () => {
    const html = monthGrid("2026-09", AS_OF, [
      event({ id: "est", date: "2026-09-16", status: "estimate" }),
    ]);
    expect(html).not.toContain('class="cal-est"');
  });
});

describe("the shelf leads with the decision surface", () => {
  const shelf = {
    studies: [doc("alpha-study")],
    ledgers: [doc("events/nvda-2026-08-26-print")],
  };

  it("renders the agenda ABOVE the document lists — the actionable register comes first", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf,
      symbols: [],
      events: [event({ id: "near", date: "2026-08-18", title: "Near macro" })],
      prints: [],
    });
    const agenda = html.indexOf("Next 7 days");
    expect(agenda).toBeGreaterThan(-1);
    expect(agenda).toBeLessThan(html.indexOf(">Symbols<"));
    expect(agenda).toBeLessThan(html.indexOf(">Event ledgers<"));
    expect(agenda).toBeLessThan(html.indexOf("Studies &amp; registers"));
  });

  it("carries a call onto the row when the ledger states one", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf,
      symbols: [],
      events: [event({ id: "near", date: "2026-08-18" })],
      prints: [],
      researchIds: new Set(["near"]),
      calls: new Map([["near", { call: "Stand aside", horizon: "Today" }]]),
    });
    expect(html).toContain("cal-call");
    expect(html).toContain("Stand aside");
  });
});

describe("day-selection correlation", () => {
  const events = [event({ id: "near", date: "2026-08-18" })];

  it("emits a :has() rule pairing each event day with its agenda anchor", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events,
      prints: [],
    });
    expect(html).toContain(
      '.research:has(#day-2026-08-18:target) a.mg-cell[href="#day-2026-08-18"]',
    );
    expect(html).toContain(".cal-day:target");
  });

  it("highlights without filtering — every upcoming event still renders", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [...events, event({ id: "far", date: "2026-11-20", title: "Far macro" })],
      prints: [],
    });
    expect(html).toContain("Far macro");
  });
});

describe("the calendar survives every width", () => {
  // The 2026-08-26 regression, asserted so it cannot come back: the grid used to live in a sticky
  // <aside> that `@container stage (max-width:860px)` hid outright, on the reasoning that at that
  // width the agenda IS the navigation. On a phone in desktop mode the drawer leaves the stage near
  // 660px, so the component Eric navigates by silently vanished.
  const shelf = () =>
    renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [event({ id: "near", date: "2026-08-18" })],
      prints: [],
    });

  it("renders the month grid inside the shelf body, never in a removable rail", () => {
    const html = shelf();
    expect(html).toContain('<div class="rs-head">');
    expect(html).toContain('<div class="mg">');
    expect(html).not.toContain("cal-aside");
  });

  it("never hides the grid at any width", () => {
    const html = shelf();
    expect(html).not.toContain("max-width:860px");
    // No rule anywhere may take the calendar out of the document.
    expect(html).not.toMatch(/\.mg[^{]*\{[^}]*display:\s*none/);
  });

  it("keeps the header a single column once it would get cramped, grid first", () => {
    const html = shelf();
    expect(html).toContain("@container stage (max-width:700px)");
    expect(html).toContain(".rs-head{ grid-template-columns:minmax(0,1fr); }");
  });
});
