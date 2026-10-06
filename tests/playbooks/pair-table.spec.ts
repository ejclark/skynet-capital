import { existsSync } from "node:fs";
import {
  EVIDENCE_STATUS,
  findPair,
  type Pair,
  pairFor,
  pairTable,
  STRATEGIES,
  statusLabel,
} from "../../src/playbooks/pair-table.js";
import { findPlaybook, registeredPlaybooks } from "../../src/playbooks/registry.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("the pair table holds exactly one id per strategy × ticker (#4469 criterion 8)", () => {
  it("has one row for every registered playbook, in roster order, and no others", () => {
    expect(pairTable().map((pair) => pair.id)).toEqual(registeredPlaybooks().map((p) => p.id));
  });

  it("never repeats an id", () => {
    const ids = pairTable().map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never gives one strategy × ticker two ids", () => {
    const seen = new Map<string, string>();
    for (const pair of pairTable()) {
      for (const symbol of pair.symbols) {
        const key = `${pair.strategy} × ${symbol}`;
        expect(seen.get(key), key).toBeUndefined();
        seen.set(key, pair.id);
      }
    }
  });

  it("keeps each pair's tickers equal to its playbook's, so the table cannot drift from what trades", () => {
    for (const pair of pairTable()) {
      expect(findPlaybook(pair.id)?.symbols, pair.id).toEqual(pair.symbols);
    }
  });

  it("names a strategy every pair can be read by", () => {
    for (const pair of pairTable()) {
      expect(STRATEGIES[pair.strategy].id).toBe(pair.strategy);
    }
  });
});

describe("the resolver looks an id up and never builds one", () => {
  it("resolves today's ids to their strategy and ticker", () => {
    expect(findPair("CRWV-WHEEL")).toMatchObject({ strategy: "wheel", symbols: ["CRWV"] });
    expect(findPair("S1-NVDA")).toMatchObject({ strategy: "pre-print-run-up", symbols: ["NVDA"] });
    expect(findPair("G1-GOOG")).toMatchObject({ strategy: "pre-print-run-up", symbols: ["GOOG"] });
    expect(findPair("NVDA-CALL-SPREAD")).toMatchObject({
      strategy: "call-spread",
      symbols: ["NVDA"],
    });
  });

  it("goes from parts to the id the records already key on, whichever order that id spells them", () => {
    // S1-NVDA leads with the strategy, NVDA-CALL-SPREAD with the ticker: no composition rule
    // yields both, which is why the table is the only route.
    expect(pairFor("pre-print-run-up", "NVDA")?.id).toBe("S1-NVDA");
    expect(pairFor("call-spread", "nvda")?.id).toBe("NVDA-CALL-SPREAD");
    expect(pairFor("wheel", "CRWV")?.id).toBe("CRWV-WHEEL");
    expect(pairFor("tactical", "TSLA")?.id).toBe("HC-SAURON");
  });

  it("answers undefined for a pair that does not exist, never an invented id", () => {
    expect(pairFor("wheel", "AMZN")).toBeUndefined();
    expect(findPair("WHEEL-AMZN")).toBeUndefined();
    expect(findPair("NVDA")).toBeUndefined();
  });
});

describe("every row carries the evidence its status promises", () => {
  const rows = (status: Pair["evidence"]["status"]) =>
    pairTable().filter((pair) => pair.evidence.status === status);

  it("cites a study that exists", () => {
    for (const { id, evidence } of pairTable()) {
      if (evidence.study) {
        expect(existsSync(evidence.study), `${id}: ${evidence.study}`).toBe(true);
      }
    }
  });

  it("gives a ✓ its confidence, measured exit, number, study, and a shelf date after its verdict", () => {
    for (const { id, evidence } of rows("researched")) {
      expect(evidence.confidence, id).toBeDefined();
      expect(evidence.measuredExit, id).toBeDefined();
      expect(evidence.number, id).toBeDefined();
      expect(evidence.study, id).toBeDefined();
      expect(evidence.verdictOn, id).toMatch(ISO_DATE);
      expect(evidence.shelfOn, id).toMatch(ISO_DATE);
      expect(`${evidence.shelfOn}` > `${evidence.verdictOn}`, id).toBe(true);
      expect(evidence.checkOn, id).toBeUndefined();
    }
  });

  it("gives a ◆ a check date instead of a shelf date, and the study it overrides", () => {
    for (const { id, evidence } of rows("conviction")) {
      expect(evidence.checkOn, id).toMatch(ISO_DATE);
      expect(evidence.shelfOn, id).toBeUndefined();
      expect(evidence.study, id).toBeDefined();
    }
  });

  it("names why a – pair cannot run", () => {
    for (const { id, evidence } of rows("cant-run")) {
      expect(evidence.reason, id).toBeTruthy();
    }
  });

  it("seeds today's six with the verdicts the plan settled", () => {
    const seeded = Object.fromEntries(pairTable().map(({ id, evidence }) => [id, evidence]));
    expect(seeded["S1-NVDA"]).toMatchObject({
      status: "researched",
      qualifier: "weakened",
      verdictOn: "2026-10-05",
      shelfOn: "2027-03-31",
    });
    expect(seeded["G1-GOOG"]).toMatchObject({
      status: "researched",
      verdictOn: "2026-08-12",
      shelfOn: "2027-03-31",
    });
    expect(seeded["NVDA-CALL-SPREAD"]).toMatchObject({
      status: "researched",
      qualifier: "borrowed",
      shelfOn: "2027-03-31",
    });
    expect(seeded["CRWV-WHEEL"]).toMatchObject({ status: "conviction", checkOn: "2027-01-29" });
    expect(seeded["TACO-DJT"]?.status).toBe("cant-run");
    expect(seeded["HC-SAURON"]?.status).toBe("not-studied");
  });
});

describe("each strategy declares its screen", () => {
  it("gives every strategy a screen command or the reason it has none", () => {
    for (const strategy of Object.values(STRATEGIES)) {
      expect(Boolean(strategy.screen) !== Boolean(strategy.noScreen), strategy.id).toBe(true);
    }
  });

  it("points each screen at a script that exists", () => {
    for (const { id, screen } of Object.values(STRATEGIES)) {
      const script = screen?.split(" ")[1];
      if (script) {
        expect(existsSync(script), `${id}: ${script}`).toBe(true);
      }
    }
  });
});

describe("a status reads as a glyph plus a word (criterion 10)", () => {
  it("never lets the glyph stand alone", () => {
    for (const { glyph, word } of Object.values(EVIDENCE_STATUS)) {
      expect(glyph).not.toBe("");
      expect(word).toMatch(/[a-z]/);
    }
  });

  const labelOf = (id: string) => {
    const pair = findPair(id);
    return pair ? statusLabel(pair.evidence) : undefined;
  };

  it("adds the qualifier a ✓ carries", () => {
    expect(labelOf("S1-NVDA")).toBe("✓ researched, weakened");
    expect(labelOf("NVDA-CALL-SPREAD")).toBe("✓ researched, borrowed");
    expect(labelOf("G1-GOOG")).toBe("✓ researched");
    expect(labelOf("CRWV-WHEEL")).toBe("◆ conviction");
    expect(labelOf("TACO-DJT")).toBe("– can't run");
  });
});
