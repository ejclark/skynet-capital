import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  collectFindings,
  findingId,
  fromAnalyst,
  fromExpert,
  fromInstruments,
  fromWords,
  severityOf,
  stripClasses,
} from "../../scripts/study/round-findings.mjs";
import {
  batchCensus,
  batchFrames,
  capFrames,
  keyFrames,
} from "../../scripts/study/round-frames.mjs";
import { expertBatchText, taskAuthorText } from "../../scripts/study/round-messages.mjs";
import {
  type AreaConfig,
  BLIND_ROLES,
  canaryQuestion,
  canaryVerdict,
  censusPlan,
  lintFeedback,
  mergeFacts,
  planSessions,
  primingCounts,
  profileProblems,
  resolveTasks,
  roundArgs,
  runsFor,
  selectMatrix,
  taskUnits,
} from "../../scripts/study/round-plan.mjs";
import { schemaProblems } from "../../scripts/study/schema-check.mjs";

// One study round's pure decisions (scripts/study/round.mjs and its step files act on them): the
// session matrix, the censuses, the analyst's key frames, the experts' batches, what the lint may
// say back to the task author, and the shape every finding is collected into.

const ROOT = join(import.meta.dirname, "../..");
const profile = JSON.parse(
  readFileSync(join(ROOT, "scripts/study/tasks/profile.json"), "utf8"),
) as AreaConfig;
const DEFAULTS = { defaultStub: "/stub", defaultProfile: "/p.json" };

describe("roundArgs", () => {
  it("needs a pin, an out dir and the sealed key", () => {
    expect(() => roundArgs(["--pin", "/p", "--out", "/o"], DEFAULTS)).toThrow(/--sealed/);
  });

  it("makes --dry-run answer from the default stub, and --stub imply a dry run", () => {
    const base = ["--pin", "/p", "--out", "/o", "--sealed", "/s"];
    expect(roundArgs([...base, "--dry-run"], DEFAULTS)).toMatchObject({
      dryRun: true,
      stub: "/stub",
      profile: "/p.json",
    });
    expect(roundArgs([...base, "--stub", "/x"], DEFAULTS)).toMatchObject({
      dryRun: true,
      stub: "/x",
    });
    expect(roundArgs(base, DEFAULTS)).toMatchObject({ dryRun: false, thin: false });
    expect(roundArgs(base, DEFAULTS).stub).toBeUndefined();
  });

  it("takes the narrowing flags as positive integers", () => {
    const base = ["--pin", "/p", "--out", "/o", "--sealed", "/s"];
    expect(roundArgs([...base, "--concurrency", "2", "--cap", "40"], DEFAULTS)).toMatchObject({
      concurrency: 2,
      cap: 40,
    });
    expect(() => roundArgs([...base, "--cap", "0"], DEFAULTS)).toThrow(/positive/);
    expect(() => roundArgs([...base, "--bogus"], DEFAULTS)).toThrow(/unknown/);
  });
});

describe("the profile area config", () => {
  it("passes its own checks", () => {
    expect(profileProblems(profile)).toEqual([]);
  });

  it("refuses a thin cut that names no matrix row, and a bad viewport", () => {
    const bad = { ...profile, thin: { ...profile.thin, member: "nobody" } };
    expect(profileProblems(bad)).toContain("thin must name a member and world from the matrix");
    const vp = { ...profile, matrix: [{ ...profile.matrix[0], viewports: ["tablet"] }] };
    expect(profileProblems(vp).join(" ")).toMatch(/phone and\/or desktop only/);
  });
});

