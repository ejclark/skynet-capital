import {
  callForLens,
  DEFAULT_LENS,
  parseResearchQuery,
  type ResearchCall,
  setLens,
  toggleOnDate,
} from "../../src/live/research";

// The shelf's ONE query string carries three dimensions (#1704): terms, `on:` and `lens:`.
describe("parseResearchQuery — the lens dimension", () => {
  it("defaults to the week lens when the query names none", () => {
    expect(parseResearchQuery("").lens).toBe("week");
    expect(DEFAULT_LENS).toBe("week");
  });

  it("reads a lens token and keeps it out of the text terms", () => {
    const filter = parseResearchQuery("NVDA lens:month on:2026-09-07");
    expect(filter).toEqual({ terms: ["nvda"], on: "2026-09-07", lens: "month" });
  });

  it("ignores a lens it does not know rather than guessing", () => {
    expect(parseResearchQuery("lens:decade").lens).toBe("week");
    expect(parseResearchQuery("lens:decade").terms).toEqual(["lens:decade"]);
  });
});

describe("setLens / toggleOnDate — the controls write the same string", () => {
  it("writes no token for the default lens, so a plain URL stays plain", () => {
    expect(setLens("NVDA lens:month", "week")).toBe("NVDA");
    expect(setLens("NVDA", "quarter")).toBe("NVDA lens:quarter");
    expect(setLens("lens:day NVDA", "month")).toBe("NVDA lens:month");
  });

  it("keeps the lens when the calendar pins or clears a day", () => {
    expect(toggleOnDate("lens:month", "2026-09-07")).toBe("lens:month on:2026-09-07");
    expect(toggleOnDate("lens:month on:2026-09-07", "2026-09-07")).toBe("lens:month");
  });
});

describe("callForLens — the row a lens shows", () => {
  const call: ResearchCall = {
    eventId: "boj-decision-2026-09-18",
    call: "Stand aside",
    horizon: "Today",
    confidence: "High",
    href: "/research/events/boj-decision-2026-09-18",
    horizons: {
      today: { call: "Stand aside", horizon: "Today", confidence: "High" },
      week: { call: "Watch CPI", horizon: "This week", confidence: "Medium" },
    },
  };

  it("reads the authored row for the lens", () => {
    expect(callForLens(call, "week")?.call).toBe("Watch CPI");
    expect(callForLens(call, "day")?.horizon).toBe("Today");
  });

  it("returns null for a horizon the ledger does not state — never a neighbour's row", () => {
    expect(callForLens(call, "quarter")).toBeNull();
  });

  it("serves the day lens from a pre-lens payload that carries only the Today row", () => {
    const legacy: ResearchCall = { ...call, horizons: undefined };
    expect(callForLens(legacy, "day")).toEqual({
      call: "Stand aside",
      horizon: "Today",
      confidence: "High",
    });
    expect(callForLens(legacy, "week")).toBeNull();
  });
});
