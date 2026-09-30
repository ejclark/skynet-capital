import { researchCalendarJson } from "../../src/observatory/research-calendar-json-view.js";
import type { ResearchShelfJson } from "../../src/observatory/research-json-view.js";

/** The calendar's slice of the shelf (#3977 slice 5): the same rows, narrowed to what a calendar
 *  draws — never a second producer that could disagree with the board about an event. */

const event = (id: string, symbols: string[] = []) => ({
  id,
  title: id,
  date: "2026-10-28",
  kind: "earnings" as const,
  impact: "high" as const,
  symbols,
  researched: true,
});
const call = (eventId: string) => ({
  eventId,
  call: "Stand aside",
  horizon: "Today",
  confidence: "High",
  href: `/research/events/${eventId}`,
  lastAssessed: "2026-09-20",
  horizons: { week: { call: "Watch", horizon: "This week" } },
  tldr: "a long TL;DR only the board's filter reads",
  adjacent: ["fomc-2026-10-28"],
  sourceBlocked: true,
});
const SHELF: ResearchShelfJson = {
  events: [
    event("meta-2026-10-28-print", ["META"]),
    event("fomc-2026-10-28"),
    event("pmi-2026-10-01"),
  ],
  closures: [{ date: "2026-11-26", reason: "Thanksgiving", early: false }],
  calls: [call("meta-2026-10-28-print"), call("fomc-2026-10-28"), call("pmi-2026-10-01")],
  symbols: [{ symbol: "META" }],
  studies: [{ slug: "s", title: "s", lastAssessed: null, href: "/research/s" }],
  ledgers: [{ slug: "events/pmi-2026-10-01", title: "p", lastAssessed: null, href: "/x" }],
} as unknown as ResearchShelfJson;

describe("researchCalendarJson", () => {
  const view = researchCalendarJson(SHELF);

  it("keeps every event and closure, without the impact only R&D's facet filter reads", () => {
    expect(view.events.map((e) => e.id)).toEqual(SHELF.events.map((e) => e.id));
    expect(view.events[0]).toEqual({
      id: "meta-2026-10-28-print",
      title: "meta-2026-10-28-print",
      date: "2026-10-28",
      kind: "earnings",
      symbols: ["META"],
      researched: true,
      called: true,
    });
    expect(view.closures).toBe(SHELF.closures);
    expect(Object.keys(view).sort()).toEqual(["calls", "closures", "events"]);
  });

  it("marks called events, so the fog line counts calls without carrying them", () => {
    const bare = researchCalendarJson({ ...SHELF, calls: [] });
    expect(bare.events.every((e) => !("called" in e))).toBe(true);
    expect(view.events.every((e) => e.called === true)).toBe(true);
  });

  it("carries only the calls a calendar can print — a named ticker or a headline macro print", () => {
    expect(view.calls.map((c) => c.eventId)).toEqual(["meta-2026-10-28-print", "fomc-2026-10-28"]);
  });

  it("drops the board's TL;DR, adjacents and freshness, keeping every row the lens reads", () => {
    expect(view.calls[0]).toEqual({
      eventId: "meta-2026-10-28-print",
      call: "Stand aside",
      horizon: "Today",
      confidence: "High",
      href: "/research/events/meta-2026-10-28-print",
      horizons: { week: { call: "Watch", horizon: "This week" } },
    });
  });
});
