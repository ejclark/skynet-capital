import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error — plain .mjs helper, no types.
import { casesFor, promptFor, scoreRun } from "../../scripts/review-replay.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// No model runs here. The runner's job is to hand a reviewer the change and none of the answer, then
// count what came back honestly. These specs pin both halves on a fixture; what a real reviewer does
// with the prompt is only known from a real run.
const defect = (id: string, pr: number, facet: string, file: string, extra = {}) => ({
  id,
  pr,
  head: `h${pr}`,
  base: `b${pr}`,
  mergedOn: "2026-10-01",
  isControl: false,
  facet,
  defect: { file, line: 7, summary: `the answer for ${id}` },
  ...extra,
});
const control = (id: string, pr: number, cleanFor: string[], extra = {}) => ({
  id,
  pr,
  head: `h${pr}`,
  base: `b${pr}`,
  mergedOn: "2026-10-01",
  isControl: true,
  cleanFor,
  note: `the note for ${id}`,
  ...extra,
});
const SET = {
  facets: {},
  cases: [
    defect("P1", 1, "performance", "src/a.ts"),
    defect("P2", 2, "performance", "src/b.ts"),
    defect("P3", 3, "performance", "src/c.ts"),
    defect("P4", 3, "performance", "src/d.ts"),
    defect("S1", 4, "security", "src/s.ts"),
    defect("D1", 5, "correctness", "src/x.ts", { alsoFor: ["smells-and-patterns"] }),
    control("K1", 6, ["performance", "security"]),
    control("K2", 7, ["performance"]),
    control("K3", 8, ["security"], { trapFor: "performance" }),
  ],
};

const finding = (file: string, severity = "high", extra = {}) => ({
  severity,
  file,
  summary: "s",
  failure_scenario: "f",
  ...extra,
});

describe("which cases a lens runs on", () => {
  it("takes its own facet and its controls, one reviewer per PR, with a trap as a control", () => {
    const { facet, inputs } = casesFor(SET, "performance");
    expect(facet).toBe("performance");
    expect(inputs.map((i: { pr: number }) => i.pr)).toEqual([1, 2, 3, 6, 7, 8]);
    expect(inputs.find((i: { pr: number }) => i.pr === 3).caseIds).toEqual(["P3", "P4"]);
  });

  it("includes a case another facet lends it", () => {
    const { inputs } = casesFor(SET, "smells-and-patterns");
    expect(inputs.map((i: { caseIds: string[] }) => i.caseIds)).toEqual([["D1"]]);
  });

  it("narrows to named ids and refuses one it does not know", () => {
    expect(casesFor(SET, "performance", { ids: ["P1", "K1"] }).inputs).toHaveLength(2);
    expect(() => casesFor(SET, "performance", { ids: ["P1", "NOPE"] })).toThrow(/NOPE/);
    expect(() => casesFor(SET, "performance", { ids: ["S1"] })).toThrow(/S1/);
  });

  it("refuses a lens with no facet rather than guessing one", () => {
    expect(() => casesFor(SET, "vibes")).toThrow(/vibes/);
  });

  it("refuses more than 40 at once and never truncates", () => {
    const wide = {
      facets: {},
      cases: Array.from({ length: 41 }, (_, i) => defect(`P${i}`, i, "performance", "src/a.ts")),
    };
    expect(() => casesFor(wide, "performance")).toThrow(/41.*40/);
  });

  it("prices the run: one reviewer per PR plus the two lookups, at a 30k start", () => {
    const { price } = casesFor(SET, "performance");
    expect(price).toEqual({ reviewers: 6, lookups: 2, agents: 8, startTokens: 240_000 });
  });
});

