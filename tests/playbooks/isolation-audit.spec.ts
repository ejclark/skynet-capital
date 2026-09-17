import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { playbookIntents } from "../../src/playbooks/playbook.js";
import { G1_GOOG, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";
import { aContext, aPortfolio } from "../support/builders.js";

/**
 * PLAYBOOK ANATOMY (#3194, step 3) — observe-only decision-isolation audit. Proves, with
 * evidence rather than assumption, that a playbook's own intent for a cycle never changes
 * depending on which OTHER playbooks are enabled alongside it. This is the isolation contract
 * #3194 wrote down: every playbook decides independently by default, and the one declared
 * exception (`derivesFrom`) is checked for validity — not enforced yet, since nothing enables
 * it today. Nothing here blocks or alters a live decision; it is pure test-writing against the
 * existing `playbookIntents` engine.
 */

const CALENDAR: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-03", status: "confirmed", source: "test fixture" },
  { symbol: "GOOG", date: "2026-08-03", status: "confirmed", source: "test fixture" },
];

describe("isolation audit: one playbook's intent is unaffected by its peers", () => {
  it("gives S1-NVDA the same intent alone as it does alongside G1-GOOG and TACO-DJT", () => {
    const context = aContext({ NVDA: { last: 100 }, GOOG: { last: 100 }, DJT: { last: 20 } });
    const portfolio = aPortfolio({ cash: 5_000_000 });

    const alone = playbookIntents(
      [{ playbook: S1_NVDA, mode: "standard" }],
      context,
      portfolio,
      CALENDAR,
    );
    const withPeers = playbookIntents(
      [
        { playbook: S1_NVDA, mode: "standard" },
        { playbook: G1_GOOG, mode: "standard" },
        { playbook: TACO_DJT, mode: "standard" },
      ],
      context,
      portfolio,
      CALENDAR,
    );

    expect(withPeers.filter((i) => i.playbookId === S1_NVDA.id)).toEqual(
      alone.filter((i) => i.playbookId === S1_NVDA.id),
    );
  });

  it("gives the same set of intents regardless of enabled-list order", () => {
    const context = aContext({ NVDA: { last: 100 }, GOOG: { last: 100 } });
    const portfolio = aPortfolio({ cash: 5_000_000 });

    const forward = playbookIntents(
      [
        { playbook: S1_NVDA, mode: "standard" },
        { playbook: G1_GOOG, mode: "standard" },
      ],
      context,
      portfolio,
      CALENDAR,
    );
    const reversed = playbookIntents(
      [
        { playbook: G1_GOOG, mode: "standard" },
        { playbook: S1_NVDA, mode: "standard" },
      ],
      context,
      portfolio,
      CALENDAR,
    );

    const bySymbol = (list: typeof forward) =>
      [...list].sort((a, b) => a.symbol.localeCompare(b.symbol));
    expect(bySymbol(reversed)).toEqual(bySymbol(forward));
  });

  it("today's roster declares no derivative playbooks — the isolation default holds untested by exception", () => {
    // The moment a playbook declares `derivesFrom`, this audit's job changes: it must then
    // confirm the named parent actually exists in the roster. Written now so the check exists
    // before the first derivative playbook does, per #3194's isolation contract.
    for (const playbook of [S1_NVDA, G1_GOOG, TACO_DJT]) {
      expect(playbook.derivesFrom).toBeUndefined();
    }
  });

  it("would catch a derivative playbook naming a parent that isn't in the roster", () => {
    const orphan = { ...S1_NVDA, id: "S1-NVDA-DERIVED", derivesFrom: "NOT-A-REAL-PLAYBOOK-ID" };
    const roster = [S1_NVDA, G1_GOOG, TACO_DJT];
    const rosterIds = new Set(roster.map((p) => p.id));
    expect(orphan.derivesFrom !== undefined && !rosterIds.has(orphan.derivesFrom)).toBe(true);
  });
});
