import {
  admitBuild,
  gateAdmission,
  holdsCapSeat,
  isFreshPlan,
  nextAdmissible,
  readOpenPlans,
  startedPlanInputs,
  waitingPlans,
} from "../../../scripts/moneypenny/admission.mjs";
import { issue, mode } from "../../support/admission-fixtures.js";

// #4393 slice 4, criterion 6 — stop starting, start finishing. When the board's Waiting column
// holds `startedPlanCap` plans, a FRESH plan is refused; the next slice of a started plan never is.
describe("the started-plan cap (#4393 criterion 6)", () => {
  const planMode = { position: "normal" as const, caps: { inFlightCap: 3, startedPlanCap: 2 } };
  /** A started plan nobody is building — what the board shows in Waiting. */
  const idle = (n: number) => ({
    ...issue(n, `w${n}`, ["plan", "ready"]),
    sub_issues_summary: { total: 3, completed: 1 },
  });
  const fresh = issue(50, "new surface", ["plan", "ready"]);

  it("WHEN Waiting is at the cap, refuses a plan with zero closed sub-issues", () => {
    expect(admitBuild({ issue: fresh, mode: planMode, waiting: [idle(1), idle(2)] })).toEqual({
      admit: false,
      reason: "queued: 2 started plans waiting (cap 2) — finish one before starting a new plan",
    });
  });

  it("admits a fresh plan below the cap", () => {
    expect(admitBuild({ issue: fresh, mode: planMode, waiting: [idle(1)] }).admit).toBe(true);
  });

  it("still admits the next slice of an already-started plan at the cap", () => {
    const nextSlice = {
      ...issue(51, "x", ["plan", "ready"]),
      sub_issues_summary: { total: 4, completed: 2 },
    };
    const slicedByPr = issue(52, "y", ["plan", "ready", "next-slice"]);
    const waiting = [idle(1), idle(2)];
    expect(admitBuild({ issue: nextSlice, mode: planMode, waiting }).admit).toBe(true);
    expect(admitBuild({ issue: slicedByPr, mode: planMode, waiting }).admit).toBe(true);
  });

  it("never refuses a feedback item, and fast-track bypasses it like the in-flight cap", () => {
    const waiting = [idle(1), idle(2)];
    const feedback = issue(53, "z", ["feedback", "ready"]);
    const urgent = issue(54, "q", ["plan", "ready", "fast-track"]);
    expect(admitBuild({ issue: feedback, mode: planMode, waiting }).admit).toBe(true);
    expect(admitBuild({ issue: urgent, mode: planMode, waiting }).admit).toBe(true);
  });

  it("is skipped when the caller passed no Waiting list (a continuation, or an old caller)", () => {
    expect(admitBuild({ issue: fresh, mode: planMode }).admit).toBe(true);
  });

  it("counts what the board shows in Waiting — not a blocked plan, not one being built", () => {
    const plans = [
      idle(1),
      { ...idle(2), labels: [{ name: "plan" }, { name: "in-progress" }] },
      {
        ...idle(3),
        labels: [{ name: "plan" }, { name: "needs-info" }],
      },
      issue(4, "a", ["plan", "ready"]), // fresh
      issue(5, "b", ["plan", "next-slice"]),
    ];
    expect(waitingPlans(plans).map((p) => p.number)).toEqual([1, 5]);
  });

  it("isFreshPlan: a plan with no closed sub-issue and no next-slice", () => {
    expect(isFreshPlan(fresh)).toBe(true);
    expect(isFreshPlan(idle(1))).toBe(false);
    expect(isFreshPlan(issue(9, "f", ["feedback"]))).toBe(false);
  });

  it("fills the issue's own sub-issue counts from the plan list when its copy lacks them", () => {
    const payload = issue(7, "p", ["plan", "ready"]); // an event payload with no summary
    const { issue: filled, waiting } = startedPlanInputs(payload, [idle(7), idle(8)]);
    expect(isFreshPlan(filled)).toBe(false);
    expect(waiting.map((p) => p.number)).toEqual([7, 8]);
  });

  it("readOpenPlans pages through every open plan and drops pull requests", () => {
    const asked: string[] = [];
    const rows = readOpenPlans((path) => {
      asked.push(path);
      if (path.endsWith("/sub_issues")) return [];
      return [
        { number: 1, labels: [{ name: "plan" }], sub_issues_summary: { total: 2, completed: 1 } },
        { number: 2, pull_request: {} },
      ];
    });
    expect(asked[0]).toBe("issues?state=open&labels=plan");
    expect(rows.map((r) => r.number)).toEqual([1]);
    expect(rows[0]?.sub_issues_summary).toEqual({ total: 2, completed: 1 });
  });

  describe("a seat is held only while a lane could pull the plan's next work (2026-10-18)", () => {
    const started = (
      n: number,
      labels: string[],
      openSubIssues?: { number: number; labels: { name: string }[] }[],
    ) => ({
      ...issue(n, `s${n}`, ["plan", ...labels]),
      sub_issues_summary: { total: 3, completed: 1 },
      ...(openSubIssues ? { openSubIssues } : {}),
    });
    const sub = (n: number, labels: string[]) => ({
      number: n,
      labels: labels.map((name) => ({ name })),
    });

    it("frees the seat of a plan whose open sub-issues are unready sub-plans or unlabelled stories", () => {
      const stuck = started(1, [], [sub(10, ["enhancement", "plan"]), sub(11, ["enhancement"])]);
      expect(holdsCapSeat(stuck)).toBe(false);
      expect(waitingPlans([stuck])).toEqual([]);
    });

    it("keeps the seat while the plan itself is ready, or a non-plan sub-issue is", () => {
      expect(holdsCapSeat(started(2, ["ready", "next-slice"], []))).toBe(true);
      expect(holdsCapSeat(started(3, [], [sub(12, ["enhancement", "ready"])]))).toBe(true);
    });

    it("does not count a ready sub-PLAN as the parent's pullable work — the child is admitted on its own", () => {
      expect(holdsCapSeat(started(4, [], [sub(13, ["plan", "ready"])]))).toBe(false);
    });

    it("keeps the old count for a row it could not enrich — the cap never loosens on a missed read", () => {
      expect(holdsCapSeat(started(5, []))).toBe(true);
    });

    it("admits a fresh plan at the cap when its parent holds a seat: it IS that parent's remaining work", () => {
      const seats = [started(20, ["ready"], []), started(21, ["ready"], [])];
      const child = {
        ...issue(60, "child", ["plan", "ready"]),
        parent_issue_url: "https://api.github.com/repos/o/r/issues/20",
      };
      const stranger = issue(61, "other", ["plan", "ready"]);
      expect(admitBuild({ issue: child, mode: planMode, waiting: seats }).admit).toBe(true);
      expect(admitBuild({ issue: stranger, mode: planMode, waiting: seats }).admit).toBe(false);
    });

    it("readOpenPlans reads open sub-issues only for started plans with some open, and survives a failed read", () => {
      const asked: string[] = [];
      const rows = readOpenPlans((path) => {
        asked.push(path);
        if (path === "issues/1/sub_issues")
          return [
            { number: 9, state: "open", labels: [{ name: "plan" }] },
            { number: 8, state: "closed", labels: [] },
          ];
        if (path === "issues/3/sub_issues") throw new Error("boom");
        return [
          { number: 1, labels: [{ name: "plan" }], sub_issues_summary: { total: 2, completed: 1 } },
          {
            number: 2,
            labels: [{ name: "plan" }, { name: "next-slice" }],
            sub_issues_summary: { total: 1, completed: 1 },
          },
          { number: 3, labels: [{ name: "plan" }], sub_issues_summary: { total: 2, completed: 1 } },
          { number: 4, labels: [{ name: "plan" }], sub_issues_summary: { total: 0, completed: 0 } },
        ];
      });
      expect(asked).toEqual([
        "issues?state=open&labels=plan",
        "issues/1/sub_issues",
        "issues/3/sub_issues",
      ]);
      expect(rows[0]?.openSubIssues).toEqual([{ number: 9, labels: [{ name: "plan" }] }]);
      expect(rows[1]?.openSubIssues).toEqual([]);
      expect(rows[2]?.openSubIssues).toBeUndefined(); // the failed read keeps the old count
      expect(rows[3]?.openSubIssues).toBeUndefined(); // a fresh plan holds no seat anyway
    });
  });

  describe("through gateAdmission", () => {
    const setup = (over: Record<string, unknown> = {}) => {
      let planReads = 0;
      const posted: [number, string][] = [];
      const deps = {
        readMode: () => ({ ...planMode, until: null, reason: "set to normal" }),
        readInFlight: () => [],
        readPlans: () => {
          planReads += 1;
          return [idle(1), idle(2)];
        },
        comments: () => [],
        comment: (n: number, body: string) => posted.push([n, body]),
        log: () => undefined,
        ...over,
      };
      return { deps, posted, planReads: () => planReads };
    };

    it("refuses a fresh plan at the cap and posts one queue note", () => {
      const s = setup();
      expect(gateAdmission(fresh, s.deps).reason).toContain("2 started plans waiting");
      expect(s.posted).toHaveLength(1);
    });

    it("a continuation (`started`) skips the cap and the plan read entirely", () => {
      const s = setup();
      expect(gateAdmission(fresh, { ...s.deps, started: true }).admit).toBe(true);
      expect(s.planReads()).toBe(0);
    });

    it("reads no plans for a feedback item, nor once a cheaper rule already refused", () => {
      const s = setup();
      gateAdmission(issue(60, "f", ["feedback", "ready"]), s.deps);
      const halted = setup({ readMode: () => ({ ...mode("halt", 0), until: null, reason: "x" }) });
      gateAdmission(fresh, halted.deps);
      expect(s.planReads()).toBe(0);
      expect(halted.planReads()).toBe(0);
    });

    it("fails closed, with no note, when the open plans cannot be read", () => {
      const s = setup({
        readPlans: () => {
          throw new Error("HTTP 502");
        },
      });
      expect(gateAdmission(fresh, s.deps)).toEqual({
        admit: false,
        reason: "queued: the open plans could not be read",
      });
      expect(s.posted).toEqual([]);
    });
  });

  it("the sweep steps past a fresh plan the cap refuses and takes the next pullable item", () => {
    const pick = nextAdmissible(
      [
        { ...fresh, createdAt: "2026-09-01T00:00:00Z" },
        { ...issue(61, "g", ["feedback", "ready"]), createdAt: "2026-09-02T00:00:00Z" },
      ],
      [],
      planMode,
      [idle(1), idle(2)],
    );
    expect(pick?.number).toBe(61);
  });
});