describe("planning the session matrix", () => {
  const ids = (unit: { key: string }) => [1, 2, 3].map((n) => `${unit.key}--t${n}`);
  const byUnit = (matrix: ReturnType<typeof selectMatrix>) =>
    Object.fromEntries(taskUnits(matrix).map((u) => [u.key, ids(u)]));

  it("runs every member × world × viewport × task × run, fewer runs where the world says so", () => {
    const matrix = selectMatrix(profile);
    const plan = planSessions({ p: profile, matrix, tasksByUnit: byUnit(matrix) });
    const expected = matrix.reduce(
      (n, r) => n + r.viewports.length * profile.tasksPer * runsFor(profile, r.world),
      0,
    );
    expect(plan).toHaveLength(expected);
    expect(expected).toBeGreaterThan(80);
    expect(runsFor(profile, "profile-bad-day")).toBe(2);
    expect(runsFor(profile, "profile-today")).toBe(3);
  });

  it("gives every session a directory no other session shares", () => {
    const matrix = selectMatrix(profile);
    const plan = planSessions({ p: profile, matrix, tasksByUnit: byUnit(matrix) });
    expect(new Set(plan.map((s) => s.dir)).size).toBe(plan.length);
  });

  it("thin: one member, one task, one viewport, one run", () => {
    const matrix = selectMatrix(profile, { thin: true });
    const plan = planSessions({ p: profile, matrix, tasksByUnit: byUnit(matrix), thin: true });
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      member: profile.thin.member,
      world: profile.thin.world,
      viewport: profile.thin.viewport,
      run: 1,
    });
    expect(plan[0]?.task?.endsWith(`--t${profile.thin.task}`)).toBe(true);
  });

  it("narrows to one world when asked, and writes tasks once per member × world", () => {
    const matrix = selectMatrix(profile, { onlyWorld: "profile-today" });
    expect(new Set(matrix.map((r) => r.world))).toEqual(new Set(["profile-today"]));
    const units = taskUnits(selectMatrix(profile));
    expect(new Set(units.map((u) => u.key)).size).toBe(units.length);
  });

  it("thin takes one census of one route at one width", () => {
    const [c, ...rest] = censusPlan(profile, { thin: true });
    expect(rest).toEqual([]);
    expect(c?.routes).toEqual([profile.thin.expertRoute]);
    expect(c?.viewports).toEqual([profile.thin.viewport]);
    expect(c?.for).toContain("experts");
  });
});

describe("what the task author hears back", () => {
  it("keeps ONLY the lint's rewrite lines", () => {
    const out = [
      "rewrite eric--today.json item 2 (sealed-word)",
      "rewrite eric--today.json item 3 (interface-label)",
      "lint: 2 problem(s) — packets refused",
      "something else that must never reach the author",
    ].join("\n");
    expect(lintFeedback(out)).toEqual([
      "rewrite eric--today.json item 2 (sealed-word)",
      "rewrite eric--today.json item 3 (interface-label)",
    ]);
    expect(lintFeedback("lint: clean")).toEqual([]);
  });

  it("puts the previous tasks and only those lines in a rewrite", () => {
    const text = taskAuthorText({
      card: "# card",
      jobMap: { j: 1 },
      facts: [{ id: "a.b", label: "a thing", display: "$1" }],
      tasksPer: 3,
      previous: [{ scenario: "x" }],
      feedback: ["rewrite f.json item 1 (overlap)"],
    });
    expect(text).toContain("rewrite f.json item 1 (overlap)");
    expect(text).toContain("## Your previous tasks");
    expect(taskAuthorText({ card: "c", jobMap: {}, facts: [], tasksPer: 3 })).not.toContain(
      "Rewrite",
    );
  });

  it("counts priming per card", () => {
    expect(primingCounts("eric.md: 4 priming hit(s) logged\nlint: clean")).toEqual({
      "eric.md": 4,
    });
  });

  it("turns a fact id into the oracle's answer, and an unknown one into a rewrite line", () => {
    const facts = [
      { viewer: "v", id: "x.count", answer: { kind: "number", value: 7 }, answerRegion: ["7"] },
      { viewer: "w", id: "y.only-w", answer: { kind: "number", value: 1 }, answerRegion: ["1"] },
    ];
    const unit = { member: "m", world: "w1", viewer: "v", start: "/s", key: "m--w1" };
    const drafts = [
      { scenario: "s1", answer: "a1", answerRegion: "x.count", outcome: "o" },
      { scenario: "s2", answer: "a2", answerRegion: "y.only-w", outcome: "o" },
    ];
    const r = resolveTasks({ drafts, facts, unit, file: "m--w1.json" });
    expect(r.tasks).toEqual([
      expect.objectContaining({
        id: "m--w1--t1",
        start: "/s",
        answer: { kind: "number", value: 7 },
        answerRegion: ["7"],
        fact: "x.count",
      }),
    ]);
    expect(r.problems).toEqual(["rewrite m--w1.json item 2 (unknown-fact)"]);
  });

  it("merges facts sheets, tagging each fact with its world", () => {
    const m = mergeFacts([
      {
        world: "a",
        facts: [{ viewer: "v", id: "1", answer: {}, answerRegion: [] }],
        dataNames: ["X"],
      },
      {
        world: "b",
        facts: [{ viewer: "v", id: "2", answer: {}, answerRegion: [] }],
        dataNames: ["X", "Y"],
      },
    ]);
    expect(m.facts.map((f) => f.world)).toEqual(["a", "b"]);
    expect(m.dataNames).toEqual(["X", "Y"]);
  });
});