describe("what a reviewer is told", () => {
  const LENS = [
    "# Lens",
    "",
    "**Whole read.** Spot it: a read. Fix: a fold. Not when: bounded. Real: #2355 read the history.",
    "",
    "**One ask.** Spot it: a loop. Fix: batch. Not when: paged. Real: `src/a.ts:9` asks per row",
    "and goes on a second line.",
    "",
    "## How to run it",
    "",
    "Read the budget table (#6232 at 262 ms).",
    "",
  ].join("\n");
  const prompt = promptFor(SET, "performance", "h3", LENS);

  it("names the shas and holds the lens's smells", () => {
    expect(prompt).toContain("h3");
    expect(prompt).toContain("b3");
    expect(prompt).toContain("**Whole read.**");
    expect(prompt).toContain("How to run it");
  });

  it("carries none of the answer, and no sign of a defect or a control", () => {
    expect(prompt).not.toMatch(/the answer for|the note for|src\/c\.ts|src\/d\.ts|control/i);
    const clean = promptFor(SET, "performance", "h6", LENS);
    expect(clean.replaceAll("h6", "h3").replaceAll("b6", "b3")).toBe(prompt);
  });

  // The lens's examples are drawn from this very set, so a lens read whole hands over the answer.
  it("strips the lens's real examples, which are drawn from these same cases", () => {
    expect(prompt).not.toContain("#2355");
    expect(prompt).not.toContain("src/a.ts:9");
    expect(prompt).not.toContain("second line");
    expect(prompt).not.toContain("Real:");
    expect(prompt).not.toContain("#6232");
  });

  it("closes the doors that lead to the answer, and says zero findings is normal", () => {
    expect(prompt).toContain("docs/LESSONS.md");
    expect(prompt).toMatch(/never.*GitHub/i);
    expect(prompt).toMatch(/zero findings is a normal answer/i);
    expect(prompt).toMatch(/concrete failure or cost/i);
  });

  it("refuses a PR the lens does not run on", () => {
    expect(() => promptFor(SET, "performance", "h4", LENS)).toThrow(/h4/);
  });
});

describe("the score", () => {
  const score = (results: unknown[]) => scoreRun(SET, { lens: "performance", results });
  const none = (pr: number) => ({ pr, findings: [] });
  const all = [none(1), none(2), none(3), none(6), none(7), none(8)];
  const withRow = (row: { pr: number; findings?: unknown[]; returned?: boolean }) =>
    all.map((r) => (r.pr === row.pr ? row : r));

  it("counts a high or medium finding on the defect's file as a hit", () => {
    const { recall } = score(withRow({ pr: 1, findings: [finding("src/a.ts", "medium")] }));
    expect(recall).toMatchObject({ prs: 3, reviewed: 3, hit: 1 });
    expect(recall.hits[0]).toMatchObject({ pr: 1, caseIds: ["P1"] });
  });

  it("does not count a finding on another file, or a low one", () => {
    expect(score(withRow({ pr: 1, findings: [finding("src/z.ts")] })).recall.hit).toBe(0);
    const low = score(withRow({ pr: 1, findings: [finding("src/a.ts", "low")] })).recall;
    expect(low.hit).toBe(0);
    expect(low.lowOnly).toEqual([1]);
  });

  it("counts a PR with two defects once", () => {
    const row = { pr: 3, findings: [finding("src/c.ts"), finding("src/d.ts")] };
    expect(score(withRow(row)).recall.hit).toBe(1);
    expect(score(withRow(row)).recall.prs).toBe(3);
  });

  it("drops a hit a reader marked as the wrong mechanism", () => {
    const row = { pr: 1, findings: [finding("src/a.ts", "high", { mechanism: false })] };
    expect(score(withRow(row)).recall.hit).toBe(0);
  });

  it("reads a reviewer that never returned as unknown, not as a miss or a clean control", () => {
    const { recall, controls } = score(
      all
        .filter((r) => r.pr !== 2)
        .map((r) => (r.pr === 7 ? { pr: 7, returned: false, findings: [] } : r)),
    );
    expect(recall.unknown).toEqual([2]);
    expect(recall.reviewed).toBe(2);
    expect(recall.missed).toEqual([1, 3]);
    expect(controls.unknown).toEqual([7]);
    expect(controls.clean).toBe(2);
  });

  it("counts a high or medium finding on a control against the lens, and not a low one", () => {
    const { controls } = score(
      withRow({ pr: 6, findings: [finding("src/k.ts"), finding("src/k.ts", "low")] }),
    );
    expect(controls.flagged).toHaveLength(1);
    expect(controls.flagged[0]).toMatchObject({ id: "K1", severity: "high" });
    expect(controls.clean).toBe(2);
  });

  it("sets a finding on a trap aside to be read, never counted either way", () => {
    const { controls } = score(withRow({ pr: 8, findings: [finding("src/k.ts")] }));
    expect(controls.flagged).toEqual([]);
    expect(controls.traps).toHaveLength(1);
    expect(controls.traps[0]).toMatchObject({ id: "K3" });
  });
});

