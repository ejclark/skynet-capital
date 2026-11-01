import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import {
  answerPrompt,
  caseDigest,
  casesFor,
  judgePrompt,
  pageOf,
  runsFor,
  scoreReplay,
  setProblems,
  shapeProblems,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/intent-replay.mjs";
import { kase, SET } from "./intent-replay/fixtures";
// One spec with its parts beside it, split only for the 500-line cap: `fitness-audit --spec` runs one
// file, so a bug list graded on this entry has to reach all of them (each part goes in a --with).
import "./intent-replay/score.cases";
import "./intent-replay/cli.cases";
import "./intent-replay/workflow.cases";

// No model runs here. A score says whether a page about how Eric writes helps a session read him, so
// the runner has to hand each answerer the message and none of the answer, keep the judge from knowing
// which answer read the page, and count what came back without flattering either side. These pin all
// three on a fixture; what a real session does with the prompt is only known from a real run.
const IDS = SET.cases.map((row) => row.id);

describe("the set a public repo can hold", () => {
  const problemsOf = (over: Record<string, unknown>) =>
    setProblems({ ...SET, cases: [kase("C1", over)] });

  it("passes a clean case", () => {
    expect(setProblems(SET)).toEqual([]);
  });

  it("rejects an email, in any field", () => {
    expect(problemsOf({ evidence: "he wrote to someone@example.com" }).join()).toMatch(/email/);
    expect(problemsOf({ said: "mail x.y@host.co" }).join()).toMatch(/C1.*email/);
  });

  it("rejects a local path", () => {
    expect(problemsOf({ context: "open /Users/someone/x" }).join()).toMatch(/local path/);
    expect(problemsOf({ context: "under /private/tmp/abc" }).join()).toMatch(/local path/);
    expect(problemsOf({ mustDo: ["read ~/.claude/x"] }).join()).toMatch(/local path/);
  });

  it("rejects a position-shaped phrase, reusing the intents record's shapes", () => {
    for (const said of [
      "I am long 40 of them",
      "he bought more",
      "3 contracts at the open",
      "the 200C runs out in May",
      "sell the 950 strike",
      "up $1,200 today",
      "my primary position in the name",
    ]) {
      expect(problemsOf({ said }).join(), said).toMatch(/position|size|strike|dollar/);
    }
  });

  it("keeps his own first-person words and an app screen's name, which are not private", () => {
    const header = { wordsThatAreNotNames: ["My", "Account"] };
    const said = "My gut tells me to move the Account screen, and my accounts view with it";
    expect(setProblems({ header, cases: [kase("C1", { said })] })).toEqual([]);
  });

  it("rejects a capitalised word nobody has said is not a name, so a member's name fails closed", () => {
    const found = problemsOf({ said: "Priya wants the report" }).join();
    expect(found).toContain("Priya");
    expect(found).toMatch(/wordsThatAreNotNames/);
    expect(problemsOf({ context: "after talking with McKenzie" }).join()).toContain("McKenzie");
  });

  it("rejects a case with a field missing or an answer the schema cannot hold", () => {
    expect(problemsOf({ route: "vibes" }).join()).toMatch(/route/);
    expect(problemsOf({ ask: "maybe" }).join()).toMatch(/ask/);
    expect(problemsOf({ mustDo: [] }).join()).toMatch(/mustDo/);
    expect(problemsOf({ evidence: "" }).join()).toMatch(/evidence/);
    expect(setProblems({ ...SET, cases: [kase("C1"), kase("C1")] }).join()).toMatch(/twice/);
  });

  it("will not start a run on a set with a problem", () => {
    const bad = { ...SET, cases: [kase("C1", { said: "Priya" })] };
    expect(() => casesFor(bad)).toThrow(/Priya/);
  });

  it("will not write a prompt from a set with a problem, nor score one", () => {
    const bad = { ...SET, cases: [kase("C1", { said: "Priya" })] };
    const page = "### How he writes\nA GUIDE ROW\n";
    expect(() => answerPrompt(bad, { arm: "without", order: "forward", page })).toThrow(/Priya/);
    expect(() => answerPrompt(bad, { arm: "with", order: "backward", page })).toThrow(/Priya/);
    expect(() => judgePrompt(bad)).toThrow(/Priya/);
    // Results that really did run on this set, so the refusal can only be the safety rule's.
    const results = {
      caseIds: ["C1"],
      caseDigests: [caseDigest(bad.cases[0])],
      runs: runsFor(2).map((run: object) => ({ ...run, answers: [] })),
      verdicts: [],
    };
    expect(() => scoreReplay(bad, results)).toThrow(/Priya/);
  });

  // Written down here and in the script, and pinned so that closing it has to say so here. There is no
  // list of real names behind this rule, and there will not be: that list would be the leak.
  it("stays open: the name check reads capitals, so a name in all capitals or none passes it", () => {
    expect(problemsOf({ said: "Priya wants the report" }).join()).toContain("Priya");
    expect(problemsOf({ said: "PRIYA wants the report" })).toEqual([]);
    expect(problemsOf({ said: "priya wants the report" })).toEqual([]);
  });
});

describe("the runs", () => {
  it("runs each arm N times, the default being 2", () => {
    expect(runsFor(2).map((r: { name: string }) => r.name)).toEqual([
      "without-1",
      "without-2",
      "with-1",
      "with-2",
    ]);
    expect(casesFor(SET).runs).toHaveLength(4);
    expect(casesFor(SET, { n: 4 }).runs).toHaveLength(8);
  });

  it("has each arm read both orders, and the two arms opposite on every pass", () => {
    const orders = (arm: string, n = 2) =>
      runsFor(n)
        .filter((r: { arm: string }) => r.arm === arm)
        .map((r: { order: string }) => r.order);
    expect(orders("without")).toEqual(["forward", "backward"]);
    expect(orders("with")).toEqual(["backward", "forward"]);
    expect(orders("without", 4)).toEqual(["forward", "backward", "forward", "backward"]);
    expect(orders("with", 4)).toEqual(["backward", "forward", "backward", "forward"]);
  });

  it("refuses an N that would leave an arm reading one order more than the other", () => {
    // N=1 is the whole confound: each arm reads one direction, so order poses as the page.
    for (const n of [1, 3, 5]) {
      expect(() => casesFor(SET, { n }), String(n)).toThrow(/both orders/);
    }
    for (const n of [2, 4]) {
      const { runs } = casesFor(SET, { n });
      for (const arm of ["without", "with"]) {
        const ofArm = runs.filter((r: { arm: string }) => r.arm === arm);
        const forward = ofArm.filter((r: { order: string }) => r.order === "forward");
        expect(forward.length * 2, `${arm} at ${n}`).toBe(ofArm.length);
      }
    }
  });

  it("prices the run and refuses an N it cannot mean", () => {
    expect(casesFor(SET).price).toEqual({
      answerers: 4,
      judges: 1,
      lookups: 2,
      agents: 7,
      startTokens: 210_000,
    });
    expect(casesFor(SET, { n: 4 }).price).toEqual({
      answerers: 8,
      judges: 1,
      lookups: 2,
      agents: 11,
      startTokens: 330_000,
    });
    expect(casesFor(SET).ids).toEqual(IDS);
    for (const n of [0, -1, -2, 1.5, 6, Number.NaN]) {
      expect(() => casesFor(SET, { n }), String(n)).toThrow(/--n must be/);
    }
  });
});

describe("what an answerer is told", () => {
  const PAGE = "### How he writes\nA GUIDE ROW\n";
  const without = answerPrompt(SET, { arm: "without", order: "forward", page: PAGE });
  const withPage = answerPrompt(SET, { arm: "with", order: "forward", page: PAGE });

  it("holds each message and its context", () => {
    expect(without).toContain("the words of C2");
    expect(without).toContain("the context of C2");
  });

  it("carries none of the answer, in either arm", () => {
    for (const prompt of [without, withPage]) {
      expect(prompt).not.toMatch(/THE-MUST-DO|THE-MUST-NOT|THE-EVIDENCE/);
      expect(prompt).not.toMatch(/"route":|"confidence"/);
    }
  });

  it("differs between the arms only by the page", () => {
    expect(without).not.toContain("A GUIDE ROW");
    expect(withPage).toContain("A GUIDE ROW");
    const start = withPage.indexOf("A guide to how he writes");
    const end = withPage.indexOf("<<<end of guide>>>") + "<<<end of guide>>>\n\n".length;
    expect(start).toBeGreaterThan(-1);
    expect(withPage.slice(0, start) + withPage.slice(end)).toBe(without);
  });

  it("reverses the cases for the backward order", () => {
    const back = answerPrompt(SET, { arm: "without", order: "backward", page: PAGE });
    expect(without.indexOf("C1 ·")).toBeLessThan(without.indexOf("C3 ·"));
    expect(back.indexOf("C3 ·")).toBeLessThan(back.indexOf("C1 ·"));
  });

  it("closes the door to the answers, and keeps an answer from naming what it read", () => {
    expect(without).toMatch(/read no file/i);
    expect(without).toMatch(/judge/i);
  });

  it("refuses an arm or an order it does not know, and an empty page on the page arm", () => {
    expect(() => answerPrompt(SET, { arm: "maybe", order: "forward", page: PAGE })).toThrow(/arm/);
    expect(() => answerPrompt(SET, { arm: "with", order: "up", page: PAGE })).toThrow(/order/);
    expect(() => answerPrompt(SET, { arm: "with", order: "forward", page: "" })).toThrow(/page/);
  });

  it("refuses a page that is only blank lines or headings, which would leave the arms the same", () => {
    for (const page of ["  \n\n", "### How he writes\n\n### What breaks his flow\n"]) {
      expect(
        () => answerPrompt(SET, { arm: "with", order: "forward", page }),
        JSON.stringify(page),
      ).toThrow(/page/);
    }
  });
});

describe("the page a run hands over", () => {
  const READERS = [
    "## Eric — the primary reader",
    "",
    "### How he writes (reading his messages)",
    "",
    "**Replay, 2026-11-01:** the numbers from the last run.",
    "",
    "| He writes | It means |",
    "",
    "### What breaks his flow",
    "",
    "| Kind | Count |",
    "",
    "### How he reads (the physical facts)",
    "",
    "| Fact |",
  ].join("\n");

  it("takes the two sections and stops at the next one", () => {
    const page = pageOf(READERS);
    expect(page).toContain("| He writes | It means |");
    expect(page).toContain("| Kind | Count |");
    expect(page).not.toContain("| Fact |");
  });

  it("leaves out the replay's own result, which would tell an answerer what the test is", () => {
    expect(pageOf(READERS)).not.toMatch(/Replay, 2026-11-01|the numbers from the last run/);
  });

  it("says so when the sections are gone, never scoring an empty page", () => {
    expect(() => pageOf("## Eric — the primary reader\n")).toThrow(/How he writes/);
  });

  describe("a section that is only its heading, which would leave both arms the same prompt", () => {
    const HOW = "### How he writes (reading his messages)";
    const WHAT = "### What breaks his flow";
    const NEXT = "### How he reads (the physical facts)\n\n| Fact |";
    const REPLAY = "**Replay, 2026-11-01:** the numbers from the last run.";
    const rows: [string, string, RegExp][] = [
      ["both bare", [HOW, WHAT, NEXT].join("\n\n"), /How he writes.*What breaks his flow/],
      ["the first bare", [HOW, WHAT, "| Kind |", NEXT].join("\n\n"), /How he writes/],
      ["the second bare", [HOW, "| He writes |", WHAT, NEXT].join("\n\n"), /What breaks his flow/],
      ["the second gone", [HOW, "| He writes |", NEXT].join("\n\n"), /What breaks his flow/],
      ["the end of the file", [HOW, "| He writes |", WHAT].join("\n\n"), /What breaks his flow/],
      ["only the replay's result", [HOW, REPLAY, WHAT, "| Kind |"].join("\n\n"), /How he writes/],
      ["only sub-headings", [HOW, "#### A part", WHAT, "| Kind |"].join("\n\n"), /How he writes/],
    ];
    for (const [name, readers, names] of rows) {
      it(`throws on ${name}`, () => {
        expect(() => pageOf(readers)).toThrow(names);
      });
    }

    it("passes when both sections have something in them", () => {
      expect(pageOf([HOW, "| He writes |", WHAT, "| Kind |"].join("\n\n"))).toContain("| Kind |");
    });
  });
});

describe("what the judge is told", () => {
  const prompt = judgePrompt(SET);

  it("holds what each case must and must not do", () => {
    expect(prompt).toContain("THE-MUST-DO of C2");
    expect(prompt).toContain("THE-MUST-NOT of C3");
  });

  it("names no arm or run, and no route or evidence that would lead it", () => {
    expect(prompt).not.toMatch(/without|with-\d|arm|guide|THE-EVIDENCE|"route"/i);
  });
});

describe("the real set", () => {
  const set = JSON.parse(readFileSync("docs/evals/how-he-writes-set.json", "utf8"));

  it("is safe for a public repo and holds the cases the baseline ran on", () => {
    expect(setProblems(set)).toEqual([]);
    expect(set.cases.length).toBeGreaterThanOrEqual(29);
  });

  it("says how it was built, how a score could flatter the page, and the baseline", () => {
    expect(set.header.built.length).toBeGreaterThan(40);
    expect(set.header.howThisCouldFlatterThePage.length).toBeGreaterThanOrEqual(4);
    expect(set.header.baseline).toMatchObject({
      date: "2026-11-01",
      of: 58,
      without: { judged: 49 },
      with: { judged: 51 },
    });
  });

  it("hands over a page from docs/READERS.md that passes the same safety rule", () => {
    const page = pageOf(readFileSync("docs/READERS.md", "utf8"));
    expect(page).toContain("He writes");
    expect(page).toContain("What breaks his flow");
    expect(shapeProblems(page)).toEqual([]);
  });
});
