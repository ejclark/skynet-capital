import { describe, expect, it } from "@rstest/core";
import type { MarketEvent } from "../../src/domain/market-events.js";
import { renderAgenda, shortDay } from "../../src/observatory/event-agenda.js";
import type { EventCall } from "../../src/server/research-service.js";

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

const ctx = (calls?: ReadonlyMap<string, EventCall>) => ({
  researchIds: new Set(["near"]),
  ...(calls ? { calls } : {}),
});

describe("renderAgenda — proximity bands", () => {
  const events = [
    event({ id: "near", date: "2026-08-18", title: "Near macro" }),
    event({ id: "mid", date: "2026-09-05", title: "Mid macro" }),
    event({ id: "far", date: "2026-11-20", title: "Far macro" }),
  ];

  it("groups events into the three bands, nearest first", () => {
    const html = renderAgenda(events, AS_OF, ctx());
    const near = html.indexOf("Next 7 days");
    const mid = html.indexOf("Next 30 days");
    const far = html.indexOf("Beyond 30 days");
    expect(near).toBeGreaterThan(-1);
    expect(html.indexOf("Near macro")).toBeGreaterThan(near);
    expect(html.indexOf("Near macro")).toBeLessThan(mid);
    expect(html.indexOf("Mid macro")).toBeLessThan(far);
  });

  it("gives each day group a #day-<date> anchor the widget can jump to", () => {
    expect(renderAgenda(events, AS_OF, ctx())).toContain('id="day-2026-08-18"');
  });

  it("marks a multi-event date as a compound-risk day", () => {
    const stacked = [
      event({ id: "a", date: "2026-08-18" }),
      event({ id: "b", date: "2026-08-18" }),
    ];
    expect(renderAgenda(stacked, AS_OF, ctx())).toContain("×2 same day");
  });

  it("keeps an honest empty state for the near band only", () => {
    const html = renderAgenda([event({ id: "far", date: "2026-11-20" })], AS_OF, ctx());
    expect(html).toContain("clear runway");
    expect(html).not.toContain("Next 30 days");
  });

  it("labels an estimated date so it can never read as confirmed", () => {
    const html = renderAgenda(
      [event({ id: "e", date: "2026-08-18", status: "estimate" })],
      AS_OF,
      ctx(),
    );
    expect(html).toContain(">EST<");
  });
});

describe("renderAgenda — the call chip", () => {
  const events = [event({ id: "near", date: "2026-08-18", title: "Near macro" })];

  it("promotes the call verbatim and links it to the ledger that justifies it", () => {
    const calls = new Map([["near", { call: "Stand aside", horizon: "Today" }]]);
    const html = renderAgenda(events, AS_OF, ctx(calls));
    expect(html).toContain("Stand aside");
    expect(html).toContain('href="/research/events/near"');
    expect(html).toContain("cal-call");
  });

  it("shows confidence when the ledger states one", () => {
    const calls = new Map([
      ["near", { call: "Stand aside", horizon: "Today", confidence: "High" }],
    ]);
    const html = renderAgenda(events, AS_OF, ctx(calls));
    expect(html).toContain('class="cal-conf">High<');
  });

  it("names the horizon the call came from, so the claim carries its scope", () => {
    const calls = new Map([["near", { call: "Stand aside", horizon: "This week" }]]);
    expect(renderAgenda(events, AS_OF, ctx(calls))).toContain("This week: the call");
  });

  it("renders no chip when no ledger states a call — a missing call is honest", () => {
    expect(renderAgenda(events, AS_OF, ctx(new Map()))).not.toContain("cal-call");
    expect(renderAgenda(events, AS_OF, ctx())).not.toContain("cal-call");
  });

  it("escapes a call rather than trusting it as markup", () => {
    const calls = new Map([["near", { call: "<script>x</script>", horizon: "Today" }]]);
    expect(renderAgenda(events, AS_OF, ctx(calls))).not.toContain("<script>");
  });
});

describe("shortDay", () => {
  it("formats UTC date-only, never shifting across a local timezone", () => {
    expect(shortDay("2026-10-28")).toBe("Oct 28");
  });
});
