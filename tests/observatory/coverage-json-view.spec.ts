import { coverageBySector, GICS_SECTORS } from "../../src/domain/sector-coverage.js";
import { coverageJsonView } from "../../src/observatory/coverage-json-view.js";

/**
 * R&D → Coverage as data (#3811 slice 3) — the payload shape H renders: all 11 sectors in the
 * ring's order, gaps named, Unclassified kept, and fund numbers formatted only when bars exist.
 */

const map = coverageBySector({
  ledgerIds: ["nvda-2026-08-26-print", "msft-2026-07-29-print", "eia-steo-2026-10-06"],
  allEvents: [
    { id: "nvda-2026-08-26-print", symbols: ["NVDA"] },
    { id: "msft-2026-07-29-print", symbols: ["MSFT"] },
    { id: "eia-steo-2026-10-06", symbols: [] },
  ],
  upcomingEvents: [],
  printSymbols: [],
  heldSymbols: ["EEM", "XOM"],
});

const upcoming = [
  {
    id: "opec-momr-2026-11-12",
    title: "OPEC Monthly Oil Market Report",
    date: "2026-11-12",
    symbols: [],
  },
  { id: "eia-steo-2026-11-10", title: "EIA STEO", date: "2026-11-10", symbols: [] },
].sort((a, b) => a.date.localeCompare(b.date));

const view = (funds: Parameters<typeof coverageJsonView>[0]["funds"]) =>
  coverageJsonView({ asOfIso: "2026-10-26T12:00:00Z", map, upcoming, holdingsRead: true, funds });

describe("the coverage payload", () => {
  const noData = view({ note: "No market data — none is linked." });

  it("carries every one of the 11 sectors, deepest first", () => {
    expect(noData.sectors).toHaveLength(GICS_SECTORS.length);
    expect(noData.sectors[0]?.sector).toBe("Technology");
    expect(noData.sectors[0]?.researched).toEqual(["MSFT", "NVDA"]);
    expect(noData.sectors.at(-1)?.depth).toBe("gap");
  });

  it("names the gaps, and every gap row sorts after every covered one", () => {
    const firstGap = noData.sectors.findIndex((s) => s.depth === "gap");
    expect(noData.sectors.slice(firstGap).every((s) => s.depth === "gap")).toBe(true);
    expect(noData.gaps).toEqual(noData.sectors.slice(firstGap).map((s) => s.sector));
  });

  it("keeps a holding the directory cannot file in Unclassified, with no token to filter by", () => {
    expect(noData.unclassified.held).toEqual(["EEM"]);
    expect(noData.unclassified.slug).toBeNull();
  });

  it("gives each sector the next dated item the Board's own sector rule places there", () => {
    const energy = noData.sectors.find((s) => s.sector === "Energy");
    expect(energy?.next).toEqual({ title: "EIA STEO", date: "2026-11-10" });
    expect(energy?.held).toEqual(["XOM"]);
    expect(energy?.slug).toBe("energy");
  });

  it("shows no number and says why when there is no market data", () => {
    expect(noData.funds).toEqual({ available: false, note: "No market data — none is linked." });
    expect(noData.sectors.some((s) => s.fundLine)).toBe(false);
  });

  it("formats a fund's month, its gap to SPY and its vol, stamped with the oldest bar date", () => {
    const linked = view({
      byFund: new Map([
        ["XLE", { ret: 0.041, vsSpy: 0.023, vol20: 0.18, asOf: "2026-10-23" }],
        ["XLK", { ret: -0.012, asOf: "2026-10-22" }],
      ]),
    });
    expect(linked.funds).toEqual({ available: true, window: "1M", asOf: "2026-10-22" });
    const energy = linked.sectors.find((s) => s.sector === "Energy");
    expect(energy?.fundLine).toEqual({
      ret: "+4.1%",
      retTone: "pos",
      vsSpy: "+2.3 pts vs S&P",
      vsSpyTone: "pos",
      vol: "vol 18%",
    });
    const tech = linked.sectors.find((s) => s.sector === "Technology");
    expect(tech?.fundLine).toEqual({ ret: "-1.2%", retTone: "neg" });
  });

  it("counts the readout: covered, by name, by macro reports only", () => {
    expect(noData.coveredCount).toBe(2);
    expect(noData.byName).toBe(1);
    expect(noData.byMacroOnly).toBe(1);
    expect(noData.heldSectorCount).toBe(1);
  });
});