describe("the labelled set", () => {
  const set = JSON.parse(readFileSync("docs/review/replay-set.json", "utf8"));

  it("gives every case a base and a head that look like full shas", () => {
    for (const row of set.cases) {
      expect(row.head, row.id).toMatch(/^[0-9a-f]{40}$/);
      expect(row.base, row.id).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("gives every lens something to run on, and says how it could flatter one", () => {
    for (const lens of [
      "adversarial",
      "performance",
      "security",
      "context-loop",
      "reuse-composability",
      "smells-and-patterns",
    ]) {
      expect(casesFor(set, lens).inputs.length, lens).toBeGreaterThan(0);
    }
    expect(set.howThisCouldFlatterALens.length).toBeGreaterThanOrEqual(9);
  });
});

describe("the command line", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-replay-"));
  const setFile = join(dir, "set.json");
  writeFileSync(setFile, JSON.stringify(SET));
  const cli = (...args: string[]) =>
    spawnSync("node", ["scripts/review-replay.mjs", ...args], {
      encoding: "utf8",
      env: hermeticGitEnv(),
    });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("prints the cases as JSON a workflow can read back", () => {
    const run = cli("cases", "--lens", "performance", "--set", setFile);
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).inputs).toHaveLength(6);
  });

  it("prints one prompt, and says unknown when the lens file is not there", () => {
    const lens = join(dir, "lens.md");
    writeFileSync(lens, "# Lens\n");
    const absent = join(dir, "absent.md");
    expect(
      cli(
        "prompt",
        "--lens",
        "performance",
        "--head",
        "h1",
        "--set",
        setFile,
        "--lens-file",
        absent,
      ).status,
    ).toBe(2);
    const run = cli(
      "prompt",
      "--lens",
      "performance",
      "--head",
      "h1",
      "--set",
      setFile,
      "--lens-file",
      lens,
    );
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("h1");
  });

  it("scores a workflow's return value read from a file", () => {
    const results = join(dir, "results.json");
    writeFileSync(
      results,
      JSON.stringify({
        lens: "performance",
        results: [{ pr: 1, findings: [finding("src/a.ts")] }],
      }),
    );
    const run = cli("score", "--results", results, "--set", setFile, "--json");
    expect(run.status).toBe(0);
    const report = JSON.parse(run.stdout);
    expect(report.facets.performance.recall.hit).toBe(1);
    expect(report.facets.performance.recall.unknown).toEqual([2, 3]);
  });

  it("refuses a results file it cannot read", () => {
    expect(cli("score", "--results", join(dir, "absent.json"), "--set", setFile).status).toBe(2);
  });

  it("fails a set whose head does not resolve, the fault the first draft of this one had", () => {
    const broken = join(dir, "broken.json");
    writeFileSync(broken, JSON.stringify({ cases: [defect("X1", 1, "performance", "src/a.ts")] }));
    const run = cli("check", "--set", broken);
    if (run.status === 2) expect(run.stderr).toContain("shallow");
    else {
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("X1");
    }
  });

  it("checks every sha in the real set resolves and fits its PR, or says it cannot tell", () => {
    const run = cli("check");
    if (run.status === 2) expect(run.stderr).toContain("shallow");
    else expect(run.stdout + run.stderr).toContain("60 of 60");
    expect(run.status === 0 || run.status === 2).toBe(true);
  });
});

