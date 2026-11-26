import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@rstest/core";
import {
  backlogFlow,
  backlogStock,
  candidatePrs,
  refsOf,
  rework,
  reworkCandidates,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/newsletter/backlog.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { buildNewsletter } from "../../scripts/newsletter/build.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { windowOf } from "../../scripts/newsletter/week.mjs";

// Backlog flow and rework (#8037 slice 1). WHEN the weekly newsletter is generated, it SHALL show
// the open-plan stock without `ready`, the un-readied `feedback` stock, inflow and outflow for the
// week, and reverts plus fix-forwards within 48h per autonomous decision. Each case pins a way the
// number could look healthy while being wrong: a parked issue counted as pile, a fix after 48h
// counted as rework, a decision still inside its 48h counted clean, or old inputs read as zero.

const AS_OF = Date.parse("2026-11-23T00:05:00Z");
const W47 = windowOf("2026-W47", AS_OF); // 2026-11-16 .. 2026-11-23
const ago = (d: number) => new Date(AS_OF - d * 86400000).toISOString();

describe("backlogStock — the open pile at the moment of the run", () => {
  const issues = [
    { number: 1, labels: ["plan"], createdAt: ago(30), updatedAt: ago(20) },
    { number: 2, labels: ["plan"], createdAt: ago(5), updatedAt: ago(1) },
    { number: 3, labels: ["plan", "ready"], createdAt: ago(40), updatedAt: ago(40) },
    { number: 4, labels: [{ name: "feedback" }], createdAt: ago(16), updatedAt: ago(2) },
    { number: 5, labels: ["feedback", "ready"], createdAt: ago(50), updatedAt: ago(1) },
    { number: 6, labels: ["feedback", "in-progress"], createdAt: ago(60), updatedAt: ago(1) },
    { number: 7, labels: ["feedback", "needs-info"], createdAt: ago(90), updatedAt: ago(1) },
    { number: 8, labels: [], createdAt: ago(3), updatedAt: ago(3) },
  ];
  const s = backlogStock(issues, AS_OF);

  it("counts plans without ready, and splits the old and the untouched ones out", () => {
    expect(s.plans).toEqual({ open: 3, unready: 2, unreadyOld: 1, unreadyUntouched: 1 });
    expect([s.open, s.ready, s.needsInfo]).toEqual([8, 2, 1]);
  });

  it("counts only the flip's pool as un-readied feedback: parked and in-progress stay out", () => {
    expect(s.feedback).toEqual({ unready: 1, oldestDays: 16 });
  });

  it("reads no feedback age when the pool is empty, never 0 days", () => {
    expect(backlogStock([], AS_OF).feedback).toEqual({ unready: 0, oldestDays: null });
  });
});

describe("backlogFlow — inflow against outflow inside the week", () => {
  it("counts opened and closed by their own dates, superseded closes included", () => {
    const issues = [
      { number: 1, labels: ["plan"], createdAt: "2026-11-17T00:00:00Z", closedAt: null },
      {
        number: 2,
        labels: ["plan"],
        createdAt: "2026-10-01T00:00:00Z",
        closedAt: "2026-11-18T00:00:00Z",
        stateReason: "not_planned",
      },
      {
        number: 3,
        labels: ["feedback"],
        createdAt: "2026-11-20T00:00:00Z",
        closedAt: "2026-11-21T00:00:00Z",
        stateReason: "completed",
      },
      // touched in the week, but opened before it and still open: neither inflow nor outflow
      { number: 4, labels: ["feedback"], createdAt: "2026-11-01T00:00:00Z", closedAt: null },
      // closed after the week ended: next week's outflow
      {
        number: 5,
        labels: [],
        createdAt: "2026-11-01T00:00:00Z",
        closedAt: "2026-11-23T01:00:00Z",
        stateReason: "completed",
      },
    ];
    const f = backlogFlow(issues, W47);
    expect(f.all).toEqual({ opened: 2, closed: 2, completed: 1, notPlanned: 1, net: 0 });
    expect(f.plans).toEqual({ opened: 1, closed: 1, completed: 0, notPlanned: 1, net: 0 });
    expect(f.feedback).toEqual({ opened: 1, closed: 1, completed: 1, notPlanned: 0, net: 0 });
  });
});

describe("rework — reverts and fix-forwards within 48h, per autonomous decision", () => {
  const pr = (number: number, title: string, mergedAt: string, refs: number[] = []) => ({
    number,
    title,
    author: "claude[bot]",
    headRef: `plan/${number}`,
    mergedAt,
    refs,
  });
  const prs = [
    pr(10, "feat(app): a card", "2026-11-17T10:00:00Z"),
    pr(11, 'Revert "feat(app): a card"', "2026-11-17T12:00:00Z", [10]),
    pr(12, "feat(study): a slice", "2026-11-18T10:00:00Z", [8005]),
    pr(13, "fix(study): what the slice missed (#8005)", "2026-11-19T09:00:00Z", [12, 8005]),
    pr(14, "docs(process): a rule", "2026-11-18T10:00:00Z"),
    // names #14, but 49h later: outside the 48h, so #14 is clean
    pr(15, "fix(process): a later tidy", "2026-11-20T11:00:00Z", [14]),
    // a feat naming #14 inside 48h is not rework: only a revert or a fix is
    pr(16, "feat(process): builds on it", "2026-11-18T12:00:00Z", [14]),
    { ...pr(17, "build(deps): bump x", "2026-11-18T10:00:00Z"), author: "dependabot[bot]" },
    // merged 2026-11-22: its 48h runs past the moment of the run, so it is open, not clean
    pr(18, "feat(app): late in the week", "2026-11-22T12:00:00Z"),
    // merged before the week: never a decision of this one
    pr(9, "feat(app): last week", "2026-11-15T12:00:00Z"),
    // a research call: graded by the research scorecard, never a decision here
    { ...pr(19, "docs(research): a pulse", "2026-11-18T10:00:00Z"), headRef: "research/x" },
    // W47's real shape (#7900 → #7902): a fix naming the commit that turned a flaky check red,
    // with no file in common. The name alone is not rework.
    pr(20, "docs(digest): 2026-11-19", "2026-11-19T10:00:00Z"),
    pr(21, "fix(e2e): pin the calendar (#20 exposed it)", "2026-11-19T11:00:00Z", [20]),
  ];
  const files = {
    10: ["app/card.tsx"],
    11: ["app/card.tsx"],
    12: ["scripts/study.mjs"],
    13: ["scripts/study.mjs", "tests/study.spec.ts"],
    20: ["docs/digests/2026-11-19.md"],
    21: ["tests/e2e/calendar.spec.ts"],
  };
  const r = rework(prs, W47, AS_OF, files);

  it("names each reworked decision with what reworked it", () => {
    expect(r.items).toEqual([
      { number: 10, kind: "code", how: "revert", by: 11 },
      { number: 12, kind: "code", how: "fix-forward", by: 13 },
    ]);
    expect([r.reverted, r.fixedForward]).toEqual([1, 1]);
  });

  it("reads changed files only for the candidate pairs", () => {
    expect(candidatePrs(reworkCandidates(prs, W47, AS_OF))).toEqual([10, 11, 12, 13, 20, 21]);
  });

  it("rates over the decisions whose 48h has closed, dependabot and research left out", () => {
    // decisions: 10 11 12 13 14 15 16 18 20 21 (10); open: 18 → 9 scored; 2 reworked
    expect([r.decisions, r.open, r.rate]).toEqual([10, 1, 0.22]);
    expect(r.byKind.code).toEqual({ decisions: 7, reworked: 2 });
    expect(r.byKind.process).toEqual({ decisions: 2, reworked: 0 });
    expect(r.byKind.research).toBeUndefined();
    // GitHub's own revert title carries no Conventional type, so it reads as `other`
    expect(r.byKind.other).toEqual({ decisions: 1, reworked: 0 });
  });

  it("does not count a fix that merged after the moment of the run", () => {
    const early = Date.parse("2026-11-19T00:00:00Z");
    expect(rework(prs, windowOf("2026-W47", early), early, files).items).toEqual([
      { number: 10, kind: "code", how: "revert", by: 11 },
    ]);
  });

  it("reads unknown, never zero, on old inputs or a failed file read", () => {
    const old = prs.map(({ refs: _refs, ...rest }) => rest);
    expect(rework(old, W47, AS_OF, files)).toMatch(/^unavailable: /);
    expect(rework(prs, W47, AS_OF, "unavailable: gh api: 502")).toBe("unavailable: gh api: 502");
    expect(rework(prs, W47, AS_OF, undefined)).toMatch(/^unavailable: /);
  });
});

// #8061: this repo's main fix-forward path names the audit's bug issue, not the decision. The audit
// files bug #B saying "Introduced in #A", and the lane's fix closes #B. WHEN a fix names an issue
// whose Introduced in cell names a decision, the fix SHALL pair with that decision (W48's real case:
// fix #8043 named only #6701 and itself, while #6701's body said "Introduced in #6569").
describe("rework — a fix that closes the audit's bug issue pairs with the PR it names", () => {
  const audit = (number: number, introduced: string) => ({
    number,
    created_at: "2026-11-16T18:00:00Z",
    body: `| | |\n|---|---|\n| **Found by** | Post-merge audit 2026-11-16 |\n| **Introduced in** | ${introduced} · \`scripts/x.mjs:12\` |\n`,
  });
  const pr = (number: number, title: string, mergedAt: string, body = "") => ({
    number,
    title,
    author: "claude[bot]",
    headRef: `feedback/${number}`,
    mergedAt,
    refs: refsOf(title, body),
  });
  const prs = [
    pr(100, "feat(x): thing", "2026-11-16T12:00:00Z"),
    pr(102, "fix(x): repair (#101) (#102)", "2026-11-17T12:00:00Z", "Closes #101"),
  ];
  const files = { 100: ["scripts/x.mjs"], 102: ["scripts/x.mjs"] };

  it("pairs the fix with the decision the bug issue names", () => {
    expect(prs[1]?.refs).toEqual([101, 102]);
    expect(reworkCandidates(prs, W47, AS_OF, [audit(101, "#100")])).toEqual([
      { decision: 100, by: 102, revert: false },
    ]);
    const r = rework(prs, W47, AS_OF, files, [audit(101, "#100")]);
    expect(r.items).toEqual([{ number: 100, kind: "code", how: "fix-forward", by: 102 }]);
    expect(r.rate).toBe(0.5);
  });

  it("keeps a defect that predates the decision out: 'before #N' names no culprit", () => {
    expect(reworkCandidates(prs, W47, AS_OF, [audit(101, "before #100")])).toEqual([]);
  });

  it("still needs a shared file, so an issue naming the decision is not rework on its own", () => {
    const apart = { ...files, 102: ["scripts/y.mjs"] };
    expect(rework(prs, W47, AS_OF, apart, [audit(101, "#100")]).items).toEqual([]);
  });

  it("reads unknown, never fewer fix-forwards, when the audit issues could not be read", () => {
    expect(rework(prs, W47, AS_OF, files, "unavailable: search: 403")).toBe(
      "unavailable: search: 403",
    );
  });
});

describe("refsOf — the numbers a PR names", () => {
  it("reads #N and GitHub's revert body, once each", () => {
    expect(
      refsOf('Revert "feat: x (#8030)"', "Reverts ejclark/skynet-capital#8030\n\nPart of #8005"),
    ).toEqual([8005, 8030]);
    expect(refsOf("chore: tidy", null)).toEqual([]);
  });
});

describe("the newsletter carries the three readings", () => {
  const FIXTURE = fileURLToPath(
    new URL("../fixtures/newsletter/inputs-2026-W45.json", import.meta.url),
  );
  const inputs = () => JSON.parse(readFileSync(FIXTURE, "utf8"));

  it("builds each from its own read, and a failed read costs only its own metric", () => {
    const n = buildNewsletter({
      ...inputs(),
      openIssues: [
        {
          number: 1,
          labels: ["plan"],
          createdAt: "2026-10-01T00:00:00Z",
          updatedAt: "2026-10-01T00:00:00Z",
        },
      ],
      issueActivity: "unavailable: gh api: 502",
    });
    expect(n.metrics.backlogStock.plans.unready).toBe(1);
    expect(n.metrics.backlogFlow).toBe("unavailable: gh api: 502");
    // the W45 fixture predates PR references: rework reads unknown, not a clean week
    expect(n.metrics.rework).toMatch(/^unavailable: /);
  });

  it("reads a source the inputs never held as null", () => {
    const n = buildNewsletter(inputs());
    expect([n.metrics.backlogStock, n.metrics.backlogFlow]).toEqual([null, null]);
  });
});
