import { join } from "node:path";
import { GICS_SECTORS } from "../../src/domain/sector-coverage.js";
import { heldUnderlying, shelfCoverage } from "../../src/server/sector-coverage-service.js";

const FIXTURE = join(process.cwd(), "e2e", "fixtures", "research");
const AS_OF = "2026-10-02T12:00:00Z";

const rowFor = (map: ReturnType<typeof shelfCoverage>, sector: string) => {
  const row = map.sectors.find((s) => s.sector === sector);
  if (!row) throw new Error(`no row for ${sector}`);
  return row;
};

describe("the shelf's coverage map", () => {
  describe("heldUnderlying", () => {
    it("counts an option row for its underlying, never its OCC id", () => {
      expect(heldUnderlying("NVDA261218C00180000")).toBe("NVDA");
    });

    it("passes an equity symbol through, upper-cased", () => {
      expect(heldUnderlying(" xom ")).toBe("XOM");
    });
  });

  describe("over the frozen fixture corpus", () => {
    it("returns all 11 GICS sectors", () => {
      const map = shelfCoverage(AS_OF, [], FIXTURE);
      expect(map.sectors.map((s) => s.sector)).toEqual(GICS_SECTORS.map((s) => s.name));
    });

    it("counts the company-named Lennar ledger toward LEN (#3811 criterion 8)", () => {
      const map = shelfCoverage(AS_OF, [], FIXTURE);
      expect(rowFor(map, "Consumer Discretionary").researched).toContain("LEN");
    });

    it("credits a sector for its own macro series — housing starts, no builder name needed", () => {
      const map = shelfCoverage(AS_OF, [], FIXTURE);
      expect(rowFor(map, "Consumer Discretionary").eventLedgers).toContain(
        "housing-starts-2026-09-17",
      );
    });

    it("attributes a market-wide print to no sector at all", () => {
      const map = shelfCoverage(AS_OF, [], FIXTURE);
      const attributed = [...map.sectors, map.unclassified].flatMap((s) => s.eventLedgers);
      expect(attributed.some((id) => id.startsWith("fomc-"))).toBe(false);
    });

    it("files a held ETF under Unclassified rather than inventing a sector for it", () => {
      const map = shelfCoverage(AS_OF, ["EEM"], FIXTURE);
      expect(map.unclassified.held).toEqual(["EEM"]);
      expect(map.sectors.flatMap((s) => s.held)).toEqual([]);
    });
  });

  // THE SLICE'S OWN FALSIFIER (#3811 slice 1): "a spec over the corpus shows fewer than 11 sectors,
  // or COST missing from Consumer Staples." These three ledgers are closed-out and stay on disk, so
  // asserting membership (never a count) survives the research lane's hourly merges.
  describe("over the live corpus", () => {
    it("returns all 11 GICS sectors", () => {
      expect(shelfCoverage(AS_OF).sectors).toHaveLength(11);
    });

    it("counts COST, LEN and KBH under their own tickers, not as dropped names", () => {
      const map = shelfCoverage(AS_OF);
      expect(rowFor(map, "Consumer Staples").researched).toContain("COST");
      expect(rowFor(map, "Consumer Discretionary").researched).toContain("LEN");
      expect(rowFor(map, "Consumer Discretionary").researched).toContain("KBH");
      expect(map.unclassified.researched).not.toContain("KBH");
    });

    it("shows energy as covered by EVENTS, not by names — Eric's own read of the gap", () => {
      const energy = rowFor(shelfCoverage(AS_OF), "Energy");
      expect(energy.eventLedgers.length).toBeGreaterThan(0);
      expect(energy.depth).toBe("events");
    });
  });
});
