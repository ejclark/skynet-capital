import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import {
  answerPrompt,
  casesFor,
  judgePrompt,
  pageOf,
  runOfSlot,
  runsFor,
  scoreReplay,
  setProblems,
  shapeProblems,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/intent-replay.mjs";
import { type Reply, runWorkflow } from "../support/run-workflow";

// No model runs here. A score says whether a page about how Eric writes helps a session read him, so
// the runner has to hand each answerer the message and none of the answer, keep the judge from knowing
// which answer read the page, and count what came back without flattering either side. These pin all
// three on a fixture; what a real session does with the prompt is only known from a real run.
const kase = (id: string, over = {}) => ({
  id,
  date: "2026-10-01",
  said: `the words of ${id}`,
  context: `the context of ${id}`,
  route: "act-now",
  ask: "must-not-ask",
  mustDo: [`THE-MUST-DO of ${id}`],
  mustNotDo: [`THE-MUST-NOT of ${id}`],
  evidence: `THE-EVIDENCE of ${id}`,
  confidence: "high",
  ...over,
});
const SET = {
  header: { wordsThatAreNotNames: [] },
  cases: [kase("C1"), kase("C2", { route: "question" }), kase("C3")],
};
const IDS = ["C1", "C2", "C3"];

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
    expect(casesFor(SET, { n: 3 }).runs).toHaveLength(6);
  });

  it("has each arm read both orders, and the two arms opposite on every pass", () => {
    const orders = (arm: string) =>
      runsFor(2)
        .filter((r: { arm: string }) => r.arm === arm)
        .map((r: { order: string }) => r.order);
    expect(orders("without")).toEqual(["forward", "backward"]);
    expect(orders("with")).toEqual(["backward", "forward"]);
    const [without, withPage] = runsFor(1);
    expect(without.order).not.toBe(withPage.order);
  });

  it("prices the run and refuses an N it cannot mean", () => {
    expect(casesFor(SET).price).toEqual({
      answerers: 4,
      judges: 1,
      lookups: 2,
      agents: 7,
      startTokens: 210_000,
    });
    expect(casesFor(SET).ids).toEqual(IDS);
    for (const n of [0, -1, 1.5, 6]) expect(() => casesFor(SET, { n }), String(n)).toThrow(/n/);
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

describe("the score", () => {
  const runs = runsFor(2);
  const answer = (id: string, over = {}) => ({
    id,
    route: id === "C2" ? "question" : "act-now",
    ask: "must-not-ask",
    firstMove: "m",
    ...over,
  });
  const full = () => runs.map((r: object) => ({ ...r, answers: IDS.map((id) => answer(id)) }));
  // Every answer of every run passes unless `fails` names its run.
  const verdicts = (rows: { name: string }[], fails: (name: string, id: string) => boolean) =>
    IDS.flatMap((id, i) =>
      rows.map((_, slot) => ({
        id,
        slot,
        pass: !fails(rows[runOfSlot(i, slot, rows.length)]?.name ?? "", id),
        why: "w",
      })),
    );
  const result = (over = {}) => ({
    caseIds: IDS,
    runs: full(),
    verdicts: verdicts(runs, () => false),
    ...over,
  });

  it("adds route, ask and judged per arm, each out of cases times runs", () => {
    const { arms } = scoreReplay(SET, result());
    expect(arms.without).toEqual({
      route: 6,
      ask: 6,
      judged: 6,
      of: 6,
      answered: 6,
      unjudged: 0,
    });
    expect(arms.with.judged).toBe(6);
  });

  it("gives each verdict to the run its slot held for that case, not to the slot", () => {
    const failing = verdicts(runs, (name, id) => name === "with-2" && id !== "C1");
    const { arms, byRun } = scoreReplay(SET, result({ verdicts: failing }));
    expect(byRun["with-2"].judged).toBe(1);
    expect(byRun["with-1"].judged).toBe(3);
    expect(arms.with.judged).toBe(4);
    expect(arms.without.judged).toBe(6);
  });

  it("counts a wrong route or ask only against that answer", () => {
    const rows = full();
    rows[0].answers[1] = answer("C2", { route: "park", ask: "should-ask" });
    const { byRun } = scoreReplay(SET, result({ runs: rows }));
    expect(byRun["without-1"]).toMatchObject({ route: 2, ask: 2 });
    expect(byRun["without-2"]).toMatchObject({ route: 3, ask: 3 });
  });

  it("calls the page above only when every answer is judged and its arm scores higher", () => {
    expect(scoreReplay(SET, result()).verdict).toBe("page not above");
    const beaten = verdicts(runs, (name, id) => name === "without-1" && id === "C1");
    expect(scoreReplay(SET, result({ verdicts: beaten })).verdict).toBe("page above");
    const lost = verdicts(runs, (name, id) => name === "with-1" && id === "C1");
    expect(scoreReplay(SET, result({ verdicts: lost })).verdict).toBe("page not above");
  });

  it("reads a run that died as unknown, never as a low score", () => {
    const rows = full();
    rows[3].answers = null;
    const report = scoreReplay(SET, result({ runs: rows }));
    expect(report.verdict).toBe("unknown");
    expect(report.arms.with.answered).toBe(3);
    expect(report.arms.with.of).toBe(6);
  });

  it("reads a dead judge as unknown, and gives no credit for a pass on a missing answer", () => {
    const report = scoreReplay(SET, result({ verdicts: [] }));
    expect(report.verdict).toBe("unknown");
    expect(report.arms.without.unjudged).toBe(6);
    const rows = full();
    rows[0].answers = [];
    expect(scoreReplay(SET, result({ runs: rows })).byRun["without-1"].judged).toBe(0);
  });

  it("names the cases where the arms differ, so a number can be read back to a message", () => {
    const failing = verdicts(runs, (name, id) => name.startsWith("without") && id === "C3");
    expect(scoreReplay(SET, result({ verdicts: failing })).differs).toEqual([
      { id: "C3", without: 0, with: 2 },
    ]);
  });

  it("refuses a result from a different set, since a slot means nothing against other cases", () => {
    expect(() => scoreReplay(SET, result({ caseIds: ["C2", "C1", "C3"] }))).toThrow(/C2/);
    expect(() => scoreReplay(SET, result({ caseIds: ["C1"] }))).toThrow(/set/);
    expect(() => scoreReplay(SET, {})).toThrow(/runs/);
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

describe("the command line", () => {
  const dir = mkdtempSync(join(tmpdir(), "intent-replay-"));
  const setFile = join(dir, "set.json");
  writeFileSync(setFile, JSON.stringify(SET));
  const cli = (...args: string[]) =>
    spawnSync("node", ["scripts/intent-replay.mjs", ...args], { encoding: "utf8" });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("prints the cases as JSON a workflow can read back", () => {
    const run = cli("cases", "--n", "1", "--set", setFile);
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toMatchObject({ ids: IDS, price: { agents: 5 } });
  });

  it("prints an answerer's prompt and the judge's, from the real page", () => {
    const answer = cli("prompt", "--arm", "with", "--order", "backward", "--set", setFile);
    expect(answer.status).toBe(0);
    expect(answer.stdout).toContain("He writes");
    const judge = cli("prompt", "--judge", "--set", setFile);
    expect(judge.status).toBe(0);
    expect(judge.stdout).toContain("THE-MUST-DO of C1");
  });

  it("scores a workflow's return value read from a file", () => {
    const runs = runsFor(1).map((r: object) => ({
      ...r,
      answers: IDS.map((id) => ({ id, route: "act-now", ask: "may-ask", firstMove: "m" })),
    }));
    const results = join(dir, "results.json");
    writeFileSync(results, JSON.stringify({ caseIds: IDS, runs, verdicts: [] }));
    const run = cli("score", "--results", results, "--set", setFile, "--json");
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).verdict).toBe("unknown");
    const line = cli("score", "--results", results, "--set", setFile);
    expect(line.stdout).toContain("unknown");
    expect(line.stdout).toContain("of 3");
  });

  it("says unknown, with a non-zero exit, when it cannot read its inputs", () => {
    const missing = cli("score", "--results", join(dir, "absent.json"), "--set", setFile);
    expect(missing.status).toBe(2);
    expect(missing.stderr).toContain("UNKNOWN");
    const bad = join(dir, "bad.json");
    writeFileSync(bad, JSON.stringify({ header: {}, cases: [kase("C1", { said: "Priya" })] }));
    expect(cli("cases", "--set", bad).status).toBe(2);
  });
});

// The real script text under stubbed hooks. tests/scripts/workflow-gate.spec.ts pins its dial block
// with every other workflow; this pins what is its own: the two arms, the blinding and the return.
describe("intent-replay's workflow", () => {
  const GATE = { found: true, dispatch: true, position: "normal", grindWidth: 200 };
  const LOOKUP = {
    found: true,
    ids: IDS,
    runs: runsFor(2),
    price: { answerers: 4, judges: 1, lookups: 2, agents: 7, startTokens: 210_000 },
  };
  const armOf = (label = "") => label.replace("answer ", "");
  // Each answerer's first move names its own run, under a token no prompt could carry by accident.
  const answers = (label?: string) => ({
    ran: true,
    answers: IDS.map((id) => ({
      id,
      route: "act-now",
      ask: "must-not-ask",
      firstMove: `token-${armOf(label).replace("without-", "a").replace("with-", "b")}`,
    })),
  });
  // What each stage returns, by its label; a spec overrides one stage to kill or change it.
  const reply =
    (over: Record<string, unknown> = {}): Reply =>
    (_prompt, { label = "" }) => {
      const table: Record<string, unknown> = {
        "work-mode": GATE,
        cases: LOOKUP,
        "blind judge": { ran: true, verdicts: [] },
        ...over,
      };
      return label in table ? table[label] : answers(label);
    };
  const run = (args: unknown, answer: Reply) => runWorkflow("intent-replay", args, answer);

  it("runs both arms on worker stages, each told to run the prompt the script prints", async () => {
    const { calls } = await run({}, reply());
    const answerers = calls.filter((c) => c.opts.label?.startsWith("answer "));
    expect(answerers.map((c) => c.opts.label)).toEqual([
      "answer without-1",
      "answer without-2",
      "answer with-1",
      "answer with-2",
    ]);
    for (const c of answerers) {
      expect(c.opts.agentType).toBe("worker");
      expect(c.prompt).toContain("node scripts/intent-replay.mjs prompt --arm ");
    }
    expect(answerers[0]?.prompt).toContain("--arm without --order forward");
    expect(answerers[3]?.prompt).toContain("--arm with --order forward");
    expect(calls.at(-1)?.opts).toMatchObject({ label: "blind judge", agentType: "worker" });
  });

  it("passes N through to the lookup, and refuses one it cannot mean before spending", async () => {
    const { calls } = await run({ n: 1 }, reply());
    expect(calls.find((c) => c.opts.label === "cases")?.prompt).toContain("--n 1");
    for (const n of [0, 6, "2; rm -rf x", 1.5]) {
      const refused = await run({ n }, reply());
      expect(refused.error?.message, String(n)).toMatch(/args\.n/);
      expect(refused.calls).toEqual([]);
    }
  });

  it("shows the judge unlabelled answers, whose order turns with the case", async () => {
    const { calls } = await run({}, reply());
    const judge = calls.find((c) => c.opts.label === "blind judge");
    expect(judge?.prompt).not.toMatch(/without-\d|with-\d|"arm"|"run"|answer with/);
    const blinded = JSON.parse(String(judge?.prompt.split("<<<answers>>>")[1]));
    const seen = blinded.map((row: { answers: { firstMove: string }[] }) =>
      row.answers.map((a) => a.firstMove),
    );
    expect(seen[0]).toEqual(["token-a1", "token-a2", "token-b1", "token-b2"]);
    expect(seen[1]).toEqual(["token-a2", "token-b1", "token-b2", "token-a1"]);
    expect(seen[2]).toEqual(["token-b1", "token-b2", "token-a1", "token-a2"]);
  });

  it("round-trips: what the judge says of a slot lands on the run that wrote it", async () => {
    // A judge that passes only one run's words, without being told which run that is.
    const judge = (prompt: string) => {
      const blinded = JSON.parse(prompt.split("<<<answers>>>")[1] ?? "");
      return {
        ran: true,
        verdicts: blinded.flatMap((row: { id: string; answers: Record<string, string>[] }) =>
          row.answers.map((a) => ({
            id: row.id,
            slot: a.slot,
            pass: a.firstMove === "token-b1",
            why: "w",
          })),
        ),
      };
    };
    const { result } = await run({}, (prompt, opts) =>
      opts.label === "blind judge" ? judge(prompt) : reply()(prompt, opts),
    );
    const { byRun, arms } = scoreReplay(SET, result);
    expect(byRun["with-1"].judged).toBe(3);
    expect(byRun["with-2"].judged).toBe(0);
    expect(arms.without.judged).toBe(0);
  });

  it("returns an answerer that died or could not read its task as no answers", async () => {
    const dead = await run({}, reply({ "answer with-2": null }));
    const failed = await run(
      {},
      reply({ "answer with-2": { ran: false, answers: [{ id: "C1" }] } }),
    );
    for (const { result } of [dead, failed]) {
      const runs = (result?.runs ?? []) as unknown as { name: string; answers: unknown }[];
      expect(runs.find((r) => r.name === "with-2")?.answers).toBeNull();
      expect(scoreReplay(SET, result).verdict).toBe("unknown");
    }
  });

  it("returns a judge that died as no verdicts, which the score reads as unknown", async () => {
    const { result } = await run({}, reply({ "blind judge": null }));
    expect(result?.verdicts).toEqual([]);
    expect(scoreReplay(SET, result).verdict).toBe("unknown");
  });

  it("says nothing was run when the lookup dies, and stops when it reports a failure", async () => {
    const dead = await run({}, reply({ cases: null }));
    expect(dead.result).toMatchObject({ runs: [], notRun: expect.stringContaining("re-run") });
    const failed = await run({}, reply({ cases: { found: false, why: "a member's name" } }));
    expect(failed.error?.message).toContain("a member's name");
  });
});