describe("the canary", () => {
  it("asks the question roles/canary.md quotes", () => {
    const md = readFileSync(join(ROOT, "docs/members/study/roles/canary.md"), "utf8");
    expect(canaryQuestion(md)).toMatch(/^What do you know about this app/);
    expect(() => canaryQuestion("no quote")).toThrow();
  });

  it("fails on any knowledge or any other instructions", () => {
    expect(canaryVerdict({ knowledge: "", other_instructions: " " }).ok).toBe(true);
    expect(canaryVerdict({ knowledge: "it is a trading app", other_instructions: "" }).ok).toBe(
      false,
    );
    expect(canaryVerdict({ knowledge: "", other_instructions: "# CLAUDE.md" }).ok).toBe(false);
  });

  it("covers every blind role", () => {
    expect(BLIND_ROLES).toEqual(
      expect.arrayContaining(["framer", "task-author", "actor", "analyst", "expert", "words"]),
    );
  });
});

describe("key frames for the analyst", () => {
  const rec = (step: number, extra = {}) => ({
    step,
    frame: `/s/frames/00${step + 1}.jpg`,
    after: { pathname: "/app/x", search: `?s=${step}` },
    findings: [],
    ...extra,
  });

  it("keeps the first, the last, confusion ≥ 2, surprises and flagged actions — once each", () => {
    const turns = [
      { n: 0, step: 0, confusion: 0, last_expectation: { verdict: "match" } },
      { n: 1, step: 1, confusion: 2, last_expectation: { verdict: "match" } },
      { n: 2, step: 2, confusion: 0, last_expectation: { verdict: "surprise" } },
      { n: 3, step: 3, confusion: 0, last_expectation: { verdict: "match" } },
    ];
    const trace = [rec(0), rec(1, { findings: [{ kind: "involuntary-scroll" }] }), rec(2), rec(3)];
    const frames = keyFrames({ turns, trace, opening: "/s/frames/000.jpg", start: "/app/x" });
    expect(frames.map((f) => [f.path, f.why])).toEqual([
      ["/s/frames/000.jpg", ["first"]],
      ["/s/frames/001.jpg", ["confusion"]],
      ["/s/frames/002.jpg", ["finding", "surprise"]],
      ["/s/frames/004.jpg", ["last"]],
    ]);
    expect(frames[2]?.route).toBe("/app/x?s=1");
    expect(frames[0]?.route).toBe("/app/x");
  });

  it("a refused turn sees the frame it was shown; a session of one frame is first and last", () => {
    const turns = [{ n: 0, refused: "outside", confusion: 3 }];
    const frames = keyFrames({ turns, trace: [], opening: "/o.jpg", start: "/" });
    expect(frames).toEqual([
      { path: "/o.jpg", route: "/", why: ["first", "confusion", "last"], turns: [0] },
    ]);
  });

  it("caps frames keeping every first and last before anything else", () => {
    const f = (path: string, why: string[]) => ({ path, route: null, why, turns: [] });
    const sessions = [
      { frames: [f("a0", ["first"]), f("a1", ["confusion"]), f("a2", ["last"])] },
      { frames: [f("b0", ["first"]), f("b1", ["finding"]), f("b2", ["last"])] },
    ];
    const capped = capFrames(sessions, 5);
    expect(capped.dropped).toBe(1);
    expect(capped.sessions.map((s) => s.frames.map((x) => x.path))).toEqual([
      ["a0", "a1", "a2"],
      ["b0", "b2"],
    ]);
  });
});

