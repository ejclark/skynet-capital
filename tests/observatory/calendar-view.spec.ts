import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { MarketEvent } from "../../src/domain/market-events.js";
import { renderCalendarBody } from "../../src/observatory/calendar-view.js";

const AS_OF = "2026-08-16T12:00:00Z";

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

describe("renderCalendarBody", () => {
  it("renders upcoming events and excludes past ones", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
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
    const html = renderCalendarBody({
      asOfIso: AS_OF,
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
    const html = renderCalendarBody({
      asOfIso: AS_OF,
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
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      events: [event({ id: "fomc-oct", date: "2026-10-28", title: "FOMC decision" })],
      prints: [
        print({ symbol: "GOOG", date: "2026-10-28", status: "estimate", source: "8-K cadence" }),
        print({ symbol: "META", date: "2026-10-28", status: "estimate", source: "8-K cadence" }),
      ],
    });

    expect(html).toContain("×3 same day");
  });

  it("badges estimated dates with EST and leaves confirmed dates unbadged", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
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
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      events: [event({ id: "cpi", date: "2026-09-11", symbols: [] })],
      prints: [print({ symbol: "NVDA", date: "2026-08-26" })],
    });

    expect(html).toContain("MARKET-WIDE");
    expect(html).toContain('<span class="cal-sym">NVDA</span>');
  });

  it("carries the source audit trail on the row, escaped", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      events: [
        event({ id: "x", date: "2026-09-11", source: 'BLS: "schedule" <checked>', notes: "A & B" }),
      ],
      prints: [],
    });

    expect(html).toContain("BLS: &quot;schedule&quot; &lt;checked&gt;");
    expect(html).toContain("A &amp; B");
  });

  it("summarizes the horizon in tiles — next event, week count, next print, next macro", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      events: [event({ id: "cpi", date: "2026-09-11", title: "CPI release (Aug 2026 data)" })],
      prints: [print({ symbol: "NVDA", date: "2026-08-26" })],
    });

    expect(html).toContain("Next event");
    expect(html).toContain(">in 10d<");
    expect(html).toContain('0 <span class="unit">events</span>');
    expect(html).toContain('NVDA <span class="unit">Aug 26</span>');
    expect(html).toContain('CPI <span class="unit">Sep 11</span>');
  });

  it("shows an honest clear-runway state when nothing is inside a week", () => {
    const html = renderCalendarBody({ asOfIso: AS_OF, events: [], prints: [] });

    expect(html).toContain("Nothing inside a week — clear runway.");
    // Empty far bands stay silent instead of stacking empty panels.
    expect(html).not.toContain("Beyond 30 days");
  });

  it("wraps in the app shell with the calendar nav active", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      nav: { active: "calendar", canAdd: false, authed: true },
      events: [],
      prints: [],
    });

    expect(html).toContain('<a class="dnav-link active" href="/calendar" aria-current="page">');
    expect(html).toContain("Event horizon");
  });

  it("renders the month-grid widget alongside the agenda, on the as-of month by default", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      events: [event({ id: "cpi", date: "2026-09-11" })],
      prints: [],
    });

    expect(html).toContain('<aside class="cal-aside">');
    expect(html).toContain("August 2026");
  });

  it("scopes ?month= to the widget only — the agenda keeps every upcoming event", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
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
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      month: "2026-09",
      events: [event({ id: "fomc", date: "2026-09-16" })],
      prints: [],
    });

    expect(html).toContain('id="day-2026-09-16"');
    expect(html).toContain('href="#day-2026-09-16"');
  });

  it("falls back to the as-of month when the month option is nonsense", () => {
    const html = renderCalendarBody({
      asOfIso: AS_OF,
      month: "not-a-month",
      events: [],
      prints: [],
    });

    expect(html).toContain("August 2026");
  });

  it("renders the real checked-in calendar when no tables are injected", () => {
    const html = renderCalendarBody({ asOfIso: AS_OF });

    // The seeded feed: a macro print and a derived earnings print both surface.
    expect(html).toContain("FOMC decision (meeting Sep 15–16, SEP + dot plot)");
    expect(html).toContain("NVDA earnings print");
  });
});
