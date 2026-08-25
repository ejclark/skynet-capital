import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
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

const print = (
  overrides: Partial<EarningsPrint> & { symbol: string; date: string },
): EarningsPrint => ({
  status: "confirmed",
  source: "IR: company newsroom",
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

// The event horizon, folded into the shelf 2026-08-25 — same behavior as the old standalone
// /calendar view, now sourced through renderResearchShelfBody's events/prints/researchIds inputs.
describe("the research shelf's event horizon", () => {
  it("renders upcoming events and excludes past ones", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [
        event({ id: "cpi-2026-08-01", date: "2026-08-01", title: "Long-gone CPI" }),
        event({ id: "fomc-2026-09-16", date: "2026-09-16", title: "FOMC decision" }),
      ],
      prints: [],
    });

    expect(html).toContain("FOMC decision");
    expect(html).not.toContain("Long-gone CPI");
  });

  it("bands events by proximity — this week, this month, beyond", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [
        event({ id: "near", date: "2026-08-18", title: "Near macro" }),
        event({ id: "mid", date: "2026-09-05", title: "Mid macro" }),
        event({ id: "far", date: "2026-11-30", title: "Far macro" }),
      ],
      prints: [],
    });

    const near = html.indexOf("Next 7 days");
    const mid = html.indexOf("Next 30 days");
    const far = html.indexOf("Beyond 30 days");
    expect(near).toBeGreaterThan(-1);
    expect(html.indexOf("Near macro")).toBeGreaterThan(near);
    expect(html.indexOf("Near macro")).toBeLessThan(mid);
    expect(html.indexOf("Mid macro")).toBeGreaterThan(mid);
    expect(html.indexOf("Mid macro")).toBeLessThan(far);
    expect(html.indexOf("Far macro")).toBeGreaterThan(far);
  });

  it("counts down honestly — today, tomorrow, in Nd", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [
        event({ id: "d0", date: "2026-08-16" }),
        event({ id: "d1", date: "2026-08-17" }),
        event({ id: "d31", date: "2026-09-16" }),
      ],
      prints: [],
    });

    expect(html).toContain(">today<");
    expect(html).toContain(">tomorrow<");
    expect(html).toContain(">in 31d<");
  });

  it("marks a date carrying multiple events as a compound-risk day", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [event({ id: "fomc-oct", date: "2026-10-28", title: "FOMC decision" })],
      prints: [
        print({ symbol: "GOOG", date: "2026-10-28", status: "estimate", source: "8-K cadence" }),
        print({ symbol: "META", date: "2026-10-28", status: "estimate", source: "8-K cadence" }),
      ],
    });

    expect(html).toContain("×3 same day");
  });

  it("badges estimated dates with EST and leaves confirmed dates unbadged", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [event({ id: "confirmed-macro", date: "2026-09-11" })],
      prints: [
        print({ symbol: "AVGO", date: "2026-09-03", status: "estimate", source: "8-K cadence" }),
      ],
    });

    // Exactly one EST badge — the estimate print, not the confirmed macro.
    expect(html.split('class="cal-est"').length - 1).toBe(1);
    expect(html).toContain("AVGO");
  });

  it("labels market-wide events and ticker events differently", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [event({ id: "cpi", date: "2026-09-11", symbols: [] })],
      prints: [print({ symbol: "NVDA", date: "2026-08-26" })],
    });

    expect(html).toContain("MARKET-WIDE");
    // Ticker chips are links now — each symbol deep-links to its living research page.
    expect(html).toMatch(/<a class="cal-sym"[^>]*>NVDA<\/a>/);
  });

  it("labels a Treasury auction with the TREASURY kind chip", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [
        event({
          id: "treasury-20y-bond-2026-09-16",
          date: "2026-09-16",
          kind: "rates",
          title: "20-Year Treasury Bond auction",
          source: "TSY: treasurydirect.gov auction schedule",
        }),
      ],
      prints: [],
    });

    expect(html).toContain("TREASURY");
    expect(html).toContain("20-Year Treasury Bond auction");
  });

  it("carries the source audit trail on the row, escaped", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [
        event({ id: "x", date: "2026-09-11", source: 'BLS: "schedule" <checked>', notes: "A & B" }),
      ],
      prints: [],
    });

    expect(html).toContain("BLS: &quot;schedule&quot; &lt;checked&gt;");
    expect(html).toContain("A &amp; B");
  });

  it("summarizes the horizon in tiles — next event, week count, next print, and researched breadth", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [{ symbol: "NVDA" }, { symbol: "AAPL" }],
      events: [event({ id: "cpi", date: "2026-09-11", title: "CPI release (Aug 2026 data)" })],
      prints: [print({ symbol: "NVDA", date: "2026-08-26" })],
    });

    expect(html).toContain("Next event");
    expect(html).toContain(">in 10d<");
    expect(html).toContain('0 <span class="unit">events</span>');
    expect(html).toContain('NVDA <span class="unit">Aug 26</span>');
    expect(html).toContain('<span class="tile-label">Researched symbols</span>');
    expect(html).toContain('<span class="tile-num num">2</span>');
  });

  it("shows an honest clear-runway state when nothing is inside a week", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [],
      prints: [],
    });

    expect(html).toContain("Nothing inside a week — clear runway.");
    // Empty far bands stay silent instead of stacking empty panels.
    expect(html).not.toContain("Beyond 30 days");
  });

  it("wraps in the app shell with the research nav active", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      nav: { active: "research", canAdd: false, authed: true },
      shelf: emptyShelf,
      symbols: [],
      events: [],
      prints: [],
    });

    expect(html).toContain('<a class="dnav-link active" href="/research" aria-current="page">');
    expect(html).toContain("Research lab");
  });

  it("renders the month-grid widget alongside the agenda, on the as-of month by default", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [event({ id: "cpi", date: "2026-09-11" })],
      prints: [],
    });

    expect(html).toContain('<aside class="cal-aside">');
    expect(html).toContain("August 2026");
  });

  it("scopes ?month= to the widget only — the agenda keeps every upcoming event", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      month: "2026-10",
      events: [
        event({ id: "cpi", date: "2026-09-11", title: "September CPI" }),
        event({ id: "fomc", date: "2026-10-28", title: "October FOMC" }),
      ],
      prints: [],
    });

    expect(html).toContain("October 2026");
    expect(html).toContain("September CPI");
  });

  it("gives each agenda day group an anchor id the widget's day cells point at", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      month: "2026-09",
      events: [event({ id: "fomc", date: "2026-09-16" })],
      prints: [],
    });

    expect(html).toContain('id="day-2026-09-16"');
    expect(html).toContain('href="#day-2026-09-16"');
  });

  it("falls back to the as-of month when the month option is nonsense", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      month: "not-a-month",
      events: [],
      prints: [],
    });

    expect(html).toContain("August 2026");
  });

  it("renders the real checked-in calendar when no tables are injected", () => {
    const html = renderResearchShelfBody({ asOfIso: AS_OF, shelf: emptyShelf, symbols: [] });

    // The seeded feed: a macro print and a derived earnings print both surface.
    expect(html).toContain("FOMC decision (meeting Sep 15–16, SEP + dot plot)");
    expect(html).toContain("NVDA earnings print");
  });
});

describe("event horizon ↔ research linkage", () => {
  it("links an event to its assessment ledger when research exists", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [
        event({ id: "fomc-2026-09-16", date: "2026-09-16", title: "Researched FOMC" }),
        event({ id: "cpi-2026-10-14", date: "2026-10-14", title: "Unresearched CPI" }),
      ],
      prints: [],
      researchIds: new Set(["fomc-2026-09-16"]),
    });

    expect(html).toContain('href="/research/events/fomc-2026-09-16"');
    expect(html).not.toContain('href="/research/events/cpi-2026-10-14"');
  });

  it("deep-links symbol chips to the symbol's living research page", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [],
      prints: [print({ symbol: "NVDA", date: "2026-08-26" })],
    });

    expect(html).toContain('href="/research/symbol/NVDA"');
  });

  it("renders no research links when no ledger set is injected", () => {
    const html = renderResearchShelfBody({
      asOfIso: AS_OF,
      shelf: emptyShelf,
      symbols: [],
      events: [event({ id: "fomc-2026-09-16", date: "2026-09-16" })],
      prints: [],
    });

    expect(html).not.toContain("/research/events/");
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
