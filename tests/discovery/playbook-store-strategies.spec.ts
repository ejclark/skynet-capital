import { strategyCatalog } from "../../src/discovery/playbook-store-strategies.js";
import { EVIDENCE_STATUS, pairTable } from "../../src/playbooks/pair-table.js";

/**
 * The Store by strategy (#4469 slice 3a): one card per strategy, a row per pair, every row keyed on
 * the pair id the records already use.
 */

const TODAY = "2026-10-07T15:00:00.000Z";
const catalog = strategyCatalog(TODAY);
const card = (strategy: string) => catalog.find((c) => c.strategy === strategy);

describe("strategyCatalog", () => {
  it("draws one card per strategy, not one per ticker", () => {
    const strategies = catalog.map((c) => c.strategy);
    expect(new Set(strategies).size).toBe(strategies.length);
    expect(card("pre-print-run-up")?.pairs.map((row) => row.id)).toEqual(["S1-NVDA", "G1-GOOG"]);
  });

  it("puts every pair on exactly one card, under its own id", () => {
    const rows = catalog.flatMap((c) => c.pairs.map((row) => row.id));
    expect([...rows].sort()).toEqual(
      pairTable()
        .map((pair) => pair.id)
        .sort(),
    );
  });

  it("keys the wheel on CRWV as CRWV-WHEEL, so subscribing to it posts that id", () => {
    expect(card("wheel")).toMatchObject({
      name: "the wheel",
      instrument: "options",
      screen: "node scripts/research/premium-fit.mjs <SYM>",
      pairs: [{ id: "CRWV-WHEEL", symbols: ["CRWV"], status: "conviction", checkOn: "2027-01-29" }],
    });
  });

  it("says every row's status as a glyph plus words", () => {
    for (const row of catalog.flatMap((c) => c.pairs)) {
      const { glyph, word } = EVIDENCE_STATUS[row.status];
      expect(row.statusLabel.startsWith(`${glyph} ${word}`), row.id).toBe(true);
    }
    expect(card("pre-print-run-up")?.pairs[0]?.statusLabel).toBe("✓ researched, weakened");
  });

  it("links each row to its own study on the research shelf", () => {
    expect(card("pre-print-run-up")?.pairs.map((row) => row.studyHref)).toEqual([
      "/research/events/nvda-2026-11-18-print",
      "/research/multi-symbol-sweep",
    ]);
  });

  it("says why a strategy has no screen instead of leaving it blank", () => {
    for (const c of catalog) {
      expect(Boolean(c.screen) !== Boolean(c.noScreen), c.strategy).toBe(true);
    }
  });

  it("marks a ✓ row past its shelf date stale, in words", () => {
    const later = strategyCatalog("2027-04-01T15:00:00.000Z");
    const s1 = later.flatMap((c) => c.pairs).find((row) => row.id === "S1-NVDA");
    expect(s1).toMatchObject({
      stale: true,
      statusLabel: "✓ researched, weakened · past its shelf date",
    });
    expect(catalog.flatMap((c) => c.pairs).every((row) => !row.stale)).toBe(true);
  });
});

describe("strategyCatalog summaries", () => {
  it("gives every card a one-line summary of the strategy, never of a ticker", () => {
    for (const c of catalog) {
      expect(c.summary.length).toBeGreaterThan(20);
      expect(c.summary).not.toContain("\n");
    }
    expect(card("wheel")?.summary).toMatch(/cash-secured put/);
  });
});
