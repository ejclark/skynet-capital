import { existsSync } from "node:fs";
import {
  EVIDENCE_STATUS,
  findPair,
  isStale,
  type Pair,
  pairFor,
  pairName,
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
    expect(pairFor("persona-rules", "TSLA")?.id).toBe("SAURON");
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
    expect(seeded.SAURON?.status).toBe("not-studied");
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
    expect(labelOf("S1-NVDA")).toBe("△ researched, below the house bar");
    expect(labelOf("NVDA-CALL-SPREAD")).toBe("✓ researched, borrowed");
    expect(labelOf("G1-GOOG")).toBe("✓ researched");
    expect(labelOf("CRWV-WHEEL")).toBe("◆ conviction");
    expect(labelOf("TACO-DJT")).toBe("– can't run");
  });
});

describe("each strategy declares what it trades, and the registry agrees", () => {
  it("calls a pair options exactly when its playbook trades options", () => {
    for (const pair of pairTable()) {
      const options = Boolean(findPlaybook(pair.id)?.options);
      expect(STRATEGIES[pair.strategy].instrument === "options", pair.id).toBe(options);
    }
  });

  it("keys the run-up and the call spread on a print, and nothing else", () => {
    const dateKeyed = Object.values(STRATEGIES)
      .filter((strategy) => strategy.dateKeyed)
      .map((strategy) => strategy.id);
    expect(dateKeyed).toEqual(["pre-print-run-up", "call-spread"]);
  });
});

describe("a pair is named by what it does, never by its id (criterion 14)", () => {
  it("reads as the strategy on its ticker, and a basket as its strategy", () => {
    const nameOf = (id: string) => {
      const pair = findPair(id);
      return pair ? pairName(pair) : undefined;
    };
    expect(nameOf("CRWV-WHEEL")).toBe("the wheel on CRWV");
    expect(nameOf("S1-NVDA")).toBe("the pre-print run-up on NVDA");
    expect(nameOf("SAURON")).toBe("Sauron's own rules");
  });
});

describe("a ✓ verdict has a shelf life (criterion 4)", () => {
  const evidenceOf = (id: string) => {
    const pair = findPair(id);
    if (!pair) throw new Error(id);
    return pair.evidence;
  };

  it("is current through its shelf date and stale the market day after", () => {
    expect(isStale(evidenceOf("S1-NVDA"), "2027-03-31T20:00:00.000Z")).toBe(false);
    expect(isStale(evidenceOf("S1-NVDA"), "2027-04-01T14:00:00.000Z")).toBe(true);
  });

  it("never stales a conviction or a row with no verdict", () => {
    const later = "2030-01-01T14:00:00.000Z";
    expect(isStale(evidenceOf("CRWV-WHEEL"), later)).toBe(false);
    expect(isStale(evidenceOf("SAURON"), later)).toBe(false);
  });
});

/**
 * The plain line under each strategy's name (#5445, Eric's pick on #5163 round 13). WHEN a strategy
 * is listed on R&D → Playbooks, its name SHALL carry one line in plain words under it. Member copy
 * never says "print" or counts in "D-" days (#5163 round 2: "What does 'print' mean").
 */
describe("each strategy says what it does in one plain line", () => {
  it("keeps every line to 50 characters, with no 'print' and no D- count", () => {
    for (const strategy of Object.values(STRATEGIES)) {
      expect(strategy.line.length, strategy.id).toBeLessThanOrEqual(50);
      expect(strategy.line, strategy.id).not.toMatch(/print|\bD-/i);
      expect(strategy.act ?? "", strategy.id).not.toMatch(/print|\bD-/i);
    }
  });
});

/** The past-reports row (#5444, #5448) uses the numbers the run-up's picture draws, never a second
 *  source: NVDA's first stretch, 13 of 14, in plain words with no p-value and no "rose". */
describe("a pair's record reads in plain words", () => {
  it("holds NVDA's record to the first stretch its study measured", () => {
    const measured = findPlaybook("S1-NVDA")?.stretches;
    const past = findPair("S1-NVDA")?.evidence.past;
    expect(past?.up).toBe(measured?.stretches[0]?.rose);
    expect(past?.of).toBe(measured?.reports);
    expect(past?.era).toBe(measured?.era);
  });

  it("never says 'rose', 'print' or a p-value in a record", () => {
    for (const pair of pairTable()) {
      expect(pair.evidence.past?.line ?? "", pair.id).not.toMatch(/\brose\b|print|p=/i);
    }
  });
});
