import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GICS_SECTORS,
  SECTOR_MACRO_SERIES,
  symbolsInSector,
} from "../../src/domain/sector-coverage.js";
import { createHouseResearchReader, type HouseResearch } from "../../src/server/house-research.js";
import { shelfResearched } from "../../src/server/member-campaign-store.js";
import { researchedEventIds } from "../../src/server/research-service.js";
import { shelfCoverage } from "../../src/server/sector-coverage-service.js";

/**
 * #7448: Moneypenny's research read (`get_research_on`) and the coverage map read the same shelf,
 * and the reader once looked in fewer places than the map. Real Estate read "researched nothing"
 * beside its house-price ledgers, which the map filed under it by series (#7442). Each fix pinned
 * one example. This spec pins the class: over one scratch shelf, for every sector, the reader must
 * find every ledger the map credits to it, by name and by series. A store the map reads and the
 * reader skips turns it red.
 *
 * It checks the map's two RESEARCH columns (`researched`, `eventLedgers`), not its `depth` label.
 * A tile's depth also counts the viewer's holdings and the upcoming calendar, and neither is house
 * research. A reader that called a sector researched because a print is coming would be saying
 * something false.
 *
 * The reader is wired the way `src/scripts/dashboard-companion.ts` wires it, with no campaigns and
 * no lessons, so the shelf alone has to carry the answer.
 */

const AS_OF = "2026-11-11";

/** A ticker the directory files under the sector, safe to lead a ledger id (no dash or dot). */
const firstPlainName = (sector: string): string | undefined =>
  symbolsInSector(sector).find((s) => /^[A-Z]+$/.test(s));

/** The scratch shelf's ledger ids: one per macro series the table attributes to a sector, one
 *  per-ticker ledger in every other GICS sector, one ledger named for the company rather than the
 *  ticker (LEN, through its event), and one broad macro ledger no sector may claim. */
function fixtureLedgers(): string[] {
  const series = SECTOR_MACRO_SERIES.map((s) => `${s.prefix.replace(/-$/, "")}-2026-10-01`);
  const names = GICS_SECTORS.filter((_, i) => i % 2 === 0)
    .map((s) => firstPlainName(s.name))
    .filter((t): t is string => t !== undefined)
    .map((t) => `${t.toLowerCase()}-2026-10-01-print`);
  return [...series, ...names, "lennar-q3-fy2026-2026-09-16", "cpi-2026-10-15"];
}

function scratchShelf(ledgerIds: readonly string[]): string {
  const root = mkdtempSync(join(tmpdir(), "house-coverage-"));
  mkdirSync(join(root, "events"), { recursive: true });
  for (const id of ledgerIds) writeFileSync(join(root, "events", `${id}.md`), `# ${id}\n`);
  return root;
}

function readerOver(root: string) {
  return createHouseResearchReader({
    shelf: () => shelfResearched(root),
    ledgerIds: () => researchedEventIds(root),
    queue: () => [],
    answered: () => false,
    writeUps: () => [],
    today: () => AS_OF,
    laneReads: true,
    campaigns: [],
    lessons: [],
  });
}

/** Everything a sector read found on the shelf. */
const namesOf = (out: HouseResearch): number =>
  (out.ledgersInSector?.names.length ?? 0) + (out.ledgersInSector?.more ?? 0);
const seriesLedgersOf = (out: HouseResearch): number =>
  (out.seriesInSector ?? []).reduce((n, s) => n + s.ledgers, 0);
const readsAsResearched = (out: HouseResearch): boolean =>
  out.campaigns.length > 0 ||
  out.lessons.length > 0 ||
  namesOf(out) > 0 ||
  seriesLedgersOf(out) > 0 ||
  (out.writeUps?.length ?? 0) > 0;

describe("get_research_on agrees with the coverage map on one shelf (#7448)", () => {
  const ledgers = fixtureLedgers();
  const root = scratchShelf(ledgers);
  const map = shelfCoverage(AS_OF, [], root);
  const read = readerOver(root);

  it("the fixture exercises both columns: sectors covered by name, by series only, and gaps", () => {
    const byName = map.sectors.filter((s) => s.researched.length > 0);
    const bySeriesOnly = map.sectors.filter(
      (s) => s.researched.length === 0 && s.eventLedgers.length > 0,
    );
    const neither = map.sectors.filter(
      (s) => s.researched.length === 0 && s.eventLedgers.length === 0,
    );
    expect(byName.length).toBeGreaterThan(0);
    expect(bySeriesOnly.length).toBeGreaterThan(0);
    expect(neither.length).toBeGreaterThan(0);
    // The broad macro ledger is attributed to no sector, by the table's admission rule.
    expect(map.sectors.flatMap((s) => s.eventLedgers)).not.toContain("cpi-2026-10-15");
  });

  it.each(GICS_SECTORS.map((s) => s.name))(
    "%s: names every ledgered company and counts every series ledger the map credits",
    (sector) => {
      const row = map.sectors.find((s) => s.sector === sector);
      const out = read({ kind: "sector", subject: sector }, []);
      expect(namesOf(out)).toBe(row?.researched.length);
      expect(out.ledgersInSector?.names).toEqual(
        row?.researched.slice(0, out.ledgersInSector?.names.length),
      );
      expect(seriesLedgersOf(out)).toBe(row?.eventLedgers.length);
    },
  );

  it("a sector the map credits with any research never reads as nothing, and a gap never reads as researched", () => {
    for (const row of map.sectors) {
      const credited = row.researched.length > 0 || row.eventLedgers.length > 0;
      const out = read({ kind: "sector", subject: row.sector }, []);
      expect({ sector: row.sector, researched: readsAsResearched(out) }).toEqual({
        sector: row.sector,
        researched: credited,
      });
    }
  });

  it("a company the map counts as researched reads as having a ledger, a company-named ledger included", () => {
    const researched = map.sectors.flatMap((s) => s.researched);
    expect(researched).toContain("LEN");
    for (const ticker of researched) {
      expect({ ticker, shelf: read({ kind: "name", subject: ticker }, []).shelf }).toEqual({
        ticker,
        shelf: "has a research ledger",
      });
    }
  });
});
