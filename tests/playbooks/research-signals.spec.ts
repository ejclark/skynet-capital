import { existsSync } from "node:fs";
import { strategyCatalog } from "../../src/discovery/playbook-store-strategies.js";
import { findPair, STRATEGIES } from "../../src/playbooks/pair-table.js";
import { registeredPlaybooks } from "../../src/playbooks/registry.js";
import {
  declaredIds,
  instrumentScript,
  type PlaybookResearch,
  passSignalOf,
  researchLine,
  researchOf,
  researchProblems,
} from "../../src/playbooks/research-signals.js";

/**
 * #4808 slice 1, criterion 1: WHEN a playbook is registered, it SHALL declare its signals (each an
 * instrument and a threshold) OR declare "no research signal (unvalidated)", and its card SHALL say
 * which in words. A house playbook with neither SHALL fail `npm test` — this file is where it fails.
 */

const ids = registeredPlaybooks().map((p) => p.id);

describe("every registered playbook declares what it trades on, or that it has nothing", () => {
  it("has a declaration for every registered playbook, and none for an id nobody registered", () => {
    expect([...declaredIds()].sort()).toEqual([...ids].sort());
  });

  it.each(ids)("%s declares one research can run", (id) => {
    expect(researchProblems(researchOf(id))).toEqual([]);
  });

  it("points every signal at a research script that exists", () => {
    for (const id of ids) {
      const research = researchOf(id);
      if (research?.kind !== "signals") continue;
      for (const signal of research.signals) {
        expect(existsSync(instrumentScript(signal)), `${id}: ${signal.instrument}`).toBe(true);
      }
    }
  });

  it("keeps a playbook's first signal on its strategy's own screen, so one pair never names two studies", () => {
    for (const id of ids) {
      const research = researchOf(id);
      const pair = findPair(id);
      if (!pair) throw new Error(`${id} has no pair row`);
      const { screen } = STRATEGIES[pair.strategy];
      if (research?.kind === "signals") expect(research.signals[0].instrument, id).toBe(screen);
      else
        expect(
          screen,
          `${id} declares no signal, so its strategy offers no screen`,
        ).toBeUndefined();
    }
  });
});

describe("the retrofit table (call-sheet comment, 2026-10-07)", () => {
  const kindOf = (id: string) => researchOf(id)?.kind;

  it("has the run-up pairs, the call spread, the wheel and the dip-to-bounce pairs declare signals", () => {
    for (const id of [
      "S1-NVDA",
      "G1-GOOG",
      "NVDA-CALL-SPREAD",
      "CRWV-WHEEL",
      "MU-DIP-BOUNCE",
      "NBIS-DIP-BOUNCE",
    ]) {
      expect(kindOf(id), id).toBe("signals");
    }
  });

  it("has TACO, SAURON, the long call and the long LEAP say they are unvalidated, and the two scouts say by design", () => {
    const why = (id: string) => {
      const research = researchOf(id);
      return research?.kind === "none" ? research.why : undefined;
    };
    expect(["TACO-DJT", "SAURON", "CRWV-LONG-CALL", "NVDA-LONG-LEAP"].map(why)).toEqual([
      "unvalidated",
      "unvalidated",
      "unvalidated",
      "unvalidated",
    ]);
    expect(["BETA-SCOUT", "COND-SCOUT"].map(why)).toEqual(["by-design", "by-design"]);
  });

  it("names what the call spread's evidence cannot measure: its own profit and loss", () => {
    const research = researchOf("NVDA-CALL-SPREAD");
    expect(research?.kind === "signals" && research.unmeasured).toMatch(/profit and loss/);
  });

  it("re-runs a print-keyed signal after each report and the premium and dip screens weekly", () => {
    const cadence = (id: string) => {
      const research = researchOf(id);
      return research?.kind === "signals" ? research.signals[0].cadence : undefined;
    };
    expect(cadence("S1-NVDA")).toBe("after-each-print");
    expect(cadence("CRWV-WHEEL")).toBe("weekly");
    expect(cadence("MU-DIP-BOUNCE")).toBe("weekly");
  });
});

