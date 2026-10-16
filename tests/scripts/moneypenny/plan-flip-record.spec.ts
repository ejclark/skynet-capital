import { claimPlan } from "../../../scripts/moneypenny/index.mjs";
import { planReadyIntent } from "../../../scripts/moneypenny/plan-claim.mjs";

// #5334 — A REFUSED PLAN FLIP IS RECORDED, NOT DROPPED. A comment-flip carries no label, and the
// retry sweep reads only `ready` issues, so a flip that admission queued (#5281: "queued: 3 of 3 in
// flight") was lost until someone re-posted it. The refusal now applies `ready` — the label records
// the go the comment already gave. Every read and the one write are injected: no `gh`, no network.

const capsule = (surface: string) =>
  `**Do the thing.**\n\n| | |\n|---|---|\n| **Status** | ready |\n| **Surface** | ${surface} |\n| **Size** | ~1 PR |\n`;

const plan = (over: Record<string, unknown> = {}) => ({
  number: 5281,
  state: "open",
  body: capsule("the research day lens"),
  labels: [{ name: "enhancement" }, { name: "plan" }],
  ...over,
});
const busy = (number: number) => ({
  number,
  body: capsule(`surface ${number}`),
  labels: [{ name: "in-progress" }],
});

/** The gate's reads (the cap full by default) plus a recording `edit`. */
const setup = ({ position = "normal" as "normal" | "halt", inFlight = [1, 2, 3] } = {}) => {
  const edits: [number, string[]][] = [];
  const quiet = () => undefined;
  const deps = {
    readMode: () => ({ position, caps: { inFlightCap: 3 }, until: null, reason: "x" }),
    readInFlight: () => inFlight.map(busy),
    readPlans: () => [],
    comments: () => [],
    comment: quiet,
    log: quiet,
    edit: (n: number, args: string[]) => edits.push([n, args]) > 0,
  };
  return { deps, edits };
};
const flip = (issue = plan(), body = "ready") => ({ payload: { issue, comment: { body } } });
const blockedBy = (n: number) => ({ issue_dependencies_summary: { blocked_by: n } });
const labelled = (...names: string[]) => ({ labels: names.map((name) => ({ name })) });

describe("claimPlan — a refused comment-flip leaves `ready` on (#5334)", () => {
  it("records the flip as `ready` when the in-flight cap queues it", () => {
    const { deps, edits } = setup();
    const r = claimPlan(flip(), 0, "abc", deps);
    expect(r).toEqual({ claimed: false, reason: "queued: 3 of 3 in flight" });
    expect(edits).toEqual([[5281, ["--add-label", "ready"]]]);
  });

  it("records it under work-mode:halt too — any admission refusal, not just the cap", () => {
    const { deps, edits } = setup({ position: "halt", inFlight: [] });
    expect(claimPlan(flip(), 0, "abc", deps).claimed).toBe(false);
    expect(edits).toEqual([[5281, ["--add-label", "ready"]]]);
  });

  it("records a flip held back only by open blockers — the sweep starts it when they close", () => {
    const { deps, edits } = setup({ inFlight: [] });
    const r = claimPlan(flip(plan(blockedBy(1))), 0, "abc", deps);
    expect(r.claimed).toBe(false);
    expect(r.reason).toContain("blocked by 1 open issue");
    expect(edits).toEqual([[5281, ["--add-label", "ready"]]]);
  });

  it("writes nothing when the plan already carries `ready`", () => {
    const { deps, edits } = setup();
    claimPlan(flip(plan(labelled("plan", "ready"))), 0, "abc", deps);
    expect(edits).toEqual([]);
  });

  it.each(["needs-eric", "in-progress"])("never labels a plan carrying %s, blocked or not", (l) => {
    const { deps, edits } = setup({ inFlight: [] });
    claimPlan(flip(plan({ ...blockedBy(1), ...labelled("plan", l) })), 0, "abc", deps);
    expect(edits).toEqual([]);
  });

  it("never labels on the label door — that event already carries `ready`", () => {
    const { deps, edits } = setup();
    const issue = plan(labelled("plan", "ready"));
    claimPlan({ payload: { action: "labeled", label: { name: "ready" }, issue } }, 0, "a", deps);
    expect(edits).toEqual([]);
  });

  it("never labels a comment that is not a flip", () => {
    const { deps, edits } = setup();
    claimPlan(flip(plan(), "can you clarify the second bullet?"), 0, "abc", deps);
    expect(edits).toEqual([]);
  });
});

describe("planReadyIntent — `blocked` marks a flip refused only for open blockers", () => {
  it("is set when blockers are the only reason", () => {
    const intent = planReadyIntent(flip(plan(blockedBy(2))));
    expect(intent).toMatchObject({ ready: false, blocked: true, issue: { number: 5281 } });
  });

  it("is absent when the plan is also parked", () => {
    const parked = plan({ ...blockedBy(2), ...labelled("plan", "needs-info") });
    expect(planReadyIntent(flip(parked)).blocked).toBeUndefined();
  });
});
