import { spawnSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { measure, multiHomeConcepts } from "../../scripts/crawl/cohesion.mjs";
import {
  clause,
  GOALS,
  parseArgs,
  renderJson,
  renderText,
  scorecard,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/loop-scorecard.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { backlogStock } from "../../scripts/newsletter/backlog.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { needsEric, openIssues } from "../../scripts/newsletter/gather.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { needsEric as needsEricSum } from "../../scripts/newsletter/metrics.mjs";

// The loop scorecard (#8199, the sense step of #8161 stage 3). Each case pins a way the scorecard
// could print a healthy-looking number that is wrong: a failed read printed as 0, a second copy of
// the newsletter's count drifting from it, the census's git rows leaking into the multi-home count,
// a cancelled CI run read as the journeys' verdict, or an off-goal row told by colour alone.

const AS_OF = Date.parse("2026-11-24T16:00:00Z");
const ago = (h: number) => new Date(AS_OF - h * 3600000).toISOString();

type Routes = Record<string, unknown | ((path: string) => unknown)>;

/** The counted REST layer on saved inputs: the first route whose key the path starts with answers. */
function fakeRest(routes: Routes) {
  const rest = {
    calls: 0,
    api(path: string) {
      rest.calls += 1;
      const key = Object.keys(routes).find((k) => path.startsWith(k));
      if (!key) throw new Error(`no saved input for ${path}`);
      const hit = routes[key];
      if (hit instanceof Error) throw hit;
      return typeof hit === "function" ? (hit as (p: string) => unknown)(path) : hit;
    },
  };
  return rest;
}

const R = "repos/ejclark/skynet-capital";
const OPEN = [
  { number: 1, labels: [{ name: "ready" }], created_at: ago(50), updated_at: ago(2) },
  { number: 2, labels: [{ name: "plan" }], created_at: ago(500), updated_at: ago(30) },
  { number: 3, labels: [], created_at: ago(5), updated_at: ago(5), pull_request: {} },
  { number: 4, labels: [{ name: "needs-eric" }], created_at: ago(300), updated_at: ago(1) },
];
const ASKS = [4, 5, 6, 7].map((n) => ({
  number: n,
  title: `ask ${n}`,
  body: "",
  labels: [{ name: "needs-eric" }],
}));
const labeled = (h: number) => [
  { event: "labeled", label: { name: "needs-eric" }, created_at: ago(h) },
];
const RUNS = {
  workflow_runs: [
    { id: 30, head_sha: "c".repeat(40) },
    { id: 20, head_sha: "b".repeat(40) },
    { id: 10, head_sha: "a".repeat(40) },
  ],
};
const jobs = (conclusion: string | null, status = "completed") => ({
  jobs: [
    { name: "deploy", status: "completed", conclusion: "cancelled" },
    { name: "integration tests", status, conclusion, completed_at: ago(4) },
  ],
});

function saved(over: Routes = {}): Routes {
  return {
    [`${R}/issues?labels=needs-eric`]: ASKS,
    [`${R}/issues/4/events`]: labeled(24 * 9),
    [`${R}/issues/5/events`]: labeled(24 * 2),
    [`${R}/issues/6/events`]: labeled(24),
    [`${R}/issues/7/events`]: [],
    [`${R}/issues?state=open`]: OPEN,
    [`${R}/issues/8150`]: { state: "open" },
    [`${R}/issues/8169`]: { state: "open" },
    [`${R}/actions/workflows/pipeline.yml/runs`]: RUNS,
    [`${R}/actions/runs/30/jobs`]: jobs("cancelled"),
    [`${R}/actions/runs/20/jobs`]: jobs("success"),
    [`${R}/actions/runs/10/jobs`]: jobs("failure"),
    ...over,
  };
}

const read = (over: Routes = {}, extra = {}) =>
  scorecard({
    rest: fakeRest(saved(over)),
    asOfMs: AS_OF,
    multiHome: () => [{ id: "a" }, { id: "b" }],
    gaps: () => [{ step: "x" }, { step: "y" }, { step: "z" }],
    ...extra,
  });
type Row = {
  id: string;
  value: unknown;
  goal: string;
  source: string;
  status: string;
  detail?: string | null;
};
type Ids = "openIssues" | "needsEric" | "multiHome" | "journeys" | "phone" | "back";
const byId = (rows: Row[]) => Object.fromEntries(rows.map((r) => [r.id, r])) as Record<Ids, Row>;

describe("the six rows", () => {
  it("prints each number with its value, #8161's goal and its source (criterion 1)", () => {
    const rows = read();
    expect(rows.map((r: { id: string }) => r.id)).toEqual([
      "openIssues",
      "needsEric",
      "multiHome",
      "journeys",
      "phone",
      "back",
    ]);
    for (const r of rows) {
      expect(r.goal).toBe(GOALS[r.id]);
      expect(r.source).toBeTruthy();
    }
    const b = byId(rows);
    expect(b.openIssues.value).toBe(3);
    expect(b.needsEric).toMatchObject({ value: 4, status: "off goal", detail: "oldest 9 days" });
    expect(b.multiHome).toMatchObject({ value: 2, status: "off goal" });
  });

  it("reads open issues and needs-eric with the newsletter's own reads and sums (criterion 5)", () => {
    const rows = byId(read());
    const rest = fakeRest(saved());
    expect(rows.openIssues.value).toBe(backlogStock(openIssues(rest), AS_OF).open);
    const sum = needsEricSum(needsEric(rest), AS_OF);
    expect(rows.needsEric.value).toBe(sum.count);
    expect(rows.needsEric.detail).toBe(`oldest ${sum.oldestDays} days`);
  });

  it("judges needs-eric against ≤ 3, and leaves open issues unjudged without a series", () => {
    const three = byId(read({ [`${R}/issues?labels=needs-eric`]: ASKS.slice(0, 3) }));
    expect(three.needsEric.status).toBe("on goal");
    expect(three.openIssues.status).toBe("no verdict");
  });
});

describe("a source that cannot be read (criterion 2)", () => {
  it("says unavailable with its reason, never 0, and the other rows still print", () => {
    const rows = byId(
      read(
        { [`${R}/issues?state=open`]: new Error("gh api: HTTP 502\nmore") },
        {
          multiHome: () => {
            throw new Error("IA.md has no §2f");
          },
        },
      ),
    );
    expect(rows.openIssues).toMatchObject({
      value: null,
      status: "unavailable",
      detail: "unavailable: gh api: HTTP 502",
    });
    expect(rows.multiHome).toMatchObject({ value: null, detail: "unavailable: IA.md has no §2f" });
    expect(rows.needsEric.value).toBe(4);
    expect(rows.journeys.value).toBe("green");
    const text = renderText(Object.values(rows), { asOfMs: AS_OF, tree: "main abc1234" });
    expect(text).toContain("unavailable: gh api: HTTP 502");
    expect(clause(Object.values(rows))).toContain("scorecard ? open");
  });

  it("exits 1 on an unknown flag, before reading anything", () => {
    expect(parseArgs(["--json"])).toEqual({ json: true, help: false });
    expect(parseArgs(["--jsn"]).error).toContain("--jsn");
    const res = spawnSync(process.execPath, ["scripts/loop-scorecard.mjs", "--bogus"], {
      encoding: "utf8",
    });
    expect(res.status).toBe(1);
    expect(res.stdout).toBe("");
  });
});

describe("a number whose source is not built yet (criterion 3)", () => {
  it("says pending with the issue that builds it, read live", () => {
    const rows = byId(read());
    expect(rows.phone).toMatchObject({ value: "pending", status: "pending", detail: "#8150 open" });
    expect(rows.back).toMatchObject({ value: "pending", detail: "#8169 open" });
  });

  it("says landed: reader not wired once that issue closes", () => {
    const rows = byId(read({ [`${R}/issues/8169`]: { state: "closed" } }));
    expect(rows.back).toMatchObject({ value: "landed: reader not wired", status: "landed" });
    expect(clause(Object.values(rows))).toContain("back unwired");
  });
});

describe("the multi-home row (criterion 4)", () => {
  it("equals the census's counts.multiHomeConcepts on the same tree, read with no git", () => {
    const census = measure().counts.multiHomeConcepts;
    expect(multiHomeConcepts().length).toBe(census);
    const rows = byId(read({}, { multiHome: multiHomeConcepts }));
    expect(rows.multiHome.value).toBe(census);
  });
});

describe("the journeys row (criterion 6)", () => {
  it("takes the newest finished integration job, skipping a cancelled one", () => {
    const rows = byId(read());
    expect(rows.journeys).toMatchObject({
      value: "green",
      status: "on goal",
      source: "pipeline run 20",
    });
    expect(rows.journeys.detail).toContain("bbbbbbb · 4h ago · 3 known gaps");
    expect(rows.journeys.detail).toContain("whole e2e suite");
  });

  it("reads red, off goal, when that job failed", () => {
    const rows = byId(read({ [`${R}/actions/runs/20/jobs`]: jobs("failure") }));
    expect(rows.journeys).toMatchObject({ value: "red", status: "off goal" });
  });

  it("skips a job still running and is unavailable when no run finished one", () => {
    const rows = byId(
      read({
        [`${R}/actions/runs/20/jobs`]: jobs(null, "in_progress"),
        [`${R}/actions/runs/10/jobs`]: jobs("skipped"),
      }),
    );
    expect(rows.journeys.status).toBe("unavailable");
    expect(clause(Object.values(rows))).toContain("journeys unknown");
  });
});

describe("rendering", () => {
  it("marks off goal with a symbol and a word, never colour alone (criterion 7)", () => {
    const text = renderText(read(), { asOfMs: AS_OF, tree: "main abc1234" });
    expect(text).toMatch(/Open needs-eric\s+4\s+▲ off goal · goal ≤ 3/);
    expect(text).not.toContain(String.fromCharCode(27));
    expect(text.split("\n").at(-1)).toBe(
      "scorecard 3 open · 4 asks · 2 two-home · journeys green · phone pending · back pending",
    );
  });

  it("prints the same rows as JSON with value, goal, source and status (criterion 8)", () => {
    const out = JSON.parse(renderJson(read(), { asOfMs: AS_OF, tree: "main abc1234" }));
    expect(out.rows).toHaveLength(6);
    for (const r of out.rows)
      expect(Object.keys(r)).toEqual(expect.arrayContaining(["value", "goal", "source", "status"]));
    expect(out.clause).toContain("scorecard 3 open");
  });

  it("counts the REST calls it spent (criterion 9)", () => {
    const rest = fakeRest(saved());
    scorecard({ rest, asOfMs: AS_OF, multiHome: () => [], gaps: () => [] });
    // open issues 1 · needs-eric 1 + 4 events · runs 1 + jobs 2 · two issue states
    expect(rest.calls).toBe(11);
  });
});
