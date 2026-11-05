import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEEP_ROOTS,
  DIFF_CAP,
  DOCS_ONLY_ROOTS,
  parseNumstat,
  preMergePrompt,
  tierOf,
  // @ts-expect-error — plain .mjs helper, no types.
} from "../../scripts/review-replay/pre-merge.mjs";
// @ts-expect-error — plain .mjs helper, no types.
import { readRunAgents, tokensPerTier } from "../../scripts/review-replay/tokens.mjs";
// @ts-expect-error — plain .mjs helper, no types.
import { casesFor, scoreRun } from "../../scripts/review-replay.mjs";
import { type Reply, runWorkflow } from "../support/run-workflow";

// The pre-merge lens replays the reviewer the CI job will run (#6870, slice S1). No model runs here:
// these pin that it is told the change and none of the answer, that its tier is a rule, that a
// refuted finding counts for nothing, and that each tier's cost is read back, not guessed.
const defect = (id: string, pr: number, file: string) => ({
  id,
  pr,
  head: `h${pr}`,
  base: `b${pr}`,
  isControl: false,
  facet: "correctness",
  defect: { file, line: 7, summary: `the answer for ${id}` },
});
const control = (id: string, pr: number) => ({
  id,
  pr,
  head: `h${pr}`,
  base: `b${pr}`,
  isControl: true,
  cleanFor: ["correctness"],
  note: `the note for ${id}`,
});
const SET = {
  facets: {},
  cases: [defect("D1", 1, "src/a.ts"), defect("D2", 2, "src/b.ts"), control("K1", 3)],
};
const finding = (file: string, extra = {}) => ({
  severity: "important",
  category: "correctness",
  file,
  line: 3,
  summary: "s",
  failure_scenario: "f",
  ...extra,
});