// The stub-harness pattern from tests/scripts/workflow-scratch.spec.ts: the real script text, with
// the Workflow tool's hooks as stubs. It pins what each agent is told and what the run returns.
describe("review-replay's workflow", () => {
  type Opts = { label?: string; agentType?: string; model?: string };
  type Reply = (prompt: string, opts: Opts) => unknown;
  const AsyncFunction = (async () => undefined).constructor as new (
    ...params: string[]
  ) => (...values: unknown[]) => Promise<unknown>;

  async function run(args: unknown, reply: Reply) {
    const source = readFileSync(".claude/workflows/review-replay.js", "utf8").replace(
      "export const meta",
      "const meta",
    );
    const script = new AsyncFunction(
      "args",
      "agent",
      "pipeline",
      "parallel",
      "log",
      "phase",
      source,
    );
    const calls: { prompt: string; opts: Opts }[] = [];
    const agent = (prompt: string, opts: Opts = {}) => {
      calls.push({ prompt, opts });
      return Promise.resolve().then(() => reply(prompt, opts));
    };
    const parallel = (thunks: (() => unknown)[]) =>
      Promise.all(
        thunks.map((thunk) =>
          Promise.resolve()
            .then(thunk)
            .catch(() => null),
        ),
      );
    const noop = () => undefined;
    const result = (await script(args, agent, noop, parallel, noop, noop)) as Record<string, never>;
    return { result, calls };
  }

  const GATE = { found: true, dispatch: true, position: "normal", grindWidth: 200 };
  const input = (pr: number) => ({
    pr,
    base: `b${pr}`,
    head: `h${pr}`,
    caseIds: [`C${pr}`],
  });
  const CASES = {
    found: true,
    inputs: [input(1), input(2)],
    price: { reviewers: 2, lookups: 2, agents: 4, startTokens: 120_000 },
  };
  const reply =
    (over: Partial<Record<string, unknown>> = {}): Reply =>
    (_prompt, { label }) => {
      if (label === "work-mode") return "gate" in over ? over.gate : GATE;
      if (label === "cases") return "cases" in over ? over.cases : CASES;
      if (label === "review #2" && "dead" in over) return null;
      return { findings: [] };
    };

  it("sends one worker per PR, each told to run the prompt the script prints", async () => {
    const { calls, result } = await run({ lens: "performance" }, reply());
    const reviews = calls.filter((c) => c.opts.label?.startsWith("review"));
    expect(reviews).toHaveLength(2);
    for (const c of reviews) {
      expect(c.opts.agentType).toBe("worker");
      expect(c.opts.model).toBe("opus");
      expect(c.prompt).toContain(
        "node scripts/review-replay.mjs prompt --lens performance --head h",
      );
      expect(c.prompt).not.toMatch(/#\d|--pr|C\d/);
    }
    expect(result.lens).toBe("performance");
    expect((result.results as unknown as unknown[]).length).toBe(2);
    expect(result.price).toEqual(CASES.price);
  });

  it("asks the work spigot before it spends anything else", async () => {
    const { calls } = await run({ lens: "performance" }, reply());
    expect(calls[0]?.opts.label).toBe("work-mode");
    expect(calls[0]?.prompt).toContain("node scripts/moneypenny/work-gate.mjs");
  });

  it("stops at a refusal from the spigot, and at a spigot it cannot read", async () => {
    const refused = { ...GATE, dispatch: false, reason: "halted" };
    await expect(run({ lens: "performance" }, reply({ gate: refused }))).rejects.toThrow(/halted/);
    await expect(run({ lens: "performance" }, reply({ gate: { found: false } }))).rejects.toThrow(
      /spigot/,
    );
  });

  it("refuses more than 40 cases at once, before it spends an agent", async () => {
    const ids = Array.from({ length: 41 }, (_, i) => `C${i}`);
    const stub = await run({ lens: "performance", ids }, reply()).catch((error: Error) => error);
    expect(String(stub)).toMatch(/41.*40/);
  });

  it("refuses a run the set makes too wide, and one wider than the spigot allows", async () => {
    const wide = { ...CASES, inputs: Array.from({ length: 41 }, (_, i) => input(i)) };
    await expect(run({ lens: "performance" }, reply({ cases: wide }))).rejects.toThrow(/41.*40/);
    const narrow = { ...GATE, position: "conserve", grindWidth: 1 };
    await expect(run({ lens: "performance" }, reply({ gate: narrow }))).rejects.toThrow(/conserve/);
  });

  it("requires a lens, and refuses one that could not be a file name", async () => {
    await expect(run({}, reply())).rejects.toThrow(/lens/);
    await expect(run({ lens: "x; rm -rf y" }, reply())).rejects.toThrow(/lens/);
    await expect(run({ lens: "performance", ids: ["P1; x"] }, reply())).rejects.toThrow(/id/);
  });

  it("returns a reviewer that died as not returned, so the score reads it as unknown", async () => {
    const { result } = await run({ lens: "performance" }, reply({ dead: true }));
    expect(result.results).toEqual([
      { pr: 1, head: "h1", caseIds: ["C1"], returned: true, findings: [] },
      { pr: 2, head: "h2", caseIds: ["C2"], returned: false, findings: [] },
    ]);
  });
});