describe("batching the census for the experts", () => {
  const entry = (order: number, route: string, viewport: string) => ({
    order,
    route,
    viewport,
    name: `c${order}`,
    frames: { before: `f/${order}a.jpg`, after: `f/${order}b.jpg` },
  });

  it("groups by census × route × viewport, ≤ size each, every entry kept verbatim in order", () => {
    const entries = [
      ...Array.from({ length: 23 }, (_, i) => entry(i, "/a", "phone")),
      entry(23, "/b", "phone"),
      entry(24, "/a", "desktop"),
    ];
    const batches = batchCensus([{ source: "c1", entries }], 20);
    expect(batches.map((b) => [b.route, b.viewport, b.entries.length])).toEqual([
      ["/a", "phone", 20],
      ["/a", "phone", 3],
      ["/b", "phone", 1],
      ["/a", "desktop", 1],
    ]);
    expect(batches.flatMap((b) => b.entries)).toEqual([
      ...entries.slice(0, 23),
      entries[23],
      entries[24],
    ]);
  });

  it("labels each operated control's before and after, skipping controls with no frames", () => {
    const frames = batchFrames([
      entry(0, "/a", "phone"),
      { order: 1, name: "skipped", status: "skipped" },
      entry(2, "/a", "phone"),
    ]);
    expect(frames.map((f) => [f.label, f.order, f.which])).toEqual([
      ["F1", 0, "before"],
      ["F2", 0, "after"],
      ["F3", 2, "before"],
      ["F4", 2, "after"],
    ]);
  });

  it("hands the expert the entries verbatim", () => {
    const batch = { route: "/a", viewport: "phone", entries: [{ weird: "exact ✓ text" }] };
    const text = expertBatchText({ cards: { m: "card" }, batch, frames: [], n: 1, of: 1 });
    expect(text).toContain('"weird": "exact ✓ text"');
  });
});

