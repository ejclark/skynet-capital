import {
  type CoverageInputs,
  coverageBySector,
  eventInSector,
  GICS_SECTORS,
  ledgerCoversSymbol,
  macroPrefixesFor,
  sectorFromSlug,
  sectorOf,
  sectorSlug,
  symbolsInSector,
  UNCLASSIFIED,
} from "../../src/domain/sector-coverage.js";

const noInputs: CoverageInputs = {
  ledgerIds: [],
  allEvents: [],
  upcomingEvents: [],
  printSymbols: [],
  heldSymbols: [],
};

const rowFor = (map: ReturnType<typeof coverageBySector>, sector: string) => {
  const row = map.sectors.find((s) => s.sector === sector);
  if (!row) throw new Error(`no row for ${sector}`);
  return row;
};

describe("sector coverage", () => {
  describe("the sector table", () => {
    it("is exactly the 11 GICS sectors", () => {
      expect(GICS_SECTORS).toHaveLength(11);
      expect(new Set(GICS_SECTORS.map((s) => s.name)).size).toBe(11);
    });

    it("gives each sector a distinct SPDR Select Sector fund — no invented ticker reuse", () => {
      const funds = GICS_SECTORS.map((s) => s.fund);
      expect(new Set(funds).size).toBe(funds.length);
      for (const fund of funds) expect(fund).toMatch(/^XL[A-Z]{1,2}$/);
    });

    it("files a symbol by the directory's GICS sector", () => {
      expect(sectorOf("NVDA")).toBe("Technology");
      expect(sectorOf("nvda")).toBe("Technology");
      expect(sectorOf("GOOG")).toBe("Communication Services");
      expect(sectorOf("COST")).toBe("Consumer Staples");
    });

    it("files the directory's NON-GICS buckets as unclassified, never as a sector", () => {
      // "ETF", "Crypto" and "Small cap" are directory conveniences, not GICS sectors.
      expect(sectorOf("SPY")).toBeUndefined();
      expect(sectorOf("BTCUSD")).toBeUndefined();
    });

    it("leaves a symbol the directory has never heard of unfiled", () => {
      expect(sectorOf("ZZZZQ")).toBeUndefined();
    });

    it("round-trips a sector name through its query slug", () => {
      expect(sectorSlug("Consumer Discretionary")).toBe("consumer-discretionary");
      expect(sectorFromSlug("consumer-discretionary")).toBe("Consumer Discretionary");
      expect(sectorFromSlug("real-estate")).toBe("Real Estate");
    });

    it("resolves an unknown slug to nothing — a token nobody can answer filters nothing", () => {
      expect(sectorFromSlug("crypto")).toBeUndefined();
      expect(sectorFromSlug("")).toBeUndefined();
    });

    it("refuses the Unclassified ROW as a scope — no event is filed there", () => {
      // It resolves to nothing precisely because `eventInSector(UNCLASSIFIED, …)` can never be
      // true: scoping it would empty the board and then blame a sector nothing is filed under.
      expect(sectorFromSlug(sectorSlug(UNCLASSIFIED))).toBeUndefined();
      expect(eventInSector(UNCLASSIFIED, { id: "nvda-2026-08-26-print", symbols: ["NVDA"] })).toBe(
        false,
      );
    });

    it("lists a sector's members, and files the homebuilders together", () => {
      const builders = symbolsInSector("Consumer Discretionary");
      // KBH joined the directory with #3811: its ledger was already on the shelf, so without the
      // row a RESEARCHED name had to be filed under Unclassified.
      for (const sym of ["DHI", "KBH", "LEN", "NVR", "PHM"]) expect(builders).toContain(sym);
      expect(symbolsInSector("Consumer Discretionary")).not.toContain("NVDA");
      expect(symbolsInSector(UNCLASSIFIED)).toEqual([]);
    });
  });

  describe("the macro series table", () => {
    it("attributes energy's own series to Energy", () => {
      expect(macroPrefixesFor("Energy")).toContain("eia-");
      expect(macroPrefixesFor("Energy")).toContain("opec-");
    });

    it("attributes a broad index to NO sector — CPI and FOMC inform all 11", () => {
      const prefixes = GICS_SECTORS.flatMap((s) => macroPrefixesFor(s.name));
      for (const broad of ["cpi-", "ppi-", "jobs-", "fomc-", "ism-manufacturing-", "treasury-"]) {
        expect(prefixes).not.toContain(broad);
      }
    });
  });

  describe("eventInSector", () => {
    it("places an event by the symbols it names", () => {
      expect(eventInSector("Technology", { id: "whatever-2026-01-01", symbols: ["NVDA"] })).toBe(
        true,
      );
      expect(eventInSector("Energy", { id: "whatever-2026-01-01", symbols: ["NVDA"] })).toBe(false);
    });

    it("places a ledger-shaped id by its leading symbol, with no symbols at all", () => {
      expect(eventInSector("Technology", { id: "nvda-2026-08-26-print", symbols: [] })).toBe(true);
    });

    it("places a sector's own macro series — energy covered by events, not by names", () => {
      expect(eventInSector("Energy", { id: "eia-steo-2026-10-06", symbols: [] })).toBe(true);
      expect(eventInSector("Utilities", { id: "pjm-capacity-auction-2026-12", symbols: [] })).toBe(
        true,
      );
    });

    it("places a market-wide print in no sector", () => {
      expect(eventInSector("Energy", { id: "cpi-2026-10-13", symbols: [] })).toBe(false);
      expect(eventInSector("Technology", { id: "cpi-2026-10-13", symbols: [] })).toBe(false);
    });
  });

  describe("ledgerCoversSymbol", () => {
    it("matches the id prefix convention", () => {
      expect(ledgerCoversSymbol("nvda-2026-08-26-print", "NVDA")).toBe(true);
      expect(ledgerCoversSymbol("nvda-2026-08-26-print", "MU")).toBe(false);
    });

    it("never matches a longer symbol that merely starts the same way", () => {
      expect(ledgerCoversSymbol("mu-2026-09-30-print", "M")).toBe(false);
    });

    it("counts a COMPANY-named ledger through its event's symbols (#3811 criterion 8)", () => {
      const eventSymbols = new Set(["COST"]);
      expect(ledgerCoversSymbol("costco-q4-fy2026-2026-09-24", "COST", eventSymbols)).toBe(true);
      // Without the event's symbols there is nothing to read it off — honestly false, not guessed.
      expect(ledgerCoversSymbol("costco-q4-fy2026-2026-09-24", "COST")).toBe(false);
    });
  });

  describe("coverageBySector", () => {
    it("returns all 11 sectors even with an empty corpus — a gap still gets its row", () => {
      const map = coverageBySector(noInputs);
      expect(map.sectors).toHaveLength(11);
      expect(map.sectors.map((s) => s.sector)).toEqual(GICS_SECTORS.map((s) => s.name));
      expect(map.sectors.every((s) => s.depth === "gap")).toBe(true);
      expect(map.coveredCount).toBe(0);
    });

    it("marks a sector researched when a ledger is for one of its names", () => {
      const map = coverageBySector({
        ...noInputs,
        ledgerIds: ["events/nvda-2026-08-26-print"],
        allEvents: [{ id: "nvda-2026-08-26-print", symbols: ["NVDA"] }],
      });
      expect(rowFor(map, "Technology").researched).toEqual(["NVDA"]);
      expect(rowFor(map, "Technology").depth).toBe("researched");
      expect(map.coveredCount).toBe(1);
    });

    it("counts a company-named ledger toward its ticker's sector", () => {
      const map = coverageBySector({
        ...noInputs,
        ledgerIds: ["events/costco-q4-fy2026-2026-09-24"],
        allEvents: [{ id: "costco-q4-fy2026-2026-09-24", symbols: ["COST"] }],
      });
      expect(rowFor(map, "Consumer Staples").researched).toEqual(["COST"]);
    });

    it("keeps a ledger counting after its event ages off the calendar", () => {
      // Coverage must not expire: earnings events come from a rolling forward window, so reading
      // researched off the events would flip a sector to `gap` the day its print dropped out.
      const map = coverageBySector({ ...noInputs, ledgerIds: ["events/jpm-2026-07-14-print"] });
      expect(rowFor(map, "Financials").researched).toEqual(["JPM"]);
      expect(map.coveredCount).toBe(1);
    });

    it("never mints a ticker out of a macro ledger's prefix", () => {
      // `eia-steo-…` must not file "EIA" as a researched NAME — there is no such ticker.
      const map = coverageBySector({ ...noInputs, ledgerIds: ["events/eia-steo-2026-10-06"] });
      expect(map.unclassified.researched).toEqual([]);
      expect(map.sectors.flatMap((s) => s.researched)).toEqual([]);
    });

    it("lists a held name that also has an upcoming print in BOTH columns", () => {
      // Different axes: research depth vs. the viewer's portfolio. "Print coming, no ledger, and
      // you own it" is the most useful cell on the map — tidying one of the two away loses it.
      const map = coverageBySector({ ...noInputs, printSymbols: ["NVDA"], heldSymbols: ["NVDA"] });
      const tech = rowFor(map, "Technology");
      expect(tech.calendar).toEqual(["NVDA"]);
      expect(tech.held).toEqual(["NVDA"]);
      expect(tech.depth).toBe("held");
    });

    it("separates on-the-calendar from researched — a symbol is never in both", () => {
      const map = coverageBySector({
        ...noInputs,
        ledgerIds: ["nvda-2026-08-26-print"],
        allEvents: [
          { id: "nvda-2026-08-26-print", symbols: ["NVDA"] },
          { id: "jpm-2026-10-13-print", symbols: ["JPM"] },
        ],
        upcomingEvents: [
          { id: "nvda-2026-08-26-print", symbols: ["NVDA"] },
          { id: "jpm-2026-10-13-print", symbols: ["JPM"] },
        ],
      });
      expect(rowFor(map, "Technology").researched).toEqual(["NVDA"]);
      expect(rowFor(map, "Technology").calendar).toEqual([]);
      expect(rowFor(map, "Financials").calendar).toEqual(["JPM"]);
      expect(rowFor(map, "Financials").depth).toBe("calendar");
    });

    it("counts a forward print with no ledger as on the calendar", () => {
      const map = coverageBySector({ ...noInputs, printSymbols: ["AVGO"] });
      expect(rowFor(map, "Technology").calendar).toEqual(["AVGO"]);
    });

    it("marks a sector covered by its macro series alone as `events`, not a gap", () => {
      const map = coverageBySector({ ...noInputs, ledgerIds: ["events/eia-steo-2026-10-06"] });
      const energy = rowFor(map, "Energy");
      expect(energy.eventLedgers).toEqual(["eia-steo-2026-10-06"]);
      expect(energy.researched).toEqual([]);
      expect(energy.depth).toBe("events");
    });

    it("reads a holding as coverage, option rows included by their underlying", () => {
      const map = coverageBySector({ ...noInputs, heldSymbols: ["XOM"] });
      expect(rowFor(map, "Energy").held).toEqual(["XOM"]);
      expect(rowFor(map, "Energy").depth).toBe("held");
    });

    it("names an unfilable symbol in the Unclassified row rather than dropping it", () => {
      const map = coverageBySector({ ...noInputs, heldSymbols: ["EEM", "ZZZZQ"] });
      expect(map.unclassified.held).toEqual(["EEM", "ZZZZQ"]);
      expect(map.unclassified.fund).toBeNull();
      expect(map.sectors.flatMap((s) => s.held)).toEqual([]);
    });

    it("counts covered sectors as anything but a gap — the `n of 11` readout", () => {
      const map = coverageBySector({
        ...noInputs,
        ledgerIds: ["eia-steo-2026-10-06"],
        heldSymbols: ["JPM"],
        printSymbols: ["NVDA"],
      });
      expect(map.coveredCount).toBe(3);
      expect(map.sectors.filter((s) => s.depth === "gap")).toHaveLength(8);
    });
  });
});
