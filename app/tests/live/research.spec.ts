import {
  assessmentAge,
  callForLens,
  DEFAULT_LENS,
  docSymbolMatch,
  mentionsSymbol,
  parseResearchQuery,
  type ResearchCall,
  type ResearchDocLink,
  scopeEmptyText,
  setFacet,
  setLens,
  toggleOnDate,
  toggleSectorScope,
  toggleSymbolScope,
  unsearchedSymbols,
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

  it("reads the all lens as an explicit token only — week stays the silent default", () => {
    expect(parseResearchQuery("lens:all").lens).toBe("all");
    expect(setLens("NVDA", "all")).toBe("NVDA lens:all");
    expect(setLens("NVDA lens:all", "week")).toBe("NVDA");
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

describe("setFacet — one slot writes one token", () => {
  it("sets, replaces and clears a facet while every other token survives", () => {
    expect(setFacet("NVDA lens:month", "kind", "opex")).toBe("NVDA lens:month kind:opex");
    expect(setFacet("kind:opex NVDA", "kind", "rates")).toBe("NVDA kind:rates");
    expect(setFacet("kind:opex call:watch NVDA", "kind", undefined)).toBe("call:watch NVDA");
    expect(setFacet("", "call", "act")).toBe("call:act");
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

// The WHERE axis (#3811): one sector, resolved to its canonical name so the readout can say it.
describe("the sector: token", () => {
  it("reads a sector slug as its canonical name and keeps it out of the text terms", () => {
    const filter = parseResearchQuery("sector:consumer-discretionary fed");
    expect(filter.sector).toBe("Consumer Discretionary");
    expect(filter.terms).toEqual(["fed"]);
  });

  it("leaves a slug that names no sector visible as a term, the way impact:huge is", () => {
    const filter = parseResearchQuery("sector:crypto");
    expect(filter.sector).toBeUndefined();
    expect(filter.terms).toEqual(["sector:crypto"]);
  });

  it("refuses `unclassified` — a coverage ROW, not a place an event can be in", () => {
    // Resolving it would empty the board and then blame a sector nothing is filed under.
    expect(parseResearchQuery("sector:unclassified").sector).toBeUndefined();
  });

  it("is single-valued: a second sector replaces the first rather than widening", () => {
    expect(toggleSectorScope("sector:energy fed", "Technology")).toBe("fed sector:technology");
    expect(parseResearchQuery("sector:energy sector:technology").sector).toBe("Energy");
  });

  it("clears on a second tap of the same sector, and every other token survives", () => {
    expect(toggleSectorScope("fed lens:month", "Energy")).toBe("fed lens:month sector:energy");
    expect(toggleSectorScope("fed sector:energy lens:month", "Energy")).toBe("fed lens:month");
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

  it("shows the ledger's headline row under the all lens, which selects no horizon", () => {
    expect(callForLens(call, "all")).toEqual({
      call: "Stand aside",
      horizon: "Today",
      confidence: "High",
    });
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

/**
 * THE `sym:` SCOPE'S TWO DEGREES (#3962) — a document the symbol is NAMED in versus one that only
 * mentions it. `named` is decided from the payload (slug, event); `mentions` is the server's corpus
 * answer, which is absent while in flight, so the degraded read must never claim silence.
 */
describe("docSymbolMatch", () => {
  const doc = (slug: string): ResearchDocLink => ({
    slug,
    title: slug,
    lastAssessed: null,
    href: `/research/${slug}`,
  });

  it("marks a document its slug names as named for the symbol", () => {
    expect(docSymbolMatch(doc("events/nvda-2026-08-26-print"), ["NVDA"], {})).toEqual({
      kind: "named",
      symbols: ["NVDA"],
    });
  });

  it("marks a document its event names as named, even when the slug does not", () => {
    expect(docSymbolMatch(doc("events/gtc-2026-03-17"), ["NVDA"], {}, ["NVDA"])).toEqual({
      kind: "named",
      symbols: ["NVDA"],
    });
  });

  it("marks a document only the corpus search found as a mention", () => {
    const found = { NVDA: ["supply-chain"] };
    expect(docSymbolMatch(doc("supply-chain"), ["NVDA"], found)).toEqual({
      kind: "mentions",
      symbols: ["NVDA"],
    });
  });

  it("prefers named over mentions, so a symbol's own ledger never reads as a passing reference", () => {
    const slug = "events/nvda-2026-08-26-print";
    const match = docSymbolMatch(doc(slug), ["NVDA"], { NVDA: [slug] });
    expect(match?.kind).toBe("named");
  });

  it("reads a slug as its words, so a symbol buried inside one is not called a name", () => {
    // 21 slugs in the corpus contain "PPI" as a substring without being about PPI at all.
    expect(docSymbolMatch(doc("events/russell-style-month-end-capping"), ["PPI"], {})).toBeNull();
    expect(docSymbolMatch(doc("multi-symbol-sweep"), ["MU"], {})).toBeNull();
    // …while the slugs that really do lead with the symbol still read as named.
    expect(docSymbolMatch(doc("events/mu-2026-12-17-print"), ["MU"], {})?.kind).toBe("named");
    expect(docSymbolMatch(doc("nvda-accelerator-cycle"), ["NVDA"], {})?.kind).toBe("named");
  });

  it("leaves a document out of scope when neither net catches it", () => {
    expect(docSymbolMatch(doc("supply-chain"), ["NVDA"], { NVDA: [] })).toBeNull();
  });

  it("degrades to the slug nets while the search is still out — never to a claim of silence", () => {
    expect(docSymbolMatch(doc("events/nvda-2026-08-26-print"), ["NVDA"], {})?.kind).toBe("named");
    expect(docSymbolMatch(doc("supply-chain"), ["NVDA"], {})).toBeNull();
  });

  it("reports every scoped symbol a document matched, in the scope's order", () => {
    const found = { AVGO: ["supply-chain"], MU: ["supply-chain"] };
    expect(docSymbolMatch(doc("supply-chain"), ["AVGO", "MU"], found)?.symbols).toEqual([
      "AVGO",
      "MU",
    ]);
  });

  it("marks nothing at all when no symbol is scoped", () => {
    expect(docSymbolMatch(doc("supply-chain"), [], {})).toBeNull();
  });
});

/** The empty line under a scope (#3962): it must never claim silence the search has not proven. */
describe("scopeEmptyText", () => {
  it("says nothing special when no symbol is scoped — the older copy still applies", () => {
    expect(scopeEmptyText("study", "", [], "answered")).toBeNull();
  });

  it("names the symbol rather than blaming the filter, once the search has answered", () => {
    expect(scopeEmptyText("study", "", ["NVDA"], "answered")).toBe("No study mentions NVDA.");
    expect(scopeEmptyText("ledger", " in this week", ["NVDA"], "answered")).toBe(
      "No ledger in this week mentions NVDA.",
    );
  });

  it("reads the whole watchlist back", () => {
    expect(scopeEmptyText("study", "", ["NVDA", "AVGO"], "answered")).toBe(
      "No study mentions NVDA or AVGO.",
    );
  });

  it("hands the filter the credit when another facet is what emptied the list", () => {
    // An NVDA ledger dropped by `impact:low` still mentions NVDA — saying otherwise is false.
    expect(scopeEmptyText("ledger", " in this week", ["NVDA"], "answered", true)).toBe(
      "No ledger in this week matches this filter.",
    );
  });

  it("says a symbol past the server's cap was never searched, rather than answering for it", () => {
    const text = scopeEmptyText("study", "", ["NVDA", "AVGO"], "partial") ?? "";
    expect(text).toContain("only the first few names in this scope were searched");
    expect(text).not.toContain("mentions NVDA");
  });

  it("says it is still searching rather than claiming nothing mentions the symbol", () => {
    expect(scopeEmptyText("study", "", ["NVDA"], "searching")).toBe(
      "Searching every study for NVDA…",
    );
  });

  it("admits when only titles and slugs were checked, instead of implying the text was", () => {
    const text = scopeEmptyText("study", "", ["NVDA"], "unreachable") ?? "";
    expect(text).toContain("the text search is unreachable");
    // Titles are never tested against a scoped symbol, so the copy must not claim they were.
    expect(text).toContain("only slugs and events were checked");
    expect(text).not.toContain("mentions NVDA");
  });
});

/** A missing key and an empty list are different answers — the board's honesty depends on it. */
describe("unsearchedSymbols", () => {
  it("names the scoped symbols the server returned no entry for", () => {
    expect(unsearchedSymbols(["NVDA", "AVGO"], { NVDA: [] })).toEqual(["AVGO"]);
  });

  it("treats an empty list as a real answer, not as unsearched", () => {
    expect(unsearchedSymbols(["NVDA"], { NVDA: [] })).toEqual([]);
  });

  it("reports the whole scope as unsearched before any answer arrives", () => {
    expect(unsearchedSymbols(["NVDA", "AVGO"], {})).toEqual(["NVDA", "AVGO"]);
  });
});