describe("collecting findings", () => {
  const analyst = fromAnalyst({
    member: "m",
    frames: { F1: { path: "s/frames/000.jpg", route: "/a", viewport: "phone" } },
    answer: {
      findings: [
        {
          what: "lost on the first screen",
          frames: ["F1", "F9"],
          quote: "where is it",
          voice: "member-voiced",
          level: "structural",
          severity: "High",
          frequency: { hit: 1, of: 2 },
        },
        {
          what: "page moved",
          frames: ["F1"],
          quote: "",
          voice: "instrument-only",
          level: "surface",
          severity: "Low",
        },
      ],
    },
  });
  const expert = fromExpert({
    k: 2,
    batch: {
      "B1.1": { frames: [{ path: "c/1.jpg", route: "/b", viewport: "phone" }] },
      "B2.1": { frames: [{ path: "c/2.jpg", route: "/b", viewport: "desktop" }] },
    },
    answer: {
      findings: [
        { what: "far from its control", from: ["B1.1", "B2.1"], level: "structural", severity: 3 },
      ],
    },
  });
  const words = fromWords({
    strings: { routes: { "/a": { label: [{ text: "Hi", viewports: ["phone"] }] } } },
    answer: {
      findings: [{ text: "Hi", route: "/a", where: "label", why: "vague", severity: "Moderate" }],
    },
  });
  const instruments = fromInstruments([
    {
      kind: "overflow",
      what: "box scrolls — ×3",
      snippet: "x",
      severity: "low",
      route: "/a",
      viewport: "phone",
      frame: "1.jpg",
    },
    {
      kind: "overflow",
      what: "box scrolls — ×3",
      snippet: "x",
      severity: "low",
      route: "/a",
      viewport: "phone",
      frame: "2.jpg",
    },
    {
      kind: "overflow",
      what: "box scrolls",
      snippet: "x",
      severity: "low",
      route: "/a",
      viewport: "desktop",
      frame: "3.jpg",
    },
  ]);

  it("classes analyst findings by voice, and resolves the frames they cite", () => {
    expect(analyst.map((f) => f.class)).toEqual(["member-voiced", "instrument-only"]);
    expect(analyst[0]?.surface).toEqual({ route: "/a", viewport: "phone" });
    expect(analyst[0]?.evidence).toEqual(["s/frames/000.jpg"]);
  });

  it("gives an expert finding the frames of every batch finding it came from", () => {
    expect(expert[0]).toMatchObject({
      class: "expert-2",
      surface: { route: "/b", viewport: "both" },
      evidence: ["c/1.jpg", "c/2.jpg"],
    });
  });

  it("places a words finding where the harvest saw the text", () => {
    expect(words[0]).toMatchObject({ class: "words", surface: { route: "/a", viewport: "phone" } });
  });

  it("folds repeats of one measurement into one finding with a count", () => {
    expect(instruments.map((f) => [f.surface.viewport, f.detail.times, f.evidence])).toEqual([
      ["phone", 2, ["1.jpg", "2.jpg"]],
      ["desktop", 1, ["3.jpg"]],
    ]);
  });

  it("normalises severity onto one scale", () => {
    expect([severityOf("High"), severityOf(4), severityOf(0), severityOf("medium")]).toEqual([
      "high",
      "critical",
      "none",
      "moderate",
    ]);
  });

  it("ids are stable and unique; classes kept apart; matchers get no trace of who found it", () => {
    const first = analyst[0] as (typeof analyst)[number];
    const groups = [analyst, expert, words, instruments, [first]];
    const a = collectFindings(groups);
    const b = collectFindings(groups);
    expect(a.findings.map((f) => f.id)).toEqual(b.findings.map((f) => f.id));
    expect(new Set(a.findings.map((f) => f.id)).size).toBe(a.findings.length);
    expect(a.findings.at(-1)?.id).toBe(`${findingId(first)}-2`);
    expect(Object.keys(a.classes)).toEqual(a.findings.map((f) => f.id));
    expect(a.classes[a.findings[2]?.id ?? ""]).toBe("expert-2");
    for (const f of stripClasses(a.findings)) {
      expect(Object.keys(f).sort()).toEqual(["id", "level", "severity", "surface", "what"]);
    }
    for (const f of a.findings) {
      expect(f).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          level: expect.any(String),
          severity: expect.any(String),
          surface: expect.any(Object),
          evidence: expect.any(Array),
        }),
      );
    }
  });
});

describe("the stub answers", () => {
  const stub = join(ROOT, "tests/fixtures/study-stub");
  const schemaFor: Record<string, string> = {
    canary: "canary",
    framer: "framer",
    "task-author": "task-author",
    actor: "actor-turn",
    ease: "ease",
    analyst: "analyst",
    expert: "expert",
    "expert-consolidation": "expert-consolidation",
    words: "words",
    "member-type-audit": "member-type-audit",
  };
  for (const [role, schema] of Object.entries(schemaFor)) {
    it(`${role}: every answer fits its schema`, () => {
      const s = JSON.parse(
        readFileSync(join(ROOT, "scripts/study/schemas", `${schema}.json`), "utf8"),
      );
      const files = readdirSync(join(stub, role)).filter((f) => f.endsWith(".json"));
      expect(files.length).toBeGreaterThan(0);
      for (const f of files) {
        const answer = JSON.parse(readFileSync(join(stub, role, f), "utf8"));
        expect(schemaProblems(s, answer)).toEqual([]);
      }
    });
  }

  it("seeds exactly one bad task, fixed in the rewrite", () => {
    const bad = JSON.parse(readFileSync(join(stub, "task-author/1.json"), "utf8"));
    const good = JSON.parse(readFileSync(join(stub, "task-author/2.json"), "utf8"));
    const key = readFileSync(join(stub, "sealed/keywords.txt"), "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#"));
    const hits = (tasks: { scenario: string }[]) =>
      tasks.map((t, i) => (key.some((k) => t.scenario.includes(k)) ? i + 1 : 0)).filter(Boolean);
    expect(hits(bad.tasks)).toEqual([2]);
    expect(hits(good.tasks)).toEqual([]);
  });
});