describe("the pre-merge tier", () => {
  it("is deep on a money, state or deploy path, or any protected path, whatever its size", () => {
    expect(tierOf({ files: ["src/trading/x.ts"], lines: 2, protectedPath: false })).toBe("deep");
    expect(tierOf({ files: ["scripts/a.mjs"], lines: 2, protectedPath: true })).toBe("deep");
  });

  it("is light at 60 changed lines or fewer, standard above, and skips docs-only", () => {
    expect(tierOf({ files: ["scripts/a.mjs"], lines: 60, protectedPath: false })).toBe("light");
    expect(tierOf({ files: ["scripts/a.mjs"], lines: 61, protectedPath: false })).toBe("standard");
    expect(tierOf({ files: ["docs/a.md"], lines: 900, protectedPath: false })).toBe("skip");
    expect(tierOf({ files: ["docs/a.md", "app/src/x.ts"], lines: 9, protectedPath: false })).toBe(
      "light",
    );
  });

  it("counts lines from numstat, a binary file as none", () => {
    expect(parseNumstat("3\t4\tsrc/a.ts\n-\t-\tpic.png\n")).toEqual({
      files: ["src/a.ts", "pic.png"],
      lines: 7,
    });
  });

  // A copy, because a workflow cannot import: slice S2 makes it one module both read.
  it("routes on exactly the roots, and skips exactly the docs, the post-merge audit does", () => {
    const audit = readFileSync(".claude/workflows/post-merge-audit.js", "utf8");
    const block = /const DEEP_ROOTS = \[([\s\S]*?)\]/.exec(audit)?.[1] ?? "";
    expect([...block.matchAll(/'([^']+)'/g)].map((m) => m[1])).toEqual(DEEP_ROOTS);
    const docs = /const DOCS_ONLY = .*/.exec(audit)?.[0] ?? "";
    expect([...docs.matchAll(/startsWith\('([^']+)'\)/g)].map((m) => m[1])).toEqual(
      DOCS_ONLY_ROOTS,
    );
  });
});

describe("what the pre-merge reviewer is told", () => {
  const rules = "# Pre-merge review rules\n\n## Report\n\nWrong results.\n";
  const prompt = preMergePrompt({ base: "b1", head: "h1", diff: "+the change", stat: "", rules });

  it("puts the diff first and the rules after it, whole", () => {
    expect(prompt.indexOf("+the change")).toBeGreaterThan(-1);
    expect(prompt.indexOf("+the change")).toBeLessThan(prompt.indexOf("## Report"));
    expect(prompt).toContain(rules.trim());
  });

  it("swaps a diff too long to print for its stat, so the rules are never cut off", () => {
    const long = preMergePrompt({
      base: "b1",
      head: "h1",
      diff: "x".repeat(DIFF_CAP + 1),
      stat: " src/a.ts | 9 +++",
      rules,
    });
    expect(long).not.toContain("x".repeat(100));
    expect(long).toContain("src/a.ts | 9");
    expect(long).toContain("git diff b1 h1 -- <path>");
    expect(long).toContain(rules.trim());
  });

  it("closes the doors to the answer, the review folder included", () => {
    expect(prompt).toMatch(/never read GitHub/i);
    expect(prompt).toContain("docs/LESSONS.md");
    expect(prompt).toContain("anything under docs/review/");
    expect(prompt).not.toMatch(/the answer for|the note for|control/i);
  });

  it("asks for Important and Nit, capped at 5 and 3", () => {
    expect(prompt).toMatch(/`important` or `nit`/);
    expect(prompt).toContain("At most 5 important and 3 nit");
  });

  it("prices a refuter beside each reviewer", () => {
    expect(casesFor(SET, "pre-merge").price).toEqual({
      reviewers: 3,
      refuters: 3,
      lookups: 2,
      agents: 8,
      startTokens: 240_000,
    });
  });
});

describe("the pre-merge score", () => {
  const score = (results: unknown[]) => scoreRun(SET, { lens: "pre-merge", results });
  const row = (pr: number, findings: unknown[] = []) => ({ pr, findings });

  it("counts an Important finding on the defect's file that its refuter left standing", () => {
    const report = score([row(1, [finding("src/a.ts", { refuted: false })]), row(2), row(3)]);
    expect(report.recall.hit).toBe(1);
    expect(report.beforeRefuters).toEqual({ hit: 1, controlFlags: 0 });
  });

  it("counts a refuted finding for nothing, and lists the PR to read", () => {
    const report = score([
      row(1, [finding("src/a.ts", { refuted: true })]),
      row(2),
      row(3, [finding("src/k.ts", { refuted: true })]),
    ]);
    expect(report.recall.hit).toBe(0);
    expect(report.recall.refutedOnly).toEqual([1]);
    expect(report.controls.flagged).toEqual([]);
    expect(report.beforeRefuters).toEqual({ hit: 1, controlFlags: 1 });
  });

  it("never counts a Nit as a hit or against a control", () => {
    const nit = (file: string) => finding(file, { severity: "nit", refuted: false });
    const report = score([row(1, [nit("src/a.ts")]), row(2), row(3, [nit("src/k.ts")])]);
    expect(report.recall.hit).toBe(0);
    expect(report.recall.lowOnly).toEqual([1]);
    expect(report.controls.clean).toBe(1);
  });

  it("says UNKNOWN while any PR went unreviewed", () => {
    expect(score([row(1), row(3)]).bar.verdict).toBe("UNKNOWN");
    expect(score([row(1), row(2), row(3)]).bar).toMatchObject({ hits: 9, controlImportant: 2 });
  });

  // A dead refuter marks its findings refuted, which would read a flagged control as clean.
  it("says UNKNOWN while any finding went unjudged, and names the PR", () => {
    const unjudged = finding("src/k.ts", { refuted: true, judged: false });
    const report = score([row(1), row(2), { pr: 3, findings: [unjudged], refuterDied: true }]);
    expect(report.bar.verdict).toBe("UNKNOWN");
    expect(report.unjudged).toEqual([3]);
  });
});

describe("the pre-merge bar", () => {
  // Ten defect PRs, the last five with their defect in a file the PR never changed, and 3 controls.
  const defects = Array.from({ length: 10 }, (_, i) => defect(`D${i}`, i, `src/d${i}.ts`));
  const BIG = {
    facets: {},
    cases: [...defects, control("K1", 20), control("K2", 21), control("K3", 22)],
  };
  const changed = new Map(
    defects.map((d, i) => [d.pr, new Set(i < 5 ? [d.defect.file] : ["src/x.ts"])]),
  );
  const hitOn = (pr: number) => ({ pr, findings: [finding(`src/d${pr}.ts`, { refuted: false })] });
  const atCaller = (pr: number) => ({ pr, findings: [finding("src/x.ts", { refuted: false })] });
  const clean = (pr: number) => ({ pr, findings: [] });
  const flagged = (pr: number) => ({ pr, findings: [finding("src/k.ts", { refuted: false })] });
  const verdict = (results: unknown[]) =>
    scoreRun(BIG, { lens: "pre-merge", results, changed }).bar.verdict;
  const controls = (n: number) => [20, 21, 22].map((pr, i) => (i < n ? flagged(pr) : clean(pr)));

  it("passes on nine hits it could post, and fails on a third flagged control", () => {
    const nine = [0, 1, 2, 3, 4].map(hitOn).concat([5, 6, 7, 8].map(atCaller), [clean(9)]);
    // Five postable file matches are the floor; the four at-caller findings need reading.
    expect(verdict([...nine, ...controls(2)])).toBe("READ");
    const postable = { ...BIG, cases: BIG.cases };
    const all = new Map(defects.map((d) => [d.pr, new Set([d.defect.file])]));
    const ten = defects.map((d) => hitOn(d.pr));
    expect(
      scoreRun(postable, { lens: "pre-merge", results: [...ten, ...controls(2)], changed: all }).bar
        .verdict,
    ).toBe("PASS");
    expect(
      scoreRun(postable, { lens: "pre-merge", results: [...ten, ...controls(3)], changed: all }).bar
        .verdict,
    ).toBe("FAIL");
  });

  // A file match on a file the PR never changed is a finding the shipped job could not post.
  it("never passes on hits the job could not post, and fails when even reading cannot reach 9", () => {
    const report = scoreRun(BIG, {
      lens: "pre-merge",
      results: [...defects.map((d) => hitOn(d.pr)), ...controls(0)],
      changed,
    });
    expect(report.recall.hit).toBe(10);
    expect(report.recall.hitsInDiff).toBe(5);
    expect(report.bar.verdict).toBe("READ");
    const few = [0, 1, 2].map(hitOn).concat([3, 4, 5, 6, 7, 8, 9].map(clean));
    expect(verdict([...few, ...controls(0)])).toBe("FAIL");
  });
});

describe("tokens per tier", () => {
  const agents = [
    { label: "work-mode", total: 30_000, output: 100 },
    { label: "review #1 (deep)", total: 200_000, output: 5_000 },
    { label: "refute #1 (deep)", total: 100_000, output: 2_000 },
    { label: "review #2 (light)", total: 50_000, output: 1_000 },
  ];
  const results = [
    { pr: 1, tier: "deep" },
    { pr: 2, tier: "light" },
    { pr: 3, tier: "light" },
  ];

  it("sums each PR's reviewer and refuter, keeps lookups apart, and never counts a missing PR as free", () => {
    const report = tokensPerTier(agents, results);
    expect(report.perPr.find((r: { pr: number }) => r.pr === 1)).toMatchObject({
      review: 200_000,
      refute: 100_000,
      total: 300_000,
    });
    expect(report.tiers.light).toMatchObject({ prs: 1, median: 50_000, max: 50_000 });
    expect(report.unmeasured).toEqual([3]);
    expect(report.lookups).toBe(30_000);
    expect(report.total).toBe(380_000);
  });

  it("counts a skipped docs-only PR at zero, since the job spends nothing on it", () => {
    const report = tokensPerTier(agents, [...results, { pr: 4, tier: "skip" }]);
    expect(report.tiers.skip).toMatchObject({ prs: 1, median: 0 });
    expect(report.unmeasured).toEqual([3]);
  });

  it("reads each agent's usage from a run folder, once per message", () => {
    const dir = mkdtempSync(join(tmpdir(), "replay-tokens-"));
    try {
      const started = { type: "started", key: "k1", agentId: "a1", label: "review #2 (light)" };
      writeFileSync(join(dir, "journal.jsonl"), `${JSON.stringify(started)}\n`);
      const usage = {
        input_tokens: 10,
        cache_creation_input_tokens: 20,
        cache_read_input_tokens: 30,
        output_tokens: 40,
      };
      const line = { type: "assistant", message: { id: "m1", usage } };
      // A streamed reply writes one row per block, each carrying the same usage.
      writeFileSync(
        join(dir, "agent-a1.jsonl"),
        `${JSON.stringify(line)}\n${JSON.stringify(line)}\n`,
      );
      expect(readRunAgents(dir)).toEqual([
        { label: "review #2 (light)", total: 100, fresh: 70, output: 40, calls: 1 },
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("review-replay's workflow, pre-merge lens", () => {
  const GATE = { found: true, dispatch: true, position: "normal", grindWidth: 200 };
  const input = (pr: number, tier: string) => ({
    pr,
    base: `b${pr}`,
    head: `h${pr}`,
    caseIds: [`C${pr}`],
    tier,
    lines: 10,
  });
  const CASES = {
    found: true,
    inputs: [input(1, "deep"), input(2, "light"), input(3, "skip")],
    price: { reviewers: 3, refuters: 3, lookups: 2, agents: 8, startTokens: 240_000 },
  };
  const six = Array.from({ length: 6 }, (_, i) => finding("src/a.ts", { line: i }));
  const reply =
    (over: Record<string, unknown> = {}): Reply =>
    (_prompt, { label = "" }) => {
      if (label === "work-mode") return GATE;
      if (label === "cases") return CASES;
      if (label in over) return over[label];
      if (label.startsWith("review")) return { ran: true, findings: [] };
      return { verdicts: [] };
    };
  const run = (answer: Reply) => runWorkflow("review-replay", { lens: "pre-merge" }, answer);
  type Row = {
    pr: number;
    findings: { refuted: boolean; judged?: boolean }[];
    [key: string]: unknown;
  };
  const rowOf = (result: unknown, pr: number) =>
    (result as { results: Row[] } | null)?.results.find((row) => row.pr === pr);

  it("routes the model by tier, names PR and tier in each label, and skips docs-only", async () => {
    const { calls } = await run(reply());
    const reviews = calls.filter((c) => c.opts.label?.startsWith("review"));
    expect(reviews.map((c) => c.opts.label)).toEqual(["review #1 (deep)", "review #2 (light)"]);
    expect(reviews[0]?.opts).toMatchObject({ agentType: "worker", model: "fable" });
    expect(reviews[1]?.opts).toMatchObject({ agentType: "worker", model: "opus" });
    expect(reviews[0]?.prompt).toContain("prompt --lens pre-merge --head h1");
  });

  it("spends no refuter on a PR with no findings", async () => {
    const { calls, result } = await run(reply());
    expect(calls.some((c) => c.opts.label?.startsWith("refute"))).toBe(false);
    expect(result?.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pr: 3, skipped: true, returned: true, findings: [] }),
      ]),
    );
  });

  it("caps Important at 5, then sends one refuter all of the PR's findings at the head", async () => {
    const verdicts = {
      verdicts: [
        { id: 0, refuted: false, evidence: "a → b" },
        { id: 1, refuted: true, evidence: "guarded" },
      ],
    };
    const { calls, result } = await run(
      reply({
        "review #1 (deep)": { ran: true, findings: six },
        "refute #1 (deep)": verdicts,
      }),
    );
    const refutes = calls.filter((c) => c.opts.label?.startsWith("refute"));
    expect(refutes).toHaveLength(1);
    expect(refutes[0]?.prompt).toContain("git show h1:<path>");
    expect(refutes[0]?.prompt).not.toContain("origin/main");
    const pr1 = rowOf(result, 1);
    expect(pr1?.findings).toHaveLength(5);
    expect(pr1?.dropped).toBe(1);
    expect(pr1?.findings.map((f) => f.judged)).toEqual([true, true, false, false, false]);
    // A finding the refuter never judged is not one an author should answer.
    expect(pr1?.findings.map((f) => f.refuted)).toEqual([false, true, true, true, true]);
  });

  it("keeps at most 3 Nits beside the Important findings", async () => {
    const nits = Array.from({ length: 4 }, (_, i) =>
      finding("src/a.ts", { severity: "nit", line: i }),
    );
    const { result } = await run(
      reply({ "review #2 (light)": { ran: true, findings: [finding("src/b.ts"), ...nits] } }),
    );
    const pr2 = rowOf(result, 2);
    expect(pr2?.findings.map((f) => (f as { severity?: string }).severity)).toEqual([
      "important",
      "nit",
      "nit",
      "nit",
    ]);
    expect(pr2?.dropped).toBe(1);
  });

  it("hands the reviewer another rules file only when told, by a path it checks", async () => {
    const { calls } = await runWorkflow(
      "review-replay",
      { lens: "pre-merge", rulesFile: "docs/review/REVIEW.md" },
      reply(),
    );
    const review = calls.find((c) => c.opts.label === "review #1 (deep)");
    expect(review?.prompt).toContain("--lens-file docs/review/REVIEW.md");
    const bad = await runWorkflow(
      "review-replay",
      { lens: "pre-merge", rulesFile: "x; rm y" },
      reply(),
    );
    expect(bad.error?.message).toMatch(/rulesFile/);
    expect(bad.calls).toEqual([]);
  });

  it("marks every finding refuted and says so when the refuter dies", async () => {
    const { result, logs } = await run(
      reply({
        "review #2 (light)": { ran: true, findings: [finding("src/a.ts")] },
        "refute #2 (light)": null,
      }),
    );
    const pr2 = rowOf(result, 2);
    expect(pr2).toMatchObject({ refuterDied: true, returned: true });
    expect(pr2?.findings[0]).toMatchObject({ refuted: true, judged: false });
    expect(logs.join("\n")).toContain("re-run those");
  });

  it("returns a reviewer that could not read its task as not returned, never as clean", async () => {
    const { result } = await run(reply({ "review #1 (deep)": { ran: false, findings: six } }));
    expect(rowOf(result, 1)).toMatchObject({ pr: 1, returned: false, findings: [] });
  });
});
