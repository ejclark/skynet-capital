import { existsSync, readFileSync } from "node:fs";
import { requiredClusters } from "../../scripts/research/backtest-verdict-math.mjs";
import { candidateCatalog } from "../../src/discovery/playbook-store-strategies.js";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.js";
import {
  type BacktestStatus,
  backtestWords,
  CANDIDATES,
  type CandidatePlaybook,
  candidateLine,
  candidateProblems,
} from "../../src/playbooks/candidates.js";
import { pairTable } from "../../src/playbooks/pair-table.js";
import { registeredPlaybooks } from "../../src/playbooks/registry.js";

/**
 * #4808 slice 3. EARS 3: WHILE a playbook is a candidate, it SHALL NOT place or suggest orders, and
 * its card SHALL show its back-test status in words. EARS 4: WHEN a candidate's back-test fails its
 * falsifier, the system SHALL mark it killed with the date and add it to the kill list.
 */

const [first] = CANDIDATES;
if (!first) throw new Error("no candidate declared");
const withStatus = (status: BacktestStatus): CandidatePlaybook => ({ ...first, status });

describe("a candidate cannot trade", () => {
  it("is in neither the registry nor the pair table, so no order path can reach it", () => {
    const tradable = new Set([
      ...registeredPlaybooks().map((p) => p.id),
      ...pairTable().map((p) => p.id),
    ]);
    for (const c of CANDIDATES) expect(tradable.has(c.id), c.id).toBe(false);
  });

  it("is not subscribable: the Store shows it as a candidate, outside every strategy card", () => {
    const view = playbookStoreView(undefined);
    expect(view.candidates.map((c) => c.id)).toEqual(CANDIDATES.map((c) => c.id));
    const rowIds = view.strategies.flatMap((s) => s.pairs.map((p) => p.id));
    expect(rowIds).not.toContain(first.id);
    expect(view.cards.map((c) => c.id)).not.toContain(first.id);
  });
});

describe("the card says the back-test status in words", () => {
  it("says it never places an order, and that the back-test is underpowered, not killed", () => {
    const [card] = candidateCatalog();
    expect(card?.line).toContain("never places or suggests an order");
    expect(card?.line).toContain("Back-test: underpowered on 2026-10-18");
    expect(card?.line).toContain("376 independent days of the 1298 needed");
    expect(card?.line).toContain("Not a kill");
    expect(card?.line).toContain("Dead if, by 2026-12-31,");
  });

  it("words all four states, and calls underpowered a wait, not a kill", () => {
    expect(backtestWords({ kind: "passed", on: "2027-01-05" })).toBe(
      "Back-test: passed on 2027-01-05.",
    );
    expect(
      backtestWords({ kind: "killed", on: "2027-01-05", because: "no cell beat its control" }),
    ).toBe("Back-test: killed on 2027-01-05 — no cell beat its control.");
    const waiting = backtestWords({
      kind: "underpowered",
      on: "2027-01-05",
      clusters: 80,
      needed: 122,
    });
    expect(waiting).toContain("80 independent days of the 122 needed");
    expect(waiting).toContain("Not a kill");
    expect(candidateLine(withStatus({ kind: "not-run" }))).toContain("Back-test: not run yet.");
  });
});

describe("a candidate declares its five research steps before its first run", () => {
  it.each(CANDIDATES.map((c) => [c.id, c] as const))(
    "%s is one research can back-test",
    (_id, c) => {
      expect(candidateProblems(c)).toEqual([]);
    },
  );

  it("points every instrument at a script that exists", () => {
    for (const c of CANDIDATES)
      for (const instrument of c.instruments)
        expect(existsSync(instrument.split(" ")[1] ?? ""), instrument).toBe(true);
  });

  it("names each step it lacks", () => {
    const bare: CandidatePlaybook = {
      ...first,
      instruments: [],
      steps: {
        threshold: "a big surge, e.g. 2x",
        power: { sdPct: 0, effectPct: 1, zBar: 3, zPower: 1 },
        control: " ",
        confoundFilter: "",
        grouping: "",
      },
    };
    const problems = candidateProblems(bare).join("\n");
    for (const step of ["step 1", "step 2", "step 3", "step 4", "step 5", "no instrument"])
      expect(problems, step).toContain(step);
  });

  it("derives the clusters candidate 1 needs from its declared power, not from a number typed twice", () => {
    expect(requiredClusters(first.steps.power)).toBe(122);
  });
});

describe("a killed candidate is recorded with its date, and on the kill list", () => {
  const killList =
    readFileSync("docs/research/multi-symbol-sweep.md", "utf8").split("## Kill list")[1] ?? "";

  it("refuses a kill with no reason, and an underpowered run that had the days it needed", () => {
    expect(
      candidateProblems(withStatus({ kind: "killed", on: "2027-01-05", because: " " })),
    ).not.toEqual([]);
    expect(
      candidateProblems(
        withStatus({ kind: "underpowered", on: "2027-01-05", clusters: 122, needed: 122 }),
      ),
    ).not.toEqual([]);
  });

  it.each(CANDIDATES.filter((c) => c.status.kind === "killed").map((c) => [c.id] as const))(
    "%s appears on the kill list",
    (id) => {
      expect(killList).toContain(id);
    },
  );
});