describe("researchProblems refuses a declaration research cannot run", () => {
  const signal = {
    measures: "the run-up",
    instrument: "node scripts/research/earnings-cycle.mjs <SYM>",
    threshold: "up in 10 of 14 reports",
    cadence: "after-each-print" as const,
  };
  const signals = (s: typeof signal): PlaybookResearch => ({ kind: "signals", signals: [s] });

  it("refuses a playbook that declares nothing at all", () => {
    expect(researchProblems(undefined)).toHaveLength(1);
  });

  it("refuses 'no signal' without a reason", () => {
    expect(researchProblems({ kind: "none", why: "unvalidated", reason: " " })).toHaveLength(1);
  });

  it("refuses a threshold with no number, or an 'e.g.' one", () => {
    expect(
      researchProblems(signals({ ...signal, threshold: "when it looks strong" })),
    ).toHaveLength(1);
    expect(researchProblems(signals({ ...signal, threshold: "above e.g. 2.0" }))).toHaveLength(1);
  });

  it("refuses an instrument that is not a research script run on <SYM>", () => {
    expect(researchProblems(signals({ ...signal, instrument: "ask a session" }))).toHaveLength(1);
    expect(
      researchProblems(
        signals({ ...signal, instrument: "node scripts/research/earnings-cycle.mjs NVDA" }),
      ),
    ).toHaveLength(1);
  });

  it("accepts a well-formed signal", () => {
    expect(researchProblems(signals(signal))).toEqual([]);
  });
});

describe("the card says which, in words", () => {
  const rows = strategyCatalog("2026-10-18T15:00:00.000Z").flatMap((card) => card.pairs);
  const line = (id: string) => rows.find((row) => row.id === id)?.researchSignal;

  it("gives every Store row its research line", () => {
    for (const row of rows) expect(row.researchSignal, row.id).toMatch(/research signal/i);
  });

  it("says a signal, its threshold and its cadence", () => {
    expect(line("CRWV-WHEEL")).toBe(
      "Research signal: Whether options price the next month above what the stock goes on to move. " +
        "It counts when the next month's implied volatility, from expiries clear of a report, sits at " +
        "or above the 60th percentile of the stock's 30-day moves over the past 252 sessions and more " +
        "than 5 points above their average; re-run weekly.",
    );
  });

  it("says no signal, unvalidated, and why", () => {
    expect(line("TACO-DJT")).toMatch(/^No research signal \(unvalidated\): its 15-minute entry/);
    expect(line("BETA-SCOUT")).toMatch(/^No research signal, by design: /);
  });

  it("never prints a p-value on a card", () => {
    for (const row of rows) expect(row.researchSignal, row.id).not.toMatch(/\bp\s*[=<≤]/i);
  });

  it("says what is not measured yet beside the signal", () => {
    expect(line("NVDA-CALL-SPREAD")).toMatch(/Not measured yet: the spread's own profit and loss/);
  });

  it("joins two signals into one line", () => {
    const two: PlaybookResearch = {
      kind: "signals",
      signals: [
        { measures: "a", instrument: "x", threshold: "1", cadence: "weekly" },
        { measures: "b", instrument: "y", threshold: "2", cadence: "after-each-print" },
      ],
    };
    expect(researchLine(two)).toBe(
      "Research signal: A. It counts when 1; re-run weekly. B. It counts when 2; re-run after each report.",
    );
  });
});

describe("which playbooks a check can say raised their signal (#4450 slice 5b)", () => {
  it("counts the run-up window only: the pass's long verdict is that signal holding", () => {
    const counted = ids.filter((id) => passSignalOf(id) === "counted").sort();
    expect(counted).toEqual(["G1-GOOG", "NVDA-CALL-SPREAD", "S1-NVDA"]);
  });

  it("calls a declared signal no pass computes unmeasured, and no declaration none", () => {
    expect(passSignalOf("CRWV-WHEEL")).toBe("unmeasured");
    expect(passSignalOf("MU-DIP-BOUNCE")).toBe("unmeasured");
    expect(passSignalOf("BETA-SCOUT")).toBe("none");
    expect(passSignalOf("TACO-DJT")).toBe("none");
    expect(passSignalOf("U-abc123")).toBe("none");
  });

  it("never counts a playbook whose verdict is not its own date window", () => {
    for (const id of ids.filter((i) => passSignalOf(i) === "counted")) {
      const playbook = registeredPlaybooks().find((p) => p.id === id);
      expect(playbook?.observeOnly, id).toBeUndefined();
      expect(playbook?.rulesOf, id).toBeUndefined();
    }
  });
});
