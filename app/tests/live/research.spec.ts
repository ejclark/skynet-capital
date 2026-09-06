import {
  assessmentAge,
  callForLens,
  DEFAULT_LENS,
  mentionsSymbol,
  parseResearchQuery,
  type ResearchCall,
  setLens,
  toggleOnDate,
  toggleSymbolScope,
} from "../../src/live/research";

// The shelf's ONE query string carries three dimensions (#1704): terms, `on:` and `lens:`.
describe("parseResearchQuery — the lens dimension", () => {
  it("defaults to the week lens when the query names none", () => {
    expect(parseResearchQuery("").lens).toBe("week");
    expect(DEFAULT_LENS).toBe("week");
  });

  it("reads a lens token and keeps it out of the text terms", () => {
    const filter = parseResearchQuery("NVDA lens:month on:2026-09-07");
    expect(filter).toEqual({ terms: ["nvda"], symbols: [], on: "2026-09-07", lens: "month" });
  });

  it("reads the scope and facet tokens — sym: (OR, deduped, upper-cased), kind:, impact:, call:", () => {
    const filter = parseResearchQuery(
      "sym:nvda sym:AVGO sym:nvda kind:opex impact:high call:watch fed",
    );
    expect(filter.symbols).toEqual(["NVDA", "AVGO"]);
    expect(filter.kind).toBe("opex");
    expect(filter.impact).toBe("high");
    expect(filter.callClass).toBe("watch");
    expect(filter.terms).toEqual(["fed"]);
  });

  it("leaves an unknown facet value as a plain term rather than guessing", () => {
    expect(parseResearchQuery("impact:huge call:maybe").terms).toEqual([
      "impact:huge",
      "call:maybe",
    ]);
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

describe("toggleSymbolScope / mentionsSymbol — the chips' scope", () => {
  it("adds and removes a sym: token without touching the rest of the query", () => {
    expect(toggleSymbolScope("fed lens:month", "nvda")).toBe("fed lens:month sym:NVDA");
    expect(toggleSymbolScope("fed sym:NVDA lens:month", "NVDA")).toBe("fed lens:month");
  });

  it("matches a symbol on a word boundary only", () => {
    expect(mentionsSymbol("the NVDA print", "NVDA")).toBe(true);
    expect(mentionsSymbol("a MUnich trip", "MU")).toBe(false);
    expect(mentionsSymbol(undefined, "MU")).toBe(false);
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

describe("assessmentAge — how old the ledger behind a call row is", () => {
  it("returns null when the ledger carries no stamp — never a claimed age from nothing", () => {
    expect(assessmentAge(null, "2026-09-06")).toBeNull();
    expect(assessmentAge(undefined, "2026-09-06")).toBeNull();
  });

  it("counts whole days from the last assessment to today, fresh at exactly a week", () => {
    expect(assessmentAge("2026-09-06", "2026-09-06")).toEqual({ days: 0, stale: false });
    expect(assessmentAge("2026-08-30", "2026-09-06")).toEqual({ days: 7, stale: false });
  });

  it("flags stale once the assessment is more than a week old", () => {
    expect(assessmentAge("2026-08-16", "2026-09-06")).toEqual({ days: 21, stale: true });
    expect(assessmentAge("2026-08-29", "2026-09-06")).toEqual({ days: 8, stale: true });
  });
});
